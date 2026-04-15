-- name: CreateFriendship :one
INSERT INTO chat_service.friendships (requester_id, addressee_id, last_action_user_id, status)
VALUES ($1, $2, $3, 'pending')
RETURNING *;

-- name: UpdateFriendshipStatus :one
UPDATE chat_service.friendships
SET status = $3, last_action_user_id = $4, is_chat_allowed = $5, updated_at = CURRENT_TIMESTAMP
WHERE (requester_id = $1 AND addressee_id = $2)
   OR (requester_id = $2 AND addressee_id = $1)
RETURNING *;

-- name: GetFriendship :one
SELECT * FROM chat_service.friendships
WHERE (requester_id = $1 AND addressee_id = $2)
   OR (requester_id = $2 AND addressee_id = $1)
LIMIT 1;

-- name: CreateDirectRoomWithMembers :one
WITH existing_room AS (
    SELECT rm1.chat_id
    FROM chat_service.room_members rm1
    JOIN chat_service.room_members rm2 ON rm1.chat_id = rm2.chat_id
    JOIN chat_service.rooms r ON rm1.chat_id = r.id
    WHERE r.type = 'direct'
      AND rm1.user_id = $1
      AND rm2.user_id = $2
    LIMIT 1
),
new_room AS (
    INSERT INTO chat_service.rooms (type, name)
    SELECT 'direct', NULL
    WHERE NOT EXISTS (SELECT 1 FROM existing_room)
    RETURNING id
),
inserted_members AS (
    INSERT INTO chat_service.room_members (chat_id, user_id, role)
    SELECT id, $1, 'member' FROM new_room
    UNION ALL
    SELECT id, $2, 'member' FROM new_room
    RETURNING chat_id
)
SELECT chat_id FROM inserted_members
UNION ALL
SELECT chat_id FROM existing_room
LIMIT 1;

-- name: GetFriendListWithChatIds :many
WITH friends AS (
    SELECT addressee_id AS friend_id
    FROM chat_service.friendships
    WHERE requester_id = $1 AND status = 'accepted'
    UNION
    SELECT requester_id AS friend_id
    FROM chat_service.friendships
    WHERE addressee_id = $1 AND status = 'accepted'
)
SELECT
    f.friend_id,
    -- 2. Find the direct chat room shared by the user and this specific friend
    (
        SELECT rm_friend.chat_id
        FROM chat_service.room_members rm_friend
        JOIN chat_service.rooms r ON r.id = rm_friend.chat_id
        JOIN chat_service.room_members rm_me ON rm_me.chat_id = r.id
        WHERE r.type = 'direct'
          AND rm_me.user_id = $1
          AND rm_friend.user_id = f.friend_id
        LIMIT 1
    ) AS chat_id
FROM friends f;

-- name: GetPendingFriendRequests :many
SELECT requester_id, addressee_id, status
FROM chat_service.friendships
WHERE addressee_id = $1
    AND status = 'pending'
ORDER BY requester_id ASC;

-- name: CreateMessageRequestFriendship :one
INSERT INTO chat_service.friendships (requester_id, addressee_id, last_action_user_id, status, is_chat_allowed)
VALUES ($1, $2, $3, 'requested', false)
RETURNING *;

-- name: CheckChatPermissions :one
SELECT
    r.type AS room_type,
    f.is_chat_allowed
FROM chat_service.rooms r
JOIN chat_service.room_members me ON r.id = me.chat_id
-- Only attempt to find the "other" person if it's a direct chat
LEFT JOIN chat_service.room_members other
    ON r.id = other.chat_id
    AND me.user_id != other.user_id
    AND r.type = 'direct'
-- Only attempt to join friendships if it's a direct chat
LEFT JOIN chat_service.friendships f
    ON r.type = 'direct' AND (
        (f.requester_id = me.user_id AND f.addressee_id = other.user_id) OR
        (f.requester_id = other.user_id AND f.addressee_id = me.user_id)
    )
WHERE r.id = $1
  AND me.user_id = $2
LIMIT 1;
