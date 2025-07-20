-- LeadFi Database Schema
-- This file contains the complete database schema for the LeadFi CRM system

-- Applied Migrations:
-- - migration_add_registered_email.sql
-- - migration_add_task_features.sql  
-- - migration_enhance_activity.sql
-- - migration_fix_completion_dates.sql
-- - migration_fix_metadata_column.sql
-- - migration_remove_bd_in_charge_redundancy.sql
-- - migration_remove_customer_uid_from_activities.sql
-- - migration_simplify_task_assignment.sql
-- - migration_fix_customer_schema.sql (adds bd_in_charge to customer, removes date_converted)

-- Drop tables if they exist (for rebuilds)
DROP TABLE IF EXISTS activity CASCADE;
DROP TABLE IF EXISTS daily_trading_volume CASCADE;
DROP TABLE IF EXISTS vip_history CASCADE;
DROP TABLE IF EXISTS contact CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS lead CASCADE;

-- Lead Table
CREATE TABLE IF NOT EXISTS "lead" (
  "lead_id" serial PRIMARY KEY NOT NULL,
  "full_name" varchar(50) NOT NULL,
  "title" varchar(50),
  "email" varchar(120),
  "telegram" varchar(50),
  "phone_number" varchar(20),
  "source" varchar(50) NOT NULL, -- [gate, linkedin, hubspot, conference, referral]
  "status" varchar(50), -- 1. lead generated 2. proposal 3. negotiation 4. registration 5. integration 6. closed won 7. lost
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "linkedin_url" varchar(255),
  "company_name" varchar(120),
  "country" varchar(50),
  "bd_in_charge" varchar(20) NOT NULL,
  "background" text,
  "is_converted" BOOLEAN DEFAULT FALSE,
  "type" varchar(50) NOT NULL
);

