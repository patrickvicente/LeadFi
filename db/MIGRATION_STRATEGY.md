# Migration Strategy for LeadFi Activity System

## Current State (December 2025)

The activity system has been fully migrated to the final clean architecture. The database structure matches `init.sql`.

## Migration Files Status

### ✅ ACTIVE - Use for fresh installations:
- **`init.sql`** - Complete database schema (DEFINITIVE SOURCE)
- **`migration_add_registered_email.sql`** - Adds registered_email to customer table

### ⚠️ OBSOLETE - These were applied but are now superseded:
- **`migration_enhance_activity.sql`** - Superseded by final state in init.sql
- **`migration_add_task_features.sql`** - Superseded by final state in init.sql  
- **`migration_simplify_task_assignment.sql`** - Superseded by remove_bd_in_charge
- **`migration_remove_bd_in_charge_redundancy.sql`** - Successfully applied, now in init.sql

## For Fresh Database Setup:
1. Run `init.sql` (contains all final changes)
2. Run `migration_add_registered_email.sql` if needed
3. Run `seed.sql` for sample data

## For Existing Database:
The database is already at the final state. No further migrations needed.

## Key Changes Made:
1. ✅ Removed `bd_in_charge` from activity table (eliminated redundancy)
2. ✅ Added task management fields (due_date, status, priority, assigned_to)
3. ✅ Added system activity tracking with triggers
4. ✅ Added activity categorization (manual, system, automated)
5. ✅ Created comprehensive views for task management
6. ✅ Functions auto-assign to lead/customer BD via contact relationship

## Final Architecture:
```sql
activity: {
  created_by,           -- Who created the activity
  assigned_to,          -- Who should do it (defaults to lead.bd_in_charge)
  -- No bd_in_charge field (eliminated redundancy)
}

lead/customer: {
  bd_in_charge         -- Single source of truth
}
```

## Database Functions Status:
- ✅ `create_task()` - Working (no bd_in_charge param)
- ✅ `create_manual_activity()` - Working (no bd_in_charge param)  
- ✅ `create_system_activity()` - Working (gets BD from lead/customer)
- ✅ All triggers - Working (automatic activity tracking) 