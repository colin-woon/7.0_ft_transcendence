-- =======================================================
-- 0. GLOBAL SETUP
-- =======================================================

-- Create logical namespaces (Schemas) to enforce microservice boundaries
CREATE SCHEMA IF NOT EXISTS auth_service;
CREATE SCHEMA IF NOT EXISTS forum_service;
CREATE SCHEMA IF NOT EXISTS chat_service;

-- Reusable function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =======================================================
-- 1. AUTH SERVICE (Java/Quarkus)
-- Responsible for: Identity, Profiles, Roles
-- =======================================================

CREATE TYPE auth_service.user_role AS ENUM ('STUDENT', 'ADMIN');

CREATE TABLE auth_service.users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Identity Providers (OAuth)
    overflow_email VARCHAR(255) UNIQUE NOT NULL,
    google_email VARCHAR(255) UNIQUE,
    intra_email VARCHAR(255) UNIQUE,
    intra_id VARCHAR(50) UNIQUE, -- For 42 OAuth
    google_id VARCHAR(255) UNIQUE, -- For Google OAuth
    password_hash TEXT,

    -- Profile Data
    username VARCHAR(50) UNIQUE NOT NULL, -- Display name (could be 42 login)
    full_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,

    -- Security & Status
    role auth_service.user_role DEFAULT 'STUDENT',
    is_banned BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ, -- Persisted "last known online" (Real-time status goes in Redis)

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for refresh tokens
CREATE TABLE auth_service.sessions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    session_id VARCHAR(255) UNIQUE NOT NULL,

    user_id INTEGER NOT NULL REFERENCES auth_service.users(id) ON DELETE CASCADE,

    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address VARCHAR(45),

    expires_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 day',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_service.intra (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER UNIQUE NOT NULL REFERENCES auth_service.users(id) ON DELETE CASCADE,

    phone VARCHAR(50),
    location VARCHAR(100),
    original_image_url TEXT,
    wallet INTEGER DEFAULT 0,
    correction_points INTEGER DEFAULT 0,
    pool_month VARCHAR(20),
    pool_year VARCHAR(10),
    is_staff BOOLEAN DEFAULT FALSE,
    is_alumni BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    groups_count INTEGER DEFAULT 0,
    partnerships_count INTEGER DEFAULT 0,

    -- Nested data from 42 API (stored as JSONB)
    cursus JSONB,
    projects JSONB,
    achievements JSONB,
    titles_users JSONB,
    campus_users JSONB,
    languages JSONB,
    expertises JSONB,

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for Auth User
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON auth_service.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for Auth Intra
CREATE TRIGGER update_intra_modtime
BEFORE UPDATE ON auth_service.intra
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for session management
CREATE INDEX idx_sessions_user_id ON auth_service.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON auth_service.sessions(expires_at);

-- Indexes for user search
CREATE INDEX idx_users_username ON auth_service.users(username);
CREATE INDEX idx_users_full_name ON auth_service.users(full_name);

-- =======================================================
-- 2. FORUM SERVICE (Python/FastAPI)
-- Responsible for: Projects, Posts, Comments, Votes
-- =======================================================

-- List of 42 Projects (Static data, e.g., Libft, Minishell)
CREATE TABLE forum_service.projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    objectives TEXT[],
    estimate_time VARCHAR(50),
    difficulty VARCHAR(10),
    xp INTEGER DEFAULT 0,
    solo BOOLEAN DEFAULT TRUE,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Forum posts (Top level discussions)
CREATE TABLE forum_service.forum_posts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER REFERENCES forum_service.projects(id) ON DELETE SET NULL,
    author_id INTEGER NOT NULL, -- LOOSE REFERENCE to auth_service.users(id)

    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Markdown content

    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Comments (Replies to posts)
CREATE TABLE forum_service.comments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id INTEGER REFERENCES forum_service.forum_posts(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL, -- LOOSE REFERENCE to auth_service.users(id)

    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES forum_service.comments(id), -- For nested replies (future proofing)
    is_best_answer BOOLEAN DEFAULT FALSE, -- For "Best Answer" marking

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Votes (Up/Down logic)
-- Using a single table for both posts and comments (Polymorphic-ish)
-- OR distinct tables. Distinct tables are safer in SQL.
CREATE TABLE forum_service.post_votes (
    post_id INTEGER REFERENCES forum_service.forum_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    vote_value INTEGER CHECK (vote_value IN (1, -1)), -- +1 or -1
    PRIMARY KEY (post_id, user_id) -- User can only vote once per post
);

CREATE TABLE forum_service.comment_votes (
    comment_id INTEGER REFERENCES forum_service.comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    vote_value INTEGER CHECK (vote_value IN (1, -1)),
    PRIMARY KEY (comment_id, user_id)
);

-- Project subscriptions (many users <-> many projects)
CREATE TABLE forum_service.project_subscriptions (
    project_id INTEGER REFERENCES forum_service.projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

-- Triggers for Forum
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON forum_service.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_modtime BEFORE UPDATE ON forum_service.forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_modtime BEFORE UPDATE ON forum_service.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for Performance (Critical for forum lookups)
CREATE INDEX idx_posts_project ON forum_service.forum_posts(project_id);
CREATE INDEX idx_comments_post ON forum_service.comments(post_id);
CREATE INDEX idx_project_subscriptions_user_id ON forum_service.project_subscriptions(user_id);


-- =======================================================
-- 3. CHAT SERVICE (Go)
-- Responsible for: Friendships, Messages
-- =======================================================
CREATE TYPE chat_service.friend_status AS ENUM ('requested', 'pending', 'blocked', 'accepted');

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE chat_service.friendships (
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    last_action_user_id INTEGER NOT NULL,
    is_chat_allowed BOOLEAN DEFAULT FALSE,
    status chat_service.friend_status DEFAULT 'requested',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (requester_id, addressee_id),
    CONSTRAINT friendship_id_order CHECK (requester_id != addressee_id)
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
