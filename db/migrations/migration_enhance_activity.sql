-- Migration: Enhance Activity Schema
-- This script safely migrates the existing activity table to the enhanced version

BEGIN;

-- Step 1: Add new columns to existing activity table
ALTER TABLE activity 
ADD COLUMN IF NOT EXISTS customer_uid INTEGER,
ADD COLUMN IF NOT EXISTS activity_category varchar(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS metadata jsonb,
ADD COLUMN IF NOT EXISTS created_by varchar(50),
ADD COLUMN IF NOT EXISTS is_visible_to_bd boolean DEFAULT true;

-- Step 2: Rename existing column for clarity
ALTER TABLE activity RENAME COLUMN bd TO bd_in_charge;

-- Step 3: Add foreign key constraint for customer relationship
ALTER TABLE activity 
ADD CONSTRAINT fk_activity_customer 
FOREIGN KEY (customer_uid) REFERENCES customer(customer_uid) ON DELETE CASCADE;

-- Step 4: Add check constraints
ALTER TABLE activity 
ADD CONSTRAINT check_activity_category 
CHECK (activity_category IN ('manual', 'system', 'automated'));

ALTER TABLE activity 
ADD CONSTRAINT check_entity_relationship 
CHECK (lead_id IS NOT NULL OR customer_uid IS NOT NULL);

-- Step 5: Update existing data
-- Set all existing activities as manual (since they were created by BD)
UPDATE activity 
SET activity_category = 'manual', 
    created_by = bd_in_charge,
    is_visible_to_bd = true
WHERE activity_category IS NULL OR activity_category = '';

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_lead_id ON activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_customer_uid ON activity(customer_uid);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_category ON activity(activity_category);
CREATE INDEX IF NOT EXISTS idx_activity_date_created ON activity(date_created DESC);

-- Step 7: Create helper function for system activities
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
BEGIN
    INSERT INTO activity (
        lead_id, 
        customer_uid, 
        activity_type, 
        activity_category,
        description, 
        metadata,
        created_by,
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
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger functions for automatic activity tracking
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
        -- Only track significant changes, not every update
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

-- Step 9: Create triggers (only if they don't exist)
DROP TRIGGER IF EXISTS lead_activity_tracker ON lead;
CREATE TRIGGER lead_activity_tracker
    AFTER INSERT OR UPDATE ON lead
    FOR EACH ROW
    EXECUTE FUNCTION track_lead_changes();

DROP TRIGGER IF EXISTS customer_activity_tracker ON customer;
CREATE TRIGGER customer_activity_tracker
    AFTER INSERT OR UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION track_customer_changes();

-- Step 10: Create useful views
CREATE OR REPLACE VIEW v_manual_activities AS
SELECT * FROM activity WHERE activity_category = 'manual';

CREATE OR REPLACE VIEW v_system_activities AS
SELECT * FROM activity WHERE activity_category = 'system';

CREATE OR REPLACE VIEW v_lead_timeline AS
SELECT 
    a.*,
    l.full_name as lead_name,
    l.company_name,
    l.status as current_lead_status
FROM activity a
LEFT JOIN lead l ON a.lead_id = l.lead_id
WHERE a.lead_id IS NOT NULL
ORDER BY a.date_created DESC;

CREATE OR REPLACE VIEW v_customer_timeline AS
SELECT 
    a.*,
    c.name as customer_name
FROM activity a
LEFT JOIN customer c ON a.customer_uid = c.customer_uid
WHERE a.customer_uid IS NOT NULL
ORDER BY a.date_created DESC;

-- Step 11: Verify the migration
DO $$
DECLARE
    activity_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO activity_count FROM activity;
    RAISE NOTICE 'Migration completed successfully. Total activities: %', activity_count;
END $$;

COMMIT; 