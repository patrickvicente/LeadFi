-- Migration: Remove bd_in_charge redundancy from activity table
-- This removes bd_in_charge column and updates assigned_to to default to lead.bd_in_charge

BEGIN;

-- Step 1: Update assigned_to to use lead.bd_in_charge for activities that don't have assigned_to set
UPDATE activity 
SET assigned_to = COALESCE(
    activity.assigned_to,
    lead.bd_in_charge,
    activity.bd_in_charge  -- fallback to current value
)
FROM lead 
WHERE activity.lead_id = lead.lead_id 
AND activity.assigned_to IS NULL;

-- Step 2: Update remaining activities (customer-only activities)
-- Get BD from the customer's primary lead via contact table
UPDATE activity 
SET assigned_to = COALESCE(
    activity.assigned_to,
    lead.bd_in_charge,
    activity.bd_in_charge  -- fallback to current value
)
FROM customer
JOIN contact ON customer.customer_uid = contact.customer_uid AND contact.is_primary_contact = true
JOIN lead ON contact.lead_id = lead.lead_id
WHERE activity.customer_uid = customer.customer_uid 
AND activity.lead_id IS NULL
AND activity.assigned_to IS NULL;

-- Step 3: For any remaining NULL assigned_to, use the current bd_in_charge
UPDATE activity 
SET assigned_to = bd_in_charge 
WHERE assigned_to IS NULL AND bd_in_charge IS NOT NULL;

-- Step 4: Drop dependent views first, then the bd_in_charge column
DROP VIEW IF EXISTS v_manual_activities CASCADE;
DROP VIEW IF EXISTS v_system_activities CASCADE;
DROP VIEW IF EXISTS v_lead_timeline CASCADE;
DROP VIEW IF EXISTS v_customer_timeline CASCADE;
DROP VIEW IF EXISTS v_tasks CASCADE;
DROP VIEW IF EXISTS v_completed_activities CASCADE;
DROP VIEW IF EXISTS v_overdue_tasks CASCADE;
DROP VIEW IF EXISTS v_upcoming_tasks CASCADE;

-- Now we can drop the bd_in_charge column
ALTER TABLE activity DROP COLUMN bd_in_charge;

-- Recreate the views without bd_in_charge
CREATE OR REPLACE VIEW v_tasks AS
SELECT * FROM activity 
WHERE status IN ('pending', 'in_progress') 
ORDER BY due_date ASC NULLS LAST, priority DESC;

CREATE OR REPLACE VIEW v_completed_activities AS
SELECT * FROM activity 
WHERE status = 'completed'
ORDER BY date_created DESC;

CREATE OR REPLACE VIEW v_overdue_tasks AS
SELECT * FROM activity 
WHERE status IN ('pending', 'in_progress') 
AND due_date < CURRENT_TIMESTAMP
ORDER BY due_date ASC;

CREATE OR REPLACE VIEW v_system_activities AS
SELECT * FROM activity WHERE activity_category = 'system';

CREATE OR REPLACE VIEW v_manual_activities AS
SELECT * FROM activity WHERE activity_category = 'manual';

