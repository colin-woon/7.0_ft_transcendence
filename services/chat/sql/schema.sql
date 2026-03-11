CREATE SCHEMA IF NOT EXISTS chat_service;

CREATE TYPE chat_service.friend_status AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

CREATE TABLE chat_service.friendships (
    requester_id INTEGER NOT NULL, -- auth_service.users(id)
    addressee_id INTEGER NOT NULL, -- auth_service.users(id)
    status chat_service.friend_status DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (requester_id, addressee_id)
);

CREATE TABLE chat_service.messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- Chat grows fast, use BIGINT
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (sqlc ignores these, but DB loves them, its here for documentation)
CREATE INDEX idx_messages_conversation ON chat_service.messages(sender_id, receiver_id);
CREATE INDEX idx_friendships_user ON chat_service.friendships(requester_id);
