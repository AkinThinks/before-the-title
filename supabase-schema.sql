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
  email TEXT,
  context TEXT,
  participant_type TEXT DEFAULT 'online' CHECK (participant_type IN ('in-person', 'online')),
  selected_for_short_film BOOLEAN DEFAULT false,
  selected_for_website BOOLEAN DEFAULT false,
  selected_for_social BOOLEAN DEFAULT false,
  curator_notes TEXT DEFAULT '',
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Public read policy (for admin dashboard)
CREATE POLICY "Allow public read" ON submissions
  FOR SELECT USING (true);

-- Public insert policy (for submissions)
CREATE POLICY "Allow public insert" ON submissions
  FOR INSERT WITH CHECK (true);

-- Public update policy (for admin curation)
CREATE POLICY "Allow public update" ON submissions
  FOR UPDATE USING (true);

-- Create an index for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions(source);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(moderation_status);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);
