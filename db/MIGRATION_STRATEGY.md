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