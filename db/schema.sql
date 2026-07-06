-- SQL schema setup for Google Skills Arcade 2026 Discord Bot

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    discord_id VARCHAR(255) PRIMARY KEY,
    github_username VARCHAR(255),
    skills_boost_profile TEXT,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for participants updated_at
CREATE TRIGGER update_participants_modtime
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id VARCHAR(255) NOT NULL REFERENCES participants(discord_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('lab', 'badge')),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    xp_awarded INTEGER DEFAULT 0 NOT NULL,
    verified_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for submissions lookup
CREATE INDEX IF NOT EXISTS idx_submissions_participant_id ON submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Trigger for submissions updated_at
CREATE TRIGGER update_submissions_modtime
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create xp_log table for tracking points history
CREATE TABLE IF NOT EXISTS xp_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id VARCHAR(255) NOT NULL REFERENCES participants(discord_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source VARCHAR(100) NOT NULL, -- e.g. 'registration', 'lab_submission', 'badge_submission', 'bonus'
    reference_id VARCHAR(255), -- ID of submission or trivia event if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for xp_log lookup
CREATE INDEX IF NOT EXISTS idx_xp_log_participant_id ON xp_log(participant_id);

-- Helper View for Leaderboard rank calculations
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    discord_id,
    github_username,
    skills_boost_profile,
    is_verified,
    xp,
    RANK() OVER (ORDER BY xp DESC, created_at ASC) as rank
FROM 
    participants;
