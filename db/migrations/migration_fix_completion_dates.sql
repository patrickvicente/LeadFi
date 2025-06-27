-- Migration: Fix completion dates for activities vs tasks
-- Date: June 27, 2025
-- Purpose: Ensure activities (completed immediately) have date_completed = date_created
--          while tasks (pending/in_progress) have date_completed = null until completed

-- Update completed activities that don't have due_date (these are immediate activities)
-- Set date_completed = date_created for immediate activities
UPDATE activity 
SET date_completed = date_created 
WHERE status = 'completed' 
  AND due_date IS NULL 
  AND (date_completed IS NULL OR date_completed != date_created);

-- Clear date_completed for pending/in_progress tasks 
-- (these should only have date_completed when actually completed)
UPDATE activity 
SET date_completed = NULL 
WHERE status IN ('pending', 'in_progress') 
  AND date_completed IS NOT NULL;

-- System activities should also be completed immediately
UPDATE activity 
SET date_completed = date_created,
    status = 'completed'
WHERE activity_category = 'system' 
  AND (date_completed IS NULL OR status != 'completed');

-- Automated activities should also be completed immediately  
UPDATE activity 
SET date_completed = date_created,
    status = 'completed'
WHERE activity_category = 'automated' 
  AND (date_completed IS NULL OR status != 'completed'); 