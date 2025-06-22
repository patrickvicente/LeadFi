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
  "type" varchar(50),
  "name" varchar(120) NOT NULL,
  "is_closed" BOOLEAN DEFAULT FALSE,
  "date_closed" timestamp,
  "country" varchar(50),
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

-- Activity table
CREATE TABLE IF NOT EXISTS "activity" (
  "activity_id" serial PRIMARY KEY NOT NULL,
  "lead_id" int,
  "activity_type" varchar(50) NOT NULL, -- LinkedIn connection request, linkedin_intro, telegram_intro, follow_up, email, meeting, 
  "description" text,
  "date_created" timestamp NOT NULL,
  "bd" varchar(20)
  -- "status" VARCHAR(50) DEFAULT 'pending' -- 'completed', 'failed', 'cancelled'
);

COMMENT ON TABLE "daily_trading_volume" IS 'Composite PK ensures unique daily trading record per customer';

ALTER TABLE "activity" ADD FOREIGN KEY ("lead_id") REFERENCES "lead" ("lead_id");

-- Functions

-- Returns the the timestamp and updates date_created
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_created = now();
    
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


