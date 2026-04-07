CREATE SCHEMA IF NOT EXISTS chat_service;

CREATE TYPE chat_service.friend_status AS ENUM ('pending', 'accepted', 'blocked', 'declined', 'none');

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE chat_service.friendships (
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status chat_service.friend_status DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (requester_id, addressee_id)
);

-- UNIFIED ROOM (room identify [direct/group])
CREATE TABLE chat_service.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
    name VARCHAR(255), -- Null for direct, optionally populated for groups
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- JUNCTION TABLE (who is in which room, their role/authority)
CREATE TABLE chat_service.room_members (
    chat_id UUID NOT NULL REFERENCES chat_service.rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id BIGINT, -- Replaces is_read on the message table
    PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE chat_service.messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chat_service.rooms(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_members_user_id ON chat_service.room_members(user_id);
CREATE INDEX idx_friendships_requester ON chat_service.friendships(requester_id);
CREATE INDEX idx_messages_chat_history ON chat_service.messages (chat_id, created_at DESC);
