-- Migration: Add Task Features to Activity Table
-- This extends the activity table to support task management

BEGIN;

-- Add task-related columns to existing activity table
ALTER TABLE activity 
ADD COLUMN IF NOT EXISTS due_date timestamp,
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS priority varchar(10) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS assigned_to varchar(50),
ADD COLUMN IF NOT EXISTS date_completed timestamp;

-- Add check constraints for new fields
ALTER TABLE activity 
ADD CONSTRAINT check_activity_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE activity 
ADD CONSTRAINT check_activity_priority 
CHECK (priority IN ('low', 'medium', 'high'));

-- Create indexes for task querying
CREATE INDEX IF NOT EXISTS idx_activity_status ON activity(status);
CREATE INDEX IF NOT EXISTS idx_activity_due_date ON activity(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_assigned_to ON activity(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_priority ON activity(priority);

-- Update existing activities to have 'completed' status
UPDATE activity 
SET status = 'completed', 
    date_completed = date_created,
    assigned_to = COALESCE(bd_in_charge, created_by)
WHERE status IS NULL OR status = '';

-- Create views for different activity types
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

CREATE OR REPLACE VIEW v_upcoming_tasks AS
SELECT * FROM activity 
WHERE status IN ('pending', 'in_progress') 
AND due_date >= CURRENT_TIMESTAMP 
AND due_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
ORDER BY due_date ASC;

-- Create helper function for task creation
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
BEGIN
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
        p_assigned_to,
        p_bd_in_charge,
        p_assigned_to,
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create helper function for task completion
CREATE OR REPLACE FUNCTION complete_task(
    p_activity_id INTEGER,
    p_completion_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE activity 
    SET status = 'completed',
        date_completed = CURRENT_TIMESTAMP,
        description = CASE 
            WHEN p_completion_notes IS NOT NULL 
            THEN description || E'\n\nCompletion Notes: ' || p_completion_notes
            ELSE description
        END
    WHERE activity_id = p_activity_id 
    AND status IN ('pending', 'in_progress');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Verify the migration
DO $$
DECLARE
    activity_count INTEGER;
    task_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO activity_count FROM activity;
    SELECT COUNT(*) INTO task_count FROM v_tasks;
    RAISE NOTICE 'Migration completed. Total activities: %, Current tasks: %', activity_count, task_count;
END $$;

COMMIT; 