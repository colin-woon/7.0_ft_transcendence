CREATE SCHEMA IF NOT EXISTS chat_service;

CREATE TYPE chat_service.friend_status AS ENUM ('pending', 'accepted', 'blocked', 'declined', 'none');

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE chat_service.friendships (
	chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id INTEGER NOT NULL, -- auth_service.users(id)
    addressee_id INTEGER NOT NULL, -- auth_service.users(id)
    status chat_service.friend_status DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (requester_id, addressee_id)
);

CREATE TABLE chat_service.messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- Chat grows fast, use BIGINT
	chat_id UUID NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (sqlc ignores these, but DB loves them, its here for documentation)
CREATE INDEX idx_friendships_user ON chat_service.friendships(requester_id);
CREATE INDEX idx_chat_id_created_at ON chat_service.messages (chat_id, created_at);
