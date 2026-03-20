-- name: CreateFriendship :one
INSERT INTO chat_service.friendships (requester_id, addressee_id, status)
VALUES ($1, $2, 'pending')
RETURNING *;

-- name: UpdateFriendshipStatus :exec
UPDATE chat_service.friendships
SET status = $3, updated_at = CURRENT_TIMESTAMP
WHERE requester_id = $1 AND addressee_id = $2;