-- Step 5: Update the create_system_activity function
CREATE OR REPLACE FUNCTION create_system_activity(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_lead_id INTEGER DEFAULT NULL,
    p_customer_uid INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_created_by VARCHAR(50) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    default_assigned_to VARCHAR(50);
BEGIN
    -- Get the bd_in_charge from lead or customer's primary lead
    IF p_lead_id IS NOT NULL THEN
        SELECT bd_in_charge INTO default_assigned_to FROM lead WHERE lead_id = p_lead_id;
    ELSIF p_customer_uid IS NOT NULL THEN
        -- Get BD from customer's primary lead via contact table
        SELECT l.bd_in_charge INTO default_assigned_to 
        FROM lead l
        JOIN contact c ON l.lead_id = c.lead_id
        WHERE c.customer_uid = p_customer_uid AND c.is_primary_contact = true
        LIMIT 1;
    END IF;
    
    INSERT INTO activity (
        lead_id, 
        customer_uid, 
        activity_type, 
        activity_category,
        description, 
        metadata,
        created_by,
        assigned_to,
        is_visible_to_bd
    )
    VALUES (
        p_lead_id,
        p_customer_uid,
        p_activity_type,
        'system',
        p_description,
        p_metadata,
        p_created_by,
        default_assigned_to,
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update the create_task function
CREATE OR REPLACE FUNCTION create_task(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_due_date TIMESTAMP,
    p_lead_id INTEGER DEFAULT NULL,
    p_customer_uid INTEGER DEFAULT NULL,
    p_priority VARCHAR(10) DEFAULT 'medium',
    p_assigned_to VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    default_assigned_to VARCHAR(50);
    final_assigned_to VARCHAR(50);
BEGIN
    -- Get the bd_in_charge from lead or customer's primary lead
    IF p_lead_id IS NOT NULL THEN
        SELECT bd_in_charge INTO default_assigned_to FROM lead WHERE lead_id = p_lead_id;
    ELSIF p_customer_uid IS NOT NULL THEN
        -- Get BD from customer's primary lead via contact table
        SELECT l.bd_in_charge INTO default_assigned_to 
        FROM lead l
        JOIN contact c ON l.lead_id = c.lead_id
        WHERE c.customer_uid = p_customer_uid AND c.is_primary_contact = true
        LIMIT 1;
    END IF;
    
    -- Use provided assigned_to or default to entity's bd_in_charge
    final_assigned_to := COALESCE(p_assigned_to, default_assigned_to);
    
    INSERT INTO activity (
        lead_id, 
        customer_uid, 
        activity_type, 
        activity_category,
        description, 
        due_date,
        status,
        priority,
        assigned_to,
        created_by,
        is_visible_to_bd
    )
    VALUES (
        p_lead_id,
        p_customer_uid,
        p_activity_type,
        'manual',
        p_description,
        p_due_date,
        'pending',
        p_priority,
        final_assigned_to,
        final_assigned_to,  -- creator is the same as assignee by default
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Update the create_manual_activity function
CREATE OR REPLACE FUNCTION create_manual_activity(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_lead_id INTEGER DEFAULT NULL,
    p_customer_uid INTEGER DEFAULT NULL,
    p_created_by VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    default_assigned_to VARCHAR(50);
    final_created_by VARCHAR(50);
BEGIN
    -- Get the bd_in_charge from lead or customer's primary lead
    IF p_lead_id IS NOT NULL THEN
        SELECT bd_in_charge INTO default_assigned_to FROM lead WHERE lead_id = p_lead_id;
    ELSIF p_customer_uid IS NOT NULL THEN
        -- Get BD from customer's primary lead via contact table
        SELECT l.bd_in_charge INTO default_assigned_to 
        FROM lead l
        JOIN contact c ON l.lead_id = c.lead_id
        WHERE c.customer_uid = p_customer_uid AND c.is_primary_contact = true
        LIMIT 1;
    END IF;
    
    -- Use provided created_by or default to entity's bd_in_charge
    final_created_by := COALESCE(p_created_by, default_assigned_to);
    
    INSERT INTO activity (
        lead_id, 
        customer_uid, 
        activity_type, 
        activity_category,
        description, 
        status,
        date_completed,
        assigned_to,
        created_by,
        is_visible_to_bd
    )
    VALUES (
        p_lead_id,
        p_customer_uid,
        p_activity_type,
        'manual',
        p_description,
        'completed',
        CURRENT_TIMESTAMP,
        default_assigned_to,  -- assigned to the bd_in_charge
        final_created_by,
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update trigger functions to use the new approach
CREATE OR REPLACE FUNCTION track_lead_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (lead created)
    IF TG_OP = 'INSERT' THEN
        PERFORM create_system_activity(
            'lead_created',
            format('Lead "%s" created by %s', NEW.full_name, NEW.bd_in_charge),
            NEW.lead_id,
            NULL,
            json_build_object(
                'company_name', NEW.company_name,
                'source', NEW.source,
                'type', NEW.type,
                'status', NEW.status
            )::jsonb,
            NEW.bd_in_charge
        );
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (lead updated)
    IF TG_OP = 'UPDATE' THEN
        -- Track status changes specifically
        IF OLD.status != NEW.status THEN
            PERFORM create_system_activity(
                'status_changed',
                format('Lead status changed from "%s" to "%s"', OLD.status, NEW.status),
                NEW.lead_id,
                NULL,
                json_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'lead_name', NEW.full_name
                )::jsonb,
                NEW.bd_in_charge
            );
        END IF;
        
        -- Track conversion
        IF OLD.is_converted = false AND NEW.is_converted = true THEN
            PERFORM create_system_activity(
                'lead_converted',
                format('Lead "%s" converted to customer', NEW.full_name),
                NEW.lead_id,
                NULL,
                json_build_object(
                    'company_name', NEW.company_name,
                    'final_status', NEW.status
                )::jsonb,
                NEW.bd_in_charge
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update customer tracking function
CREATE OR REPLACE FUNCTION track_customer_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (customer created)
    IF TG_OP = 'INSERT' THEN
        PERFORM create_system_activity(
            'customer_created',
            format('Customer "%s" created (ID: %s)', NEW.name, NEW.customer_uid),
            NULL,
            NEW.customer_uid,
            json_build_object(
                'customer_name', NEW.name,
                'customer_uid', NEW.customer_uid,
                'type', NEW.type
            )::jsonb,
            'system'
        );
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (customer updated)
    IF TG_OP = 'UPDATE' THEN
        -- Only track significant changes
        IF OLD.name != NEW.name OR OLD.type != NEW.type OR OLD.is_closed != NEW.is_closed THEN
            PERFORM create_system_activity(
                'customer_updated',
                format('Customer "%s" updated', NEW.name),
                NULL,
                NEW.customer_uid,
                json_build_object(
                    'customer_name', NEW.name,
                    'old_name', OLD.name,
                    'new_name', NEW.name,
                    'old_closed', OLD.is_closed,
                    'new_closed', NEW.is_closed
                )::jsonb,
                'system'
            );
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Verify the migration
DO $$
DECLARE
    unassigned_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unassigned_count FROM activity WHERE assigned_to IS NULL;
    SELECT COUNT(*) INTO total_count FROM activity;
    
    RAISE NOTICE 'Migration completed. Total activities: %, Unassigned: %', total_count, unassigned_count;
    
    IF unassigned_count > 0 THEN
        RAISE WARNING 'Still have % activities without assigned_to!', unassigned_count;
    END IF;
END $$;

COMMIT; 