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

-- Trigger for Auth
CREATE TRIGGER update_users_modtime 
BEFORE UPDATE ON auth_service.users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =======================================================
-- 2. FORUM SERVICE (Python/FastAPI)
-- Responsible for: Projects, Threads, Comments, Votes
-- =======================================================

-- List of 42 Projects (Static data, e.g., Libft, Minishell)
CREATE TABLE forum_service.projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Threads (Top level discussions)
CREATE TABLE forum_service.threads (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER REFERENCES forum_service.projects(id),
    author_id INTEGER NOT NULL, -- LOOSE REFERENCE to auth_service.users(id)
    
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Comments (Replies to threads)
CREATE TABLE forum_service.comments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    thread_id INTEGER REFERENCES forum_service.threads(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL, -- LOOSE REFERENCE to auth_service.users(id)
    
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES forum_service.comments(id), -- For nested replies (future proofing)
    is_best_answer BOOLEAN DEFAULT FALSE, -- For "Best Answer" marking
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Votes (Up/Down logic)
-- Using a single table for both threads and comments (Polymorphic-ish) 
-- OR distinct tables. Distinct tables are safer in SQL.
CREATE TABLE forum_service.thread_votes (
    thread_id INTEGER REFERENCES forum_service.threads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    vote_value INTEGER CHECK (vote_value IN (1, -1)), -- +1 or -1
    PRIMARY KEY (thread_id, user_id) -- User can only vote once per thread
);

CREATE TABLE forum_service.comment_votes (
    comment_id INTEGER REFERENCES forum_service.comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    vote_value INTEGER CHECK (vote_value IN (1, -1)),
    PRIMARY KEY (comment_id, user_id)
);

-- Triggers for Forum
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON forum_service.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_threads_modtime BEFORE UPDATE ON forum_service.threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_modtime BEFORE UPDATE ON forum_service.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for Performance (Critical for forum lookups)
CREATE INDEX idx_threads_project ON forum_service.threads(project_id);
CREATE INDEX idx_comments_thread ON forum_service.comments(thread_id);


-- =======================================================
-- 3. CHAT SERVICE (Java/Quarkus)
-- Responsible for: Friendships, Messages
-- =======================================================

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

-- Indexes for Chat (Critical for loading history)
CREATE INDEX idx_messages_conversation ON chat_service.messages(sender_id, receiver_id);
CREATE INDEX idx_friendships_user ON chat_service.friendships(requester_id);