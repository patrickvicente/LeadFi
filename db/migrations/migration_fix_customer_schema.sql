--  Migration: Fix Customer Schema
--  This migration fixes the customer schema to include bd_in_charge

BEGIN;

--  Add bd_in_charge to customer table
ALTER TABLE customer ADD COLUMN bd_in_charge VARCHAR(20);

-- Validation queries
DO $$
DECLARE
    total_customers INTEGER;
    customers_with_primary_contact INTEGER;
    customers_without_primary_contact INTEGER;
    customers_with_multiple_primary INTEGER;
BEGIN
    -- get total number of customers
    SELECT COUNT(*) INTO total_customers FROM customer;
    -- get number of customers with primary contact
    SELECT COUNT(DISTINCT c.customer_uid) 
    INTO customers_with_primary_contact
    FROM customer c
    JOIN contact ct ON c.customer_uid = ct.customer_uid
    WHERE ct.is_primary_contact = true;

    --  calculate customers without primary contact
    customers_without_primary_contact := total_customers - customers_with_primary_contact;

    -- count customers with MULTIPLE primary contacts
    SELECT COUNT(c.customer_uid)
    INTO customers_with_multiple_primary
    FROM customer c
    JOIN contact ct ON c.customer_uid = ct.customer_uid
    WHERE ct.is_primary_contact = true
    GROUP BY c.customer_uid
    HAVING COUNT(*) > 1;

    -- log the findings
    RAISE NOTICE 'Migration Validation Report:';
    RAISE NOTICE '- Total customers: %', total_customers;
    RAISE NOTICE '- Customers with primary contact: %', customers_with_primary_contact;
    RAISE NOTICE '- Customers WITHOUT primary contact: %', customers_without_primary_contact;
    RAISE NOTICE '- Customers with MULTIPLE primary contacts: %', customers_with_multiple_primary;

     -- Warn about potential issues
    IF customers_without_primary_contact > 0 THEN
        RAISE WARNING '% customers have no primary contact and will get NULL bd_in_charge', customers_without_primary_contact;
    END IF;
    
    IF customers_with_multiple_primary > 0 THEN
        RAISE WARNING '% customers have multiple primary contacts - using first one found', customers_with_multiple_primary;
    END IF;
    
END;
$$;


--  Enhanced UPDATE with better error handling
UPDATE customer
SET bd_in_charge = (
    SELECT l.bd_in_charge 
    FROM lead l
    JOIN contact c ON l.lead_id = c.lead_id
    WHERE c.customer_uid = customer.customer_uid 
    AND c.is_primary_contact = true
    LIMIT 1  -- Handle multiple primary contacts gracefully
)
WHERE EXISTS (
    SELECT 1 FROM contact 
    WHERE contact.customer_uid = customer.customer_uid 
    AND contact.is_primary_contact = true
);

-- Post-migration validation
DO $$
DECLARE
    customers_with_bd INTEGER;
    customers_without_bd INTEGER;
    rec RECORD;  -- Add this declaration for the loop variable
BEGIN
    -- Count successful updates
    SELECT COUNT(*) INTO customers_with_bd 
    FROM customer 
    WHERE bd_in_charge IS NOT NULL;
    
    -- Count failed updates
    SELECT COUNT(*) INTO customers_without_bd 
    FROM customer 
    WHERE bd_in_charge IS NULL;
    
    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE '- Customers with bd_in_charge: %', customers_with_bd;
    RAISE NOTICE '- Customers without bd_in_charge: %', customers_without_bd;
    
    IF customers_without_bd > 0 THEN
        RAISE WARNING 'Migration incomplete: % customers still have NULL bd_in_charge', customers_without_bd;
        
        -- Optionally, list the problematic customers
        RAISE NOTICE 'Customers without bd_in_charge:';
        FOR rec IN 
            SELECT customer_uid, name 
            FROM customer 
            WHERE bd_in_charge IS NULL 
        LOOP
            RAISE NOTICE '- Customer UID: %, Name: %', rec.customer_uid, rec.name;
        END LOOP;
    END IF;
END;
$$;

-- Remove date_converted column safely
ALTER TABLE customer DROP COLUMN IF EXISTS date_converted;

COMMIT;