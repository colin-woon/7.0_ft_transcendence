-- name: CreateMessage :one
INSERT INTO chat_service.messages (chat_id, sender_id, receiver_id, content)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetMessageHistoryByChatId :many
SELECT id, chat_id, sender_id, receiver_id, content, is_read, read_at, created_at
FROM chat_service.messages
WHERE chat_id = $1
ORDER BY created_at DESC;