-- Customer Table
CREATE TABLE IF NOT EXISTS "customer" (
  "customer_uid" INTEGER PRIMARY KEY NOT NULL, -- Changed from char(8) to INTEGER
  "registered_email" varchar(120),
  "type" varchar(50),
  "name" varchar(120) NOT NULL,
  "is_closed" BOOLEAN DEFAULT FALSE,
  "date_closed" timestamp,
  "country" varchar(50),
  "bd_in_charge" varchar(20), -- BD responsible for this customer (copied from primary lead)
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contact Table
CREATE TABLE IF NOT EXISTS "contact" (
  "contact_id" serial PRIMARY KEY NOT NULL, -- Unique ID for the contact
  "customer_uid" INTEGER NOT NULL, -- Changed from char(8) to INTEGER
  "lead_id" int NOT NULL, -- References lead
  "is_primary_contact" BOOLEAN DEFAULT TRUE,
  "date_added" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When the contact was added
  FOREIGN KEY ("customer_uid") REFERENCES "customer" ("customer_uid") ON DELETE CASCADE,
  FOREIGN KEY ("lead_id") REFERENCES "lead" ("lead_id") ON DELETE CASCADE
);

-- Daily Trading Volume Table
CREATE TABLE IF NOT EXISTS "daily_trading_volume" (
  "customer_uid" INTEGER NOT NULL, -- Changed from char(8) to INTEGER
  "date" date NOT NULL,
  "spot_maker_trading_volume" numeric(18,2),
  "spot_taker_trading_volume" numeric(18,2),
  "spot_maker_fees" numeric(6,2),
  "spot_taker_fees" numeric(6,2),
  "futures_maker_trading_volume" numeric(18,2),
  "futures_taker_trading_volume" numeric(18,2),
  "futures_maker_fees" numeric(6,2),
  "futures_taker_fees" numeric(6,2),
  "user_assets" numeric(18,2),
  PRIMARY KEY ("customer_uid", "date"),
  FOREIGN KEY ("customer_uid") REFERENCES "customer" ("customer_uid")
);

-- VIP History Table
CREATE TABLE IF NOT EXISTS "vip_history" (
  "customer_uid" INTEGER NOT NULL, -- Changed from char(8) to INTEGER
  "date" date NOT NULL,
  "vip_level" char(2) NOT NULL DEFAULT '0',
  "spot_mm_level" char(1) DEFAULT '0',
  "futures_mm_level" char(1) DEFAULT '0',
  PRIMARY KEY ("customer_uid", "date"),
  FOREIGN KEY ("customer_uid") REFERENCES "customer" ("customer_uid")
);

-- Enhanced Activity table (lead-centric, supports both activities and tasks)
CREATE TABLE IF NOT EXISTS "activity" (
  "activity_id" serial PRIMARY KEY NOT NULL,
  "lead_id" int NOT NULL, -- Required: all activities must be linked to a lead
  "activity_type" varchar(50) NOT NULL,
  "activity_category" varchar(20) NOT NULL DEFAULT 'manual', -- 'manual', 'system', 'automated'
  "description" text,
  "activity_metadata" jsonb, -- Structured additional data for system activities
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" varchar(50), -- Who/what created the activity
  "is_visible_to_bd" boolean DEFAULT true, -- Visibility control
  
  -- Task-related fields
  "due_date" timestamp,
  "status" varchar(20) DEFAULT 'completed', -- 'pending', 'in_progress', 'completed', 'cancelled'
  "priority" varchar(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
  "assigned_to" varchar(50), -- Defaults to lead bd_in_charge
  "date_completed" timestamp, -- For activities: same as date_created, for tasks: null until completed
  
  -- Constraints
  CHECK (activity_category IN ('manual', 'system', 'automated')),
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT activity_lead_required CHECK (lead_id IS NOT NULL)
);

COMMENT ON TABLE "daily_trading_volume" IS 'Composite PK ensures unique daily trading record per customer';
COMMENT ON TABLE "activity" IS 'Activities and tasks are lead-centric. Customer activities are accessed via the lead-customer relationship through the contact table.';

-- Enhanced Activity table foreign keys and indexes
ALTER TABLE "activity" ADD FOREIGN KEY ("lead_id") REFERENCES "lead" ("lead_id") ON DELETE CASCADE;

-- Performance indexes for activity table
CREATE INDEX IF NOT EXISTS idx_activity_lead_id ON activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_category ON activity(activity_category);
CREATE INDEX IF NOT EXISTS idx_activity_date_created ON activity(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_activity_status ON activity(status);
CREATE INDEX IF NOT EXISTS idx_activity_due_date ON activity(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_assigned_to ON activity(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_priority ON activity(priority);

-- Functions

-- Returns the the timestamp and updates date_created
-- Demo-aware version that respects existing date_created values
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set date_created if it's not already provided (demo mode override)
    IF NEW.date_created IS NULL THEN
        NEW.date_created = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set completion date for immediate activities
CREATE OR REPLACE FUNCTION set_activity_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- For completed activities without due_date (immediate activities), set date_completed = date_created
    IF NEW.status = 'completed' AND NEW.due_date IS NULL AND NEW.date_completed IS NULL THEN
        NEW.date_completed = NEW.date_created;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- This trigger sets the timestamp after a specific event occurs.

CREATE TRIGGER set_timestamp
BEFORE INSERT
ON lead
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE INSERT
ON activity
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE INSERT
ON customer
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_activity_completion
BEFORE INSERT OR UPDATE
ON activity
FOR EACH ROW
EXECUTE FUNCTION set_activity_completion();

-- Enhanced Activity System Functions

-- Helper function to create system activities (lead-centric)
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

-- Helper function to create manual activities (lead-centric)
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

-- Helper function to create tasks (lead-centric)
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

-- Function to track lead changes (existing)
CREATE OR REPLACE FUNCTION track_lead_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_description TEXT;
    metadata_json JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        change_description := 'Lead created: ' || NEW.full_name || ' (' || NEW.company_name || ')';
        metadata_json := jsonb_build_object(
            'event_type', 'lead_created',
            'lead_id', NEW.lead_id,
            'full_name', NEW.full_name,
            'company_name', NEW.company_name,
            'status', NEW.status,
            'bd_in_charge', NEW.bd_in_charge
        );
        
        PERFORM create_system_activity(
            'lead_created',
            change_description,
            NEW.lead_id,
            metadata_json
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Track status changes
        IF OLD.status != NEW.status THEN
            change_description := 'Lead status changed from "' || OLD.status || '" to "' || NEW.status || '"';
            metadata_json := jsonb_build_object(
                'event_type', 'status_changed',
                'lead_id', NEW.lead_id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'full_name', NEW.full_name,
                'company_name', NEW.company_name
            );
            
            PERFORM create_system_activity(
                'status_changed',
                change_description,
                NEW.lead_id,
                metadata_json
            );
        END IF;
        
        -- Track conversion to customer
        IF OLD.is_converted = FALSE AND NEW.is_converted = TRUE THEN
            change_description := 'Lead converted to customer: ' || NEW.full_name;
            metadata_json := jsonb_build_object(
                'event_type', 'lead_converted',
                'lead_id', NEW.lead_id,
                'full_name', NEW.full_name,
                'company_name', NEW.company_name
            );
            
            PERFORM create_system_activity(
                'lead_converted',
                change_description,
                NEW.lead_id,
                metadata_json
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track customer changes (updated for lead-centric)
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

-- Create triggers
CREATE TRIGGER lead_activity_tracker
    AFTER INSERT OR UPDATE ON lead
    FOR EACH ROW
    EXECUTE FUNCTION track_lead_changes();

CREATE TRIGGER customer_activity_tracker
    AFTER INSERT OR UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION track_customer_changes();

-- Create views for common activity queries (lead-centric)
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

-- views for trading volume
CREATE OR REPLACE VIEW v_trading_volume_detail AS
SELECT
    dtv.date,
    dtv.customer_uid,
    c.name as customer_name,
    'spot' as trade_type,
    'maker' as trade_side,
    dtv.spot_maker_trading_volume as volume,
    dtv.spot_maker_fees as fees,
    c.bd_in_charge
FROM daily_trading_volume dtv
JOIN customer c ON dtv.customer_uid = c.customer_uid
WHERE dtv.spot_maker_trading_volume > 0

UNION ALL

SELECT
    dtv.date,
    dtv.customer_uid,
    c.name as customer_name,
    'spot' as trade_type,
    'taker' as trade_side,
    dtv.spot_taker_trading_volume as volume,
    dtv.spot_taker_fees as fees,
    c.bd_in_charge
FROM daily_trading_volume dtv
JOIN customer c ON dtv.customer_uid = c.customer_uid
WHERE dtv.spot_taker_trading_volume > 0

UNION ALL

SELECT
    dtv.date,
    dtv.customer_uid,
    c.name as customer_name,
    'futures' as trade_type,
    'maker' as trade_side,
    dtv.futures_maker_trading_volume as volume,
    dtv.futures_maker_fees as fees,
    c.bd_in_charge
FROM daily_trading_volume dtv
JOIN customer c ON dtv.customer_uid = c.customer_uid
WHERE dtv.futures_maker_trading_volume > 0

UNION ALL

SELECT
    dtv.date,
    dtv.customer_uid,
    c.name as customer_name,
    'futures' as trade_type,
    'taker' as trade_side,
    dtv.futures_taker_trading_volume as volume,
    dtv.futures_taker_fees as fees,
    c.bd_in_charge
FROM daily_trading_volume dtv
JOIN customer c ON dtv.customer_uid = c.customer_uid
WHERE dtv.futures_taker_trading_volume > 0

ORDER BY date DESC, customer_uid ASC;