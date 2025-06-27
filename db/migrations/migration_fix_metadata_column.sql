-- Migration: Fix metadata column name conflict
-- Date: 2024
-- Description: Rename 'metadata' column to 'activity_metadata' to avoid SQLAlchemy reserved name conflict

-- Start transaction
BEGIN;

-- Rename the metadata column to activity_metadata
ALTER TABLE activity RENAME COLUMN metadata TO activity_metadata;

-- Commit transaction
COMMIT;

RAISE NOTICE 'Migration completed: renamed metadata column to activity_metadata'; 