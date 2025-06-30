-- Migration: Remove customer_uid from activities (lead-centric model)
-- This migration converts customer-based activities to lead-based activities
-- and removes the customer_uid column from the activity table

-- Step 1: Create a helper function to find the primary lead for a customer
CREATE OR REPLACE FUNCTION get_primary_lead_id(p_customer_uid INTEGER)
RETURNS INTEGER AS $$
DECLARE
    primary_lead_id INTEGER;
BEGIN
    -- Get the primary lead for this customer via contact table
    SELECT c.lead_id INTO primary_lead_id
    FROM contact c
    WHERE c.customer_uid = p_customer_uid 
    AND c.is_primary_contact = true
    LIMIT 1;
    
    -- If no primary contact found, get the first contact
    IF primary_lead_id IS NULL THEN
        SELECT c.lead_id INTO primary_lead_id
        FROM contact c
        WHERE c.customer_uid = p_customer_uid
        ORDER BY c.date_added ASC
        LIMIT 1;
    END IF;
    
    RETURN primary_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update all activities that have customer_uid but no lead_id
-- Set their lead_id to the customer's primary lead
UPDATE activity 
SET lead_id = get_primary_lead_id(customer_uid)
WHERE customer_uid IS NOT NULL 
AND lead_id IS NULL
AND get_primary_lead_id(customer_uid) IS NOT NULL;

-- Step 3: For activities that have both customer_uid and lead_id, keep the lead_id
-- (These are likely already correct)

-- Step 4: Log any orphaned activities (customer_uid with no corresponding lead)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM activity 
    WHERE customer_uid IS NOT NULL 
    AND lead_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Warning: % activities have customer_uid but no corresponding lead found. These will lose customer association.', orphaned_count;
    END IF;
END;
$$;

-- Step 5: Drop the foreign key constraint on customer_uid
ALTER TABLE activity DROP CONSTRAINT IF EXISTS activity_customer_uid_fkey;

-- Step 6: Drop the customer_uid column
ALTER TABLE activity DROP COLUMN IF EXISTS customer_uid;

-- Step 7: Drop the index on customer_uid
DROP INDEX IF EXISTS idx_activity_customer_uid;

-- Step 8: Update the check constraint to only require lead_id
ALTER TABLE activity DROP CONSTRAINT IF EXISTS activity_check;
ALTER TABLE activity ADD CONSTRAINT activity_lead_required CHECK (lead_id IS NOT NULL);

-- Step 9: Update database functions to remove customer_uid parameters

-- Updated create_system_activity function (remove customer_uid parameter)
CREATE OR REPLACE FUNCTION create_system_activity(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_lead_id INTEGER,
    p_metadata JSONB DEFAULT NULL,
    p_created_by VARCHAR(50) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    default_assigned_to VARCHAR(50);
BEGIN
    -- Get the bd_in_charge from lead
    SELECT bd_in_charge INTO default_assigned_to FROM lead WHERE lead_id = p_lead_id;
    
    -- Insert the system activity (completed immediately)
    INSERT INTO activity (
        lead_id, activity_type, activity_category, description, 
        activity_metadata, created_by, assigned_to, status, 
        date_created, date_completed
    ) VALUES (
        p_lead_id, p_activity_type, 'system', p_description,
        p_metadata, p_created_by, default_assigned_to, 'completed',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Updated create_manual_activity function (remove customer_uid parameter)
CREATE OR REPLACE FUNCTION create_manual_activity(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_lead_id INTEGER,
    p_created_by VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    default_assigned_to VARCHAR(50);
    final_created_by VARCHAR(50);
BEGIN
    -- Get the bd_in_charge from lead
    SELECT bd_in_charge INTO default_assigned_to FROM lead WHERE lead_id = p_lead_id;
    
    final_created_by := COALESCE(p_created_by, default_assigned_to);
    
    -- Insert the manual activity (completed immediately)
    INSERT INTO activity (
        lead_id, activity_type, activity_category, description,
        created_by, assigned_to, status, date_created, date_completed
    ) VALUES (
        p_lead_id, p_activity_type, 'manual', p_description,
        final_created_by, default_assigned_to, 'completed',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Updated create_task function (remove customer_uid parameter)
CREATE OR REPLACE FUNCTION create_task(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_due_date TIMESTAMP,
    p_lead_id INTEGER,
    p_priority VARCHAR(10) DEFAULT 'medium',
    p_assigned_to VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    default_assigned_to VARCHAR(50);
    final_assigned_to VARCHAR(50);
BEGIN
    -- Get the bd_in_charge from lead
    SELECT bd_in_charge INTO default_assigned_to FROM lead WHERE lead_id = p_lead_id;
    
    final_assigned_to := COALESCE(p_assigned_to, default_assigned_to);
    
    -- Insert the task (pending until completed)
    INSERT INTO activity (
        lead_id, activity_type, activity_category, description, due_date,
        status, priority, assigned_to, created_by, date_completed
    ) VALUES (
        p_lead_id, p_activity_type, 'manual', p_description, p_due_date,
        'pending', p_priority, final_assigned_to, final_assigned_to, NULL
    ) RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Update trigger functions to handle the new structure

-- Updated track_customer_changes function
CREATE OR REPLACE FUNCTION track_customer_changes()
RETURNS TRIGGER AS $$
DECLARE
    primary_lead_id INTEGER;
    change_description TEXT;
    metadata_json JSONB;
BEGIN
    -- Get the primary lead for this customer
    SELECT c.lead_id INTO primary_lead_id
    FROM contact c
    WHERE c.customer_uid = NEW.customer_uid AND c.is_primary_contact = true
    LIMIT 1;
    
    -- If no primary lead found, skip activity creation
    IF primary_lead_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        change_description := 'Customer created: ' || NEW.name;
        metadata_json := jsonb_build_object(
            'event_type', 'customer_created',
            'customer_uid', NEW.customer_uid,
            'customer_name', NEW.name,
            'customer_type', NEW.type
        );
        
        PERFORM create_system_activity(
            'customer_created',
            change_description,
            primary_lead_id,
            metadata_json
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        change_description := 'Customer updated: ' || NEW.name;
        metadata_json := jsonb_build_object(
            'event_type', 'customer_updated',
            'customer_uid', NEW.customer_uid,
            'changes', jsonb_build_object(
                'old_name', OLD.name,
                'new_name', NEW.name,
                'old_type', OLD.type,
                'new_type', NEW.type,
                'old_is_closed', OLD.is_closed,
                'new_is_closed', NEW.is_closed
            )
        );
        
        PERFORM create_system_activity(
            'customer_updated',
            change_description,
            primary_lead_id,
            metadata_json
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Update views to reflect new structure
DROP VIEW IF EXISTS v_tasks;
DROP VIEW IF EXISTS v_completed_activities;
DROP VIEW IF EXISTS v_overdue_tasks;
DROP VIEW IF EXISTS v_system_activities;
DROP VIEW IF EXISTS v_manual_activities;

-- Recreate views without customer_uid references
CREATE OR REPLACE VIEW v_tasks AS
SELECT 
    a.*,
    l.full_name as lead_name,
    l.company_name,
    l.bd_in_charge
FROM activity a
JOIN lead l ON a.lead_id = l.lead_id
WHERE a.status IN ('pending', 'in_progress') 
OR a.due_date IS NOT NULL;

CREATE OR REPLACE VIEW v_completed_activities AS
SELECT 
    a.*,
    l.full_name as lead_name,
    l.company_name,
    l.bd_in_charge
FROM activity a
JOIN lead l ON a.lead_id = l.lead_id
WHERE a.status = 'completed' AND a.due_date IS NULL;

CREATE OR REPLACE VIEW v_overdue_tasks AS
SELECT 
    a.*,
    l.full_name as lead_name,
    l.company_name,
    l.bd_in_charge
FROM activity a
JOIN lead l ON a.lead_id = l.lead_id
WHERE a.due_date < CURRENT_TIMESTAMP 
AND a.status IN ('pending', 'in_progress');

CREATE OR REPLACE VIEW v_system_activities AS
SELECT 
    a.*,
    l.full_name as lead_name,
    l.company_name,
    l.bd_in_charge
FROM activity a
JOIN lead l ON a.lead_id = l.lead_id
WHERE a.activity_category = 'system';

CREATE OR REPLACE VIEW v_manual_activities AS
SELECT 
    a.*,
    l.full_name as lead_name,
    l.company_name,
    l.bd_in_charge
FROM activity a
JOIN lead l ON a.lead_id = l.lead_id
WHERE a.activity_category = 'manual';

-- Clean up helper function (no longer needed after migration)
DROP FUNCTION IF EXISTS get_primary_lead_id(INTEGER);

-- Migration completed successfully
COMMENT ON TABLE activity IS 'Activities and tasks are now lead-centric. Customer activities are accessed via the lead-customer relationship through the contact table.'; 