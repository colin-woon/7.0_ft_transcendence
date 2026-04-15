-- name: CreateMessage :one
INSERT INTO chat_service.messages (chat_id, sender_id, content)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetMessageHistoryByChatId :many
SELECT m.id, m.chat_id, m.sender_id, m.content, m.created_at
FROM chat_service.messages m
LEFT JOIN chat_service.friendships f
  ON (f.requester_id = m.sender_id AND f.addressee_id = $2)
  OR (f.requester_id = $2 AND f.addressee_id = m.sender_id)
WHERE m.chat_id = $1
  AND (f.status IS NULL OR f.status != 'blocked')
ORDER BY m.created_at DESC;

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
AND NOT (
    c.type = 'direct' AND EXISTS (
        SELECT 1
        FROM chat_service.room_members rm_other
        JOIN chat_service.friendships f
          ON (f.requester_id = $1 AND f.addressee_id = rm_other.user_id)
          OR (f.requester_id = rm_other.user_id AND f.addressee_id = $1)
        WHERE rm_other.chat_id = c.id
          AND rm_other.user_id != $1
          AND f.status = 'blocked'
    )
)
GROUP BY c.id, c.type, c.name;

-- name: CreateGroupChatRoom :one
INSERT INTO chat_service.rooms (type, name)
VALUES ('group', $1)
RETURNING id, type, name;

-- name: CreateRoomMembersForGroupChat :exec
INSERT INTO chat_service.room_members (chat_id, user_id, role)
SELECT
    $1::uuid,
    $2::int,
    'admin'
UNION ALL
SELECT
    $1::uuid,
    u_id,
    'member'
FROM unnest($3::int[]) AS u_id
WHERE u_id <> $2::int;

-- name: UpdateLastReadMessageID :exec
UPDATE chat_service.room_members
SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), $1)
WHERE chat_id = $2 AND user_id = $3;
