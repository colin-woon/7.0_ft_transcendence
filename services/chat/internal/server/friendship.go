package server

import (
	"app/internal/api"
	"app/internal/database"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

func (s *Server) SendFriendRequest(w http.ResponseWriter, r *http.Request, requesterId int, receiverId int) {
	ctx := r.Context()

	_, err := s.db.GetQueries().CreateFriendship(ctx, database.CreateFriendshipParams{
		RequesterID: int32(requesterId),
		AddresseeID: int32(receiverId),
	})

	if err != nil {
		if strings.Contains(err.Error(), "unique_violation") || strings.Contains(err.Error(), "duplicate key") {
			http.Error(w, "Friendship already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) UpdateFriendshipStatus(w http.ResponseWriter, r *http.Request, requesterId int, receiverId int, params api.UpdateFriendshipStatusParams) {
	ctx := r.Context()

	if !params.Status.Valid() {
		http.Error(w, "Invalid status value", http.StatusBadRequest)
		return
	}

	var dbStatus database.ChatServiceFriendStatus
	switch params.Status {
	case api.UpdateFriendshipStatusParamsStatusAccepted:
		dbStatus = database.ChatServiceFriendStatusAccepted
	case api.UpdateFriendshipStatusParamsStatusDeclined:
		dbStatus = database.ChatServiceFriendStatusDeclined
	case api.UpdateFriendshipStatusParamsStatusBlocked:
		dbStatus = database.ChatServiceFriendStatusBlocked
	case api.UpdateFriendshipStatusParamsStatusNone:
		dbStatus = database.ChatServiceFriendStatusNone
	default:
		http.Error(w, "Invalid status value", http.StatusBadRequest)
		return
	}

	// 1. Start the Database Transaction
	// Note: s.db should be your *sql.DB connection pool
	tx, err := s.db.GetDB().BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback() // Automatically rolls back if we exit before Commit()

	// 2. Bind the transaction to your sqlc Queries
	qtx := s.db.GetQueries().WithTx(tx)

	log.Printf("updating status")
	// 3. Update the Friendship Status
	err = qtx.UpdateFriendshipStatus(ctx, database.UpdateFriendshipStatusParams{
		RequesterID: int32(requesterId),
		AddresseeID: int32(receiverId),
		Status: database.NullChatServiceFriendStatus{
			ChatServiceFriendStatus: dbStatus,
			Valid:                   true,
		},
	})

	if err != nil {
		http.Error(w, "Failed to update friendship", http.StatusInternalServerError)
		return
	}

	// 4. The Side Effect: Create Room if Accepted
	if dbStatus == database.ChatServiceFriendStatusAccepted {
		_, err = qtx.CreateDirectRoomWithMembers(ctx, database.CreateDirectRoomWithMembersParams{
			UserID:   int32(requesterId),
			UserID_2: int32(receiverId), // sqlc numbers identical parameters
		})
		if err != nil {
			http.Error(w, "Failed to initialize chat room", http.StatusInternalServerError)
			return
		}
	}

	// 5. Explicitly Commit the Transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// getOnlineFriends queries the database for accepted friends and filters to those currently online
func (s *Server) getOnlineFriends(ctx context.Context, userId int32) ([]int, error) {
	// Query all friends with chat IDs (reusing existing query)
	friends, err := s.db.GetQueries().GetFriendListWithChatIds(ctx, userId)
	if err != nil {
		return nil, fmt.Errorf("failed to get friend list: %w", err)
	}

	// Get friend IDs as slice
	friendIds := make([]int, 0, len(friends))
	for _, friend := range friends {
		friendIds = append(friendIds, int(friend.FriendID))
	}

	// Filter to friends who are currently online using hub helper
	return s.sseHub.GetOnlineUsers(friendIds), nil
}

// broadcastStatusToFriends broadcasts a USER_STATUS event to all online friends
func (s *Server) broadcastStatusToFriends(userId int, isOnline bool) {
	ctx := context.Background()

	// Get list of online friends
	onlineFriends, err := s.getOnlineFriends(ctx, int32(userId))
	if err != nil {
		fmt.Printf("Error getting online friends for user %d: %v\n", userId, err)
		return
	}

	// Create USER_STATUS event
	data := api.StreamEvent{
		Type: api.USERSTATUS,
	}

	err = data.Payload.FromUserStatus(api.UserStatus{
		UserId:   userId,
		IsOnline: isOnline,
	})
	if err != nil {
		fmt.Printf("Error creating status payload for user %d: %v\n", userId, err)
		return
	}

	// Marshal to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Printf("Error marshaling status event for user %d: %v\n", userId, err)
		return
	}

	// Broadcast to online friends
	s.sseHub.BroadcastToUsers(onlineFriends, string(jsonData))
}

func (s *Server) GetFriendList(w http.ResponseWriter, r *http.Request, tempUserId int) {
	ctx := r.Context()

	friends, err := s.db.GetQueries().GetFriendListWithChatIds(ctx, int32(tempUserId))
	if err != nil {
		http.Error(w, "Failed to retrieve friend list", http.StatusInternalServerError)
		return
	}

	s.sseHub.mutex.RLock()
	// Capture the hub state and unlock early to avoid holding it during JSON encoding
	onlineMap := make(map[int]bool)
	for id := range s.sseHub.userChannels {
		onlineMap[id] = true
	}
	s.sseHub.mutex.RUnlock()

	response := make(api.FriendList, 0, len(friends))
	for _, friend := range friends {
		// 1. Create local copies for pointer safety
		fId := int(friend.FriendID)

		// 2. Determine online status
		_, online := onlineMap[fId]
		isOnline := online // Local boolean

		// 3. Handle UUID (sqlc usually returns [16]byte or uuid.UUID)
		var chatId *openapi_types.UUID
		if friend.ChatID != uuid.Nil {
			// Create a copy of the UUID to take its address
			cId := friend.ChatID
			chatId = &cId
		}

		response = append(response, struct {
			ChatId   *openapi_types.UUID `json:"chatId,omitempty"`
			FriendId *int                `json:"friendId,omitempty"`
			IsOnline *bool               `json:"isOnline,omitempty"`
		}{
			ChatId:   chatId,
			FriendId: &fId,      // Point to the unique local copy
			IsOnline: &isOnline, // Point to the unique local copy
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) GetPendingFriendRequests(w http.ResponseWriter, r *http.Request, tempUserId int) {
	ctx := r.Context()

	rows, err := s.db.GetQueries().GetPendingFriendRequests(ctx, int32(tempUserId))
	if err != nil {
		http.Error(w, "Failed to retrieve pending friend requests", http.StatusInternalServerError)
		return
	}

	response := make(api.PendingFriendRequestList, 0, len(rows))
	for _, row := range rows {
		status := api.PendingFriendRequestStatusPending
		if row.Status.Valid {
			status = api.PendingFriendRequestStatus(row.Status.ChatServiceFriendStatus)
		}

		response = append(response, api.PendingFriendRequest{
			RequesterId: int(row.RequesterID),
			AddresseeId: int(row.AddresseeID),
			Status:      status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode pending friend requests", http.StatusInternalServerError)
		return
	}
}
