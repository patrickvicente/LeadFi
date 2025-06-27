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
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_converted" timestamp -- When lead was converted to customer
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

-- Enhanced Activity table (supports both activities and tasks)
CREATE TABLE IF NOT EXISTS "activity" (
  "activity_id" serial PRIMARY KEY NOT NULL,
  "lead_id" int,
  "customer_uid" INTEGER, -- References customer table
  "activity_type" varchar(50) NOT NULL,
  "activity_category" varchar(20) NOT NULL DEFAULT 'manual', -- 'manual', 'system', 'automated'
  "description" text,
  "activity_metadata" jsonb, -- Structured additional data for system activities (renamed from metadata)
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" varchar(50), -- Who/what created the activity
  "is_visible_to_bd" boolean DEFAULT true, -- Visibility control
  
  -- Task-related fields
  "due_date" timestamp,
  "status" varchar(20) DEFAULT 'completed', -- 'pending', 'in_progress', 'completed', 'cancelled'
  "priority" varchar(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
  "assigned_to" varchar(50), -- Defaults to lead/customer bd_in_charge
  "date_completed" timestamp, -- For activities: same as date_created, for tasks: null until completed
  
  -- Constraints
  CHECK (activity_category IN ('manual', 'system', 'automated')),
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  CHECK (priority IN ('low', 'medium', 'high')),
  CHECK (lead_id IS NOT NULL OR customer_uid IS NOT NULL) -- At least one entity must be linked
);

COMMENT ON TABLE "daily_trading_volume" IS 'Composite PK ensures unique daily trading record per customer';

-- Enhanced Activity table foreign keys and indexes
ALTER TABLE "activity" ADD FOREIGN KEY ("lead_id") REFERENCES "lead" ("lead_id") ON DELETE CASCADE;
ALTER TABLE "activity" ADD FOREIGN KEY ("customer_uid") REFERENCES "customer" ("customer_uid") ON DELETE CASCADE;

-- Performance indexes for activity table
CREATE INDEX IF NOT EXISTS idx_activity_lead_id ON activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_customer_uid ON activity(customer_uid);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_category ON activity(activity_category);
CREATE INDEX IF NOT EXISTS idx_activity_date_created ON activity(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_activity_status ON activity(status);
CREATE INDEX IF NOT EXISTS idx_activity_due_date ON activity(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_assigned_to ON activity(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_priority ON activity(priority);

-- Functions

-- Returns the the timestamp and updates date_created
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_created = now();
    
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

CREATE TRIGGER set_activity_completion
BEFORE INSERT OR UPDATE
ON activity
FOR EACH ROW
EXECUTE FUNCTION set_activity_completion();

-- Enhanced Activity System Functions

-- Helper function to create system activities
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
        activity_metadata,
        created_by,
        assigned_to,
        is_visible_to_bd,
        status,
        date_completed
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
        true,
        'completed',
        CURRENT_TIMESTAMP
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create tasks
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
        is_visible_to_bd,
        date_completed
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
        final_assigned_to,
        true,
        NULL  -- Tasks start with null completion date
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create manual activities
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
        default_assigned_to,
        final_created_by,
        true
    )
    RETURNING activity_id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for tracking lead changes
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

-- Trigger function for tracking customer changes
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

-- Create triggers for automatic activity tracking
CREATE TRIGGER lead_activity_tracker
    AFTER INSERT OR UPDATE ON lead
    FOR EACH ROW
    EXECUTE FUNCTION track_lead_changes();

CREATE TRIGGER customer_activity_tracker
    AFTER INSERT OR UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION track_customer_changes();

-- Useful views for querying activities
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


