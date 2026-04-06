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
    email VARCHAR(255) UNIQUE NOT NULL,
    intra_id VARCHAR(50) UNIQUE, -- For 42 OAuth
    google_id VARCHAR(255) UNIQUE, -- For Google OAuth
    
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

    kind VARCHAR(50),
    url TEXT,
    phone VARCHAR(50),
    location VARCHAR(100),
    wallet INTEGER DEFAULT 0,
    correction_points INTEGER DEFAULT 0,
    pool_month VARCHAR(20),
    pool_year VARCHAR(10),
    is_staff BOOLEAN DEFAULT FALSE,
    is_alumni BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,

    -- Nested data from 42 API (stored as JSONB)
    image JSONB,
    intra_groups JSONB,
    cursus JSONB,
    projects JSONB,
    achievements JSONB,
    titles JSONB,
    titles_users JSONB,
    partnerships JSONB,
    patroned JSONB,
    patroning JSONB,
    roles JSONB,
    campus JSONB,
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