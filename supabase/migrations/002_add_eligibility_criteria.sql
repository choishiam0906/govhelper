-- Add eligibility_criteria column to announcements table
-- This column stores detailed parsed eligibility information from AI

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS eligibility_criteria jsonb DEFAULT NULL;

-- Add index for faster queries on eligibility criteria
CREATE INDEX IF NOT EXISTS idx_announcements_eligibility_criteria
ON announcements USING gin (eligibility_criteria);

-- Comment for documentation
COMMENT ON COLUMN announcements.eligibility_criteria IS 'AI-parsed detailed eligibility criteria including company types, employee count, revenue, business age, industries, regions, certifications, etc.';
