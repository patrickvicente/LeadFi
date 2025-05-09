-- Drop tables if they exist (for rebuilds)
DROP TABLE IF EXISTS activity;
DROP TABLE IF EXISTS daily_trading_volume;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS lead;

-- Lead Table
CREATE TABLE "lead" (
  "lead_id" serial PRIMARY KEY NOT NULL,
  "full_name" varchar(50) NOT NULL,
  "title" varchar(50),
  "email" varchar(120),
  "telegram" varchar(50),
  "phone_number" varchar(20),
  "source" varchar(50) NOT NULL, -- [gate, linkedin, hubspot, conference, referral]
  "status" varchar(50), -- 1. lead generated 2. proposal 3. negotiation 4. registration 5. integration 6. closed won 7. lost
  "date_created" timestamp NOT NULL,
  "linkedin_url" varchar(255),
  "company_name" varchar(120),
  "country" varchar(50),
  "bd_in_charge" varchar(20) NOT NULL,
  "background" text
  -- Might need to add company_type market maker, broker prop firm etc
);

-- Customer Table
CREATE TABLE "customer" (
  "customer_uid" char(8) PRIMARY KEY NOT NULL,
  "lead_id" int,
  "type" varchar(20),
  "company_name" varchar(120),
  "date_converted" timestamp NOT NULL,
  "is_closed" char(1) DEFAULT 'N' NOT NULL, -- 'N' for non closed and 'Y' for closed
  "date_closed" timestamp
);

-- Daily TradinG Volume Table
CREATE TABLE "daily_trading_volume" (
  "customer_uid" char(8) NOT NULL,
  "date" date NOT NULL,
  "spot_trading_volume" numeric(18,2),
  "spot_maker_trading_volume" numeric(18,2),
  "spot_taker_trading_volume" numeric(18,2),
  "spot_maker_fees" numeric(6,2),
  "spot_taker_fees" numeric(6,2),
  "futures_trading_volume" numeric(18,2),
  "futures_maker_trading_volume" numeric(18,2),
  "futures_taker_trading_volume" numeric(18,2),
  "futures_maker_fees" numeric(6,2),
  "futures_taker_fees" numeric(6,2),
  "total_net_fees" numeric(8,2),
  "user_assets" numeric(18,2),
  PRIMARY KEY ("customer_uid", "date")
);

-- Activity table
CREATE TABLE "activity" (
  "activity_id" serial PRIMARY KEY NOT NULL,
  "lead_id" int,
  "activity_type" varchar(50) NOT NULL,
  "description" text,
  "date_created" timestamp NOT NULL,
  "bd" varchar(20)
);

COMMENT ON TABLE "daily_trading_volume" IS 'Composite PK ensures unique daily trading record per customer';

ALTER TABLE "customer" ADD FOREIGN KEY ("lead_id") REFERENCES "lead" ("lead_id");

ALTER TABLE "daily_trading_volume" ADD FOREIGN KEY ("customer_uid") REFERENCES "customer" ("customer_uid");

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


