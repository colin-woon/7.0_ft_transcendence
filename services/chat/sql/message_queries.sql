-- name: SendMessage :one
INSERT INTO chat_service.messages (sender_id, receiver_id, content)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetChatHistory :many
SELECT id, sender_id, receiver_id, content, is_read, read_at, created_at
FROM chat_service.messages
WHERE (sender_id = $1 AND receiver_id = $2)
 OR (sender_id = $2 AND receiver_id = $1)
ORDER BY created_at ASC;
