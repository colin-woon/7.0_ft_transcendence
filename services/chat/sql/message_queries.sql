-- name: CreateMessage :one
INSERT INTO chat_service.messages (chat_id, sender_id, content)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetMessageHistoryByChatId :many
SELECT id, chat_id, sender_id, content, created_at
FROM chat_service.messages
WHERE chat_id = $1
ORDER BY created_at DESC;

-- name: GetRoomMemberIDs :many
SELECT user_id
FROM chat_service.room_members
WHERE chat_id = $1;

-- name: GetUserInbox :many
SELECT
    c.id AS chat_id,
    c.type,
    c.name,
    -- Aggregates all member IDs into a Postgres array
    array_agg(rm.user_id)::integer[] AS member_ids
FROM chat_service.rooms c
JOIN chat_service.room_members rm ON c.id = rm.chat_id
WHERE c.id IN (
    -- Subquery: Find all chats the requested user is a part of
    SELECT rm_sub.chat_id
    FROM chat_service.room_members rm_sub
    WHERE rm_sub.user_id = $1
)
GROUP BY c.id, c.type, c.name;
