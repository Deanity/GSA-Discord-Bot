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

-- Create sticky_messages table
CREATE TABLE IF NOT EXISTS sticky_messages (
    channel_id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('embed', 'content')),
    payload TEXT NOT NULL,
    last_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for sticky_messages updated_at
CREATE TRIGGER update_sticky_messages_modtime
    BEFORE UPDATE ON sticky_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
