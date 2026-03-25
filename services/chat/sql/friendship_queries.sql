-- name: CreateFriendship :one
INSERT INTO chat_service.friendships (requester_id, addressee_id, status)
VALUES ($1, $2, 'pending')
RETURNING *;

-- name: UpdateFriendshipStatus :exec
UPDATE chat_service.friendships
SET status = $3, updated_at = CURRENT_TIMESTAMP
WHERE requester_id = $1 AND addressee_id = $2;

-- name: GetFriendListWithChatIds :many
SELECT
    chat_id,
    CASE
        WHEN requester_id = $1 THEN addressee_id
        ELSE requester_id
    END AS friend_id
FROM chat_service.friendships
WHERE (requester_id = $1 OR addressee_id = $1)
  AND status = 'accepted';
