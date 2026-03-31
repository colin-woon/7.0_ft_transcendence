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
