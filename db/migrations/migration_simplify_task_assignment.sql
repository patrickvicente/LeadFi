-- Migration: Simplify Task Assignment - Default assigned_to to bd_in_charge
-- This updates the activity table to make assigned_to default to bd_in_charge

BEGIN;

-- Update existing NULL assigned_to values to match bd_in_charge
UPDATE activity 
SET assigned_to = bd_in_charge 
WHERE assigned_to IS NULL AND bd_in_charge IS NOT NULL;

-- Update the helper function to default assigned_to to bd_in_charge
CREATE OR REPLACE FUNCTION create_task(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_due_date TIMESTAMP,
    p_lead_id INTEGER DEFAULT NULL,
    p_customer_uid INTEGER DEFAULT NULL,
    p_priority VARCHAR(10) DEFAULT 'medium',
    p_assigned_to VARCHAR(50) DEFAULT NULL,
    p_bd_in_charge VARCHAR(20) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    final_assigned_to VARCHAR(50);
BEGIN
    -- Default assigned_to to bd_in_charge if not specified
    final_assigned_to := COALESCE(p_assigned_to, p_bd_in_charge);
    
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
        bd_in_charge,
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
        p_bd_in_charge,
        final_assigned_to,
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Update the create_manual_activity function to also default assigned_to
CREATE OR REPLACE FUNCTION create_manual_activity(
    p_activity_type VARCHAR(50),
    p_description TEXT,
    p_lead_id INTEGER DEFAULT NULL,
    p_customer_uid INTEGER DEFAULT NULL,
    p_bd_in_charge VARCHAR(20) DEFAULT NULL,
    p_assigned_to VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_activity_id INTEGER;
    final_assigned_to VARCHAR(50);
BEGIN
    -- Default assigned_to to bd_in_charge if not specified
    final_assigned_to := COALESCE(p_assigned_to, p_bd_in_charge);
    
    INSERT INTO activity (
        lead_id, 
        customer_uid, 
        activity_type, 
        activity_category,
        description, 
        status,
        date_completed,
        assigned_to,
        bd_in_charge,
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
        final_assigned_to,
        p_bd_in_charge,
        final_assigned_to,
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Verify the migration
DO $$
DECLARE
    unassigned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unassigned_count 
    FROM activity 
    WHERE assigned_to IS NULL AND bd_in_charge IS NOT NULL;
    
    RAISE NOTICE 'Migration completed. Unassigned tasks remaining: %', unassigned_count;
END $$;

COMMIT; 