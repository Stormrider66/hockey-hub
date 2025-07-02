-- Create the database if it doesn't exist
-- Run this in PostgreSQL as the postgres user

-- Check if database exists and create if not
SELECT 'CREATE DATABASE hockey_hub_communication' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hockey_hub_communication')\gexec

-- Connect to the database
\c hockey_hub_communication;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'team', 'broadcast')),
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    description TEXT,
    created_by UUID NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'observer')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    last_read_at TIMESTAMP,
    notifications_enabled BOOLEAN DEFAULT true,
    is_muted BOOLEAN DEFAULT false,
    muted_until TIMESTAMP,
    nickname VARCHAR(255),
    UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice', 'video', 'location', 'system')),
    reply_to_id UUID,
    metadata JSONB,
    is_pinned BOOLEAN DEFAULT false,
    pinned_at TIMESTAMP,
    pinned_by UUID,
    forwarded_from_message_id UUID,
    forwarded_from_conversation_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    thumbnail_url VARCHAR(500),
    type VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (type IN ('image', 'video', 'audio', 'document', 'other')),
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Create message_read_receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(message_id, user_id)
);

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    status_message VARCHAR(255),
    active_device VARCHAR(100),
    device_info JSONB,
    away_since TIMESTAMP,
    busy_until TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE conversation_participants 
ADD CONSTRAINT FK_conversation_participants_conversation 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT FK_messages_conversation 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT FK_messages_reply_to 
FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

ALTER TABLE message_attachments 
ADD CONSTRAINT FK_message_attachments_message 
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

ALTER TABLE message_reactions 
ADD CONSTRAINT FK_message_reactions_message 
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

ALTER TABLE message_read_receipts 
ADD CONSTRAINT FK_message_read_receipts_message 
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS IDX_conversations_type_created_at ON conversations(type, created_at);
CREATE INDEX IF NOT EXISTS IDX_conversation_participants_user_id_left_at ON conversation_participants(user_id, left_at);
CREATE INDEX IF NOT EXISTS IDX_conversation_participants_conversation_user ON conversation_participants(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS IDX_messages_conversation_created_at ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS IDX_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS IDX_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS IDX_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS IDX_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS IDX_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS IDX_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS IDX_message_read_receipts_user_id ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS IDX_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS IDX_user_presence_last_seen_at ON user_presence(last_seen_at);

-- Insert some test data (optional)
-- INSERT INTO conversations (id, type, name, created_by) 
-- VALUES ('550e8400-e29b-41d4-a716-446655440000', 'group', 'Test Group', '550e8400-e29b-41d4-a716-446655440001');

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Show created tables
\dt