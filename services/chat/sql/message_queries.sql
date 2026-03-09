-- name: SendMessage :one
INSERT INTO chat_service.messages (sender_id, receiver_id, content)
VALUES ($1, $2, $3)
RETURNING *;
