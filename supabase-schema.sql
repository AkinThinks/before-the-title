-- Before the Title - Supabase Schema
-- Run this in the Supabase SQL editor to set up your database

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('in-person', 'online')),
  reflection TEXT NOT NULL,
  artwork_url TEXT,
  download_url TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  short_film_opt_in BOOLEAN DEFAULT false,
  website_social_opt_in BOOLEAN DEFAULT false,
  name TEXT,
  social_handle TEXT,
  email TEXT,
  context TEXT,
  participant_type TEXT DEFAULT 'online' CHECK (participant_type IN ('in-person', 'online')),
  selected_for_short_film BOOLEAN DEFAULT false,
  selected_for_website BOOLEAN DEFAULT false,
  selected_for_social BOOLEAN DEFAULT false,
  curator_notes TEXT DEFAULT '',
  safety_status TEXT DEFAULT 'unchecked' CHECK (safety_status IN ('unchecked', 'safe', 'review', 'rejected', 'error')),
  moderation_flagged BOOLEAN DEFAULT false,
  moderation_categories JSONB DEFAULT '{}'::jsonb,
  moderation_scores JSONB DEFAULT '{}'::jsonb,
  moderation_model TEXT,
  moderation_reason TEXT,
  moderation_checked_at TIMESTAMPTZ,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
);

-- Existing deployments: add newer optional columns without rebuilding the table.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS social_handle TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS safety_status TEXT DEFAULT 'unchecked' CHECK (safety_status IN ('unchecked', 'safe', 'review', 'rejected', 'error'));
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS moderation_flagged BOOLEAN DEFAULT false;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS moderation_categories JSONB DEFAULT '{}'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS moderation_scores JSONB DEFAULT '{}'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS moderation_model TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS moderation_checked_at TIMESTAMPTZ;

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Remove permissive demo policies from earlier deployments.
DROP POLICY IF EXISTS "Allow public read" ON submissions;
DROP POLICY IF EXISTS "Allow public insert" ON submissions;
DROP POLICY IF EXISTS "Allow public update" ON submissions;

-- No anon read/update policies are created here. Production reads, writes, and
-- curation updates should go through the Next.js API routes using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS server-side.

-- Create an index for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions(source);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(moderation_status);
CREATE INDEX IF NOT EXISTS idx_submissions_safety ON submissions(safety_status);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);
