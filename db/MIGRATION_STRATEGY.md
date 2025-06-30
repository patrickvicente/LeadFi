# Migration Strategy for LeadFi Activity System

## Current State (June 2025)

The activity system has been fully migrated with proper completion date logic. The database structure matches `init.sql`.

## Migration Organization

### Folder Structure
- **`db/migrations/`** - All migration files organized in subfolder
- **`db/init.sql`** - Complete database schema (DEFINITIVE SOURCE)
- **`db/seed.sql`** - Sample data for development

## Migration Files Status

### ✅ APPLIED - Located in `db/migrations/`:
- **`migration_enhance_activity.sql`** - Enhanced activity table with task features
- **`migration_add_task_features.sql`** - Added task management capabilities
- **`migration_simplify_task_assignment.sql`** - Simplified assignment logic
- **`migration_add_registered_email.sql`** - Added registered_email to customer table
- **`migration_remove_bd_in_charge_redundancy.sql`** - Removed bd_in_charge redundancy
- **`migration_fix_metadata_column.sql`** - Fixed SQLAlchemy naming conflict (metadata → activity_metadata)
- **`migration_fix_completion_dates.sql`** - Fixed completion date logic for activities vs tasks
- **`migration_remove_customer_uid_from_activities.sql`** - Transition to lead-centric model

### 📁 DEFINITIVE SOURCE:
- **`db/init.sql`** - Complete schema reflecting all migrations

## For Fresh Database Setup:
1. Run `db/init.sql` (contains all final changes)
2. Run `db/seed.sql` for sample data (optional)

## For Existing Database:
All migrations have been applied. Database is at final state with proper completion date logic.

## Key Changes Made:

### 1. Enhanced Activity System:
- ✅ Activity table supports both activities and tasks
- ✅ Task management fields (due_date, status, priority, assigned_to, date_completed)
- ✅ Activity categorization (manual, system, automated)
- ✅ System activity tracking with triggers

### 2. Completion Date Logic (Latest):
- ✅ **Activities** (immediate): `date_completed = date_created`
- ✅ **Tasks** (pending): `date_completed = null` until completed
- ✅ **System activities**: completed immediately via triggers
- ✅ Database trigger automatically sets completion dates

### 3. Schema Improvements:
- ✅ Fixed metadata → activity_metadata (SQLAlchemy compatibility)
- ✅ Removed bd_in_charge redundancy from activity table
- ✅ Added bd_in_charge and date_converted to customer table
- ✅ Added registered_email to customer table

## Current Activity vs Task Logic

### Activities (Immediate Actions)
```sql
-- When creating an activity (no due_date):
INSERT INTO activity (...) VALUES (..., due_date: NULL, status: 'completed');
-- Result: date_completed automatically set to date_created via trigger
```

### Tasks (Future Actions)  
```sql
-- When creating a task (with due_date):
INSERT INTO activity (...) VALUES (..., due_date: '2025-07-01', status: 'pending');
-- Result: date_completed remains NULL until task is completed
```

## Final Architecture:

### Activity Table:
```sql
CREATE TABLE activity (
    activity_id serial PRIMARY KEY,
    lead_id int REFERENCES lead(lead_id),
    customer_uid int REFERENCES customer(customer_uid),
    activity_type varchar(50) NOT NULL,
    activity_category varchar(20) DEFAULT 'manual',
    description text,
    activity_metadata jsonb, -- renamed from metadata
    date_created timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(50),
    is_visible_to_bd boolean DEFAULT true,
    
    -- Task fields
    due_date timestamp,
    status varchar(20) DEFAULT 'completed',
    priority varchar(10) DEFAULT 'medium', 
    assigned_to varchar(50),
    date_completed timestamp -- Auto-set for activities, manual for tasks
);
```

### Customer Table:
```sql
CREATE TABLE customer (
    customer_uid INTEGER PRIMARY KEY,
    registered_email varchar(120),
    type varchar(50),
    name varchar(120) NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    date_closed timestamp,
    country varchar(50),
    bd_in_charge varchar(20), -- Single source of truth
    date_created timestamp DEFAULT CURRENT_TIMESTAMP,
    date_converted timestamp -- When lead was converted
);
```

## Database Functions Status:
- ✅ `create_system_activity()` - Creates system activities (immediate completion)
- ✅ `create_manual_activity()` - Creates BD activities (immediate completion)
- ✅ `create_task()` - Creates tasks (pending until completed)
- ✅ `set_activity_completion()` - Trigger to auto-set completion dates
- ✅ `track_lead_changes()` - Auto-creates activities on lead changes
- ✅ `track_customer_changes()` - Auto-creates activities on customer changes

## API Integration:
- ✅ ActivityTaskModal supports both modes (activity/task)
- ✅ Frontend sends due_date → creates task (pending)
- ✅ Frontend omits due_date → creates activity (completed immediately)
- ✅ Proper JSON serialization with method fields in schema

## Deployment Notes:
- All migrations are idempotent and can be re-run safely
- `init.sql` represents the definitive schema state
- For production: backup before running any migrations
- Test completion date logic thoroughly after deployment 

## Lead-Centric Model Benefits

### Why Remove customer_uid from Activities?

1. **Single Source of Truth**: Every customer started as a lead, so all activities can trace back to the original lead
2. **Simplified Data Model**: No more dual lead_id/customer_uid confusion
3. **Better Relationship Tracking**: Full journey from lead → customer in activity history
4. **Cleaner Frontend Logic**: Only need to select leads, not choose between lead or customer
5. **Easier Reporting**: Conversion funnel analysis becomes straightforward

### How Customer Activities Work Now

```sql
-- Customer activities are accessed via lead relationship:
-- customer → contact table → lead → activities

-- Example: Get activities for customer_uid = 123
SELECT a.* FROM activity a
JOIN contact c ON a.lead_id = c.lead_id
WHERE c.customer_uid = 123;
```

### Migration Process for customer_uid Removal

1. **Data Preservation**: All existing customer activities are converted to lead activities via contact table
2. **Relationship Mapping**: Uses primary contact to link customer activities to correct lead
3. **Orphan Handling**: Logs any activities that can't be mapped to leads
4. **Function Updates**: All database functions now require lead_id parameter
5. **View Recreation**: All views updated to join with lead table for entity information

## Activity vs Task Completion Logic

### Current Implementation (Post-Migration)

- **Activities** (immediate actions): `date_completed = date_created` (completed right away)
- **Tasks** (pending/in_progress): `date_completed = null` until actually completed
- **System Activities**: Always completed immediately with `date_completed = date_created`

### Database Functions

```sql
-- Create immediate activity (completed)
SELECT create_manual_activity('call', 'Called client', 123);

-- Create pending task (due_date required)
SELECT create_task('follow_up', 'Follow up with proposal', '2024-01-15 10:00:00', 123, 'high');

-- Create system activity (completed immediately)  
SELECT create_system_activity('lead_created', 'Lead was created', 123, '{"source": "website"}');
```

## Deployment Instructions

### Running Migrations

```bash
# Apply all migrations in order
cd /db/migrations

# Apply the customer_uid removal migration
psql -d leadfi_db -f migration_remove_customer_uid_from_activities.sql
```

### Post-Migration Verification

```sql
-- Verify no customer_uid column exists
\d activity

-- Check all activities have lead_id
SELECT COUNT(*) FROM activity WHERE lead_id IS NULL;  -- Should be 0

-- Verify customer activities are accessible
SELECT COUNT(*) FROM activity a
JOIN contact c ON a.lead_id = c.lead_id
WHERE c.customer_uid = [test_customer_id];

-- Test database functions
SELECT create_system_activity('test', 'Migration test', 1);
```

### Frontend Code Updates Status

✅ **ActivityTaskModal updated**: Now shows lead selection when not pre-filled  
✅ **Unified form approach**: Single ActivityTaskModal for all activity/task creation  
✅ **Customer modals updated**: Pass primary lead_id instead of customer_uid  
✅ **ActivityForm removed**: Consolidated into ActivityTaskModal  
✅ **Lead-centric validation**: All forms now require lead_id  
✅ **Backend API compatibility**: Customer activities still accessible via API

## Current Database Schema Status

- ✅ Activity table is lead-centric only
- ✅ All database functions updated for lead-only model
- ✅ Views recreated with lead joins
- ✅ Triggers updated for lead-centric activity creation
- ✅ Customer info accessible via `get_customer_info()` method

## Notes

- **Backwards Compatibility**: Not maintained for customer_uid in activities (breaking change)
- **Data Migration**: All existing customer activities preserved by linking to primary lead
- **Performance**: Improved due to simpler queries and single foreign key
- **Future Development**: All new activities/tasks must specify lead_id 