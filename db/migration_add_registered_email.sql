-- Migration script to add registered_email column to customer table
-- Run this script if you have an existing database that needs the new column

-- Add registered_email column to customer table
ALTER TABLE customer 
ADD COLUMN IF NOT EXISTS registered_email varchar(120);

-- Optional: Add comment to document the change
COMMENT ON COLUMN customer.registered_email IS 'Email address used for registration and primary contact'; 

-- Populate registered_email with email from the primary lead
UPDATE customer
SET registered_email = (
    SELECT l.email
    FROM lead l
    JOIN contact c ON l.lead_id = c.lead_id
    WHERE c.customer_uid = customer.customer_uid
    AND c.is_primary_contact = true
    LIMIT 1
);