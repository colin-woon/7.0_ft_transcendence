package server

import (
	"app/internal/api"
	"app/internal/database"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

func (s *Server) SendFriendRequest(w http.ResponseWriter, r *http.Request, targetUserId int) {
	ctx := r.Context()

	callerId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	// 1. Check existing state (symmetric lookup)
	existing, err := s.db.GetQueries().GetFriendship(ctx, database.GetFriendshipParams{
		RequesterID: int32(callerId),
		AddresseeID: int32(targetUserId),
	})

	if err == nil {
		if !existing.Status.Valid {
			http.Error(w, "Internal Server Error: Invalid status", http.StatusInternalServerError)
			return
		}
		status := existing.Status.ChatServiceFriendStatus
		switch status {
		case database.ChatServiceFriendStatusAccepted:
			http.Error(w, "Already friends", http.StatusConflict)
			return
		case database.ChatServiceFriendStatusBlocked:
			if int32(callerId) != existing.LastActionUserID {
				http.Error(w, "Blocked", http.StatusForbidden)
				return
			}
			// If we are the one who blocked, allow "re-requesting" (effectively unblocking + pending)
		case database.ChatServiceFriendStatusPending:
			// If already pending, idempotent success if we were requester,
			// or auto-accept if they were requester (but here we just return OK)
			w.WriteHeader(http.StatusOK)
			return
		case database.ChatServiceFriendStatusRequested:
			// Allowed to upgrade to pending
		}

		// Update existing row instead of creating new one
		_, err = s.db.GetQueries().UpdateFriendshipStatus(ctx, database.UpdateFriendshipStatusParams{
			RequesterID:      int32(callerId),
			AddresseeID:      int32(targetUserId),
			Status:           database.NullChatServiceFriendStatus{ChatServiceFriendStatus: database.ChatServiceFriendStatusPending, Valid: true},
			LastActionUserID: int32(callerId),
			IsChatAllowed:    existing.IsChatAllowed,
		})
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		return
	} else if !strings.Contains(err.Error(), "no rows") {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// 2. Insert if no record exists
	_, err = s.db.GetQueries().CreateFriendship(ctx, database.CreateFriendshipParams{
		RequesterID:      int32(callerId),
		AddresseeID:      int32(targetUserId),
		LastActionUserID: int32(callerId),
	})

	if err != nil {
		if strings.Contains(err.Error(), "friendship_id_order") {
			http.Error(w, "Cannot friend yourself", http.StatusBadRequest)
			return
		}
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) UpdateFriendshipStatus(w http.ResponseWriter, r *http.Request, targetUserId int, params api.UpdateFriendshipStatusParams) {
	ctx := r.Context()

	callerId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	if !params.Status.Valid() {
		http.Error(w, "Invalid status value", http.StatusBadRequest)
		return
	}

	var dbStatus database.ChatServiceFriendStatus
	switch params.Status {
	case api.Accepted:
		dbStatus = database.ChatServiceFriendStatusAccepted
	case api.Blocked:
		dbStatus = database.ChatServiceFriendStatusBlocked
	case api.Pending:
		dbStatus = database.ChatServiceFriendStatusPending
	case api.Requested:
		dbStatus = database.ChatServiceFriendStatusRequested
	default:
		http.Error(w, "Unsupported status value", http.StatusBadRequest)
		return
	}

	tx, err := s.db.GetDB().BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	qtx := s.db.GetQueries().WithTx(tx)

	// Get current friend state to check validation
	currentFriendship, err := qtx.GetFriendship(ctx, database.GetFriendshipParams{
		RequesterID: int32(targetUserId),
		AddresseeID: int32(callerId),
	})
	if err != nil {
		http.Error(w, "Friendship not found", http.StatusNotFound)
		return
	}

	// 3. State Machine & Authorization Logic (The "Caveman Full" rewrite)
	isChatAllowed := currentFriendship.IsChatAllowed.Bool
	if currentFriendship.Status.Valid {
		currStatus := currentFriendship.Status.ChatServiceFriendStatus
		lastActor := currentFriendship.LastActionUserID

		// Rule A: NO ONE can manually revert a relationship back to 'pending'
		if dbStatus == database.ChatServiceFriendStatusPending {
			http.Error(w, "Cannot revert status to pending", http.StatusBadRequest)
			return
		}

		// Rule B: If currently BLOCKED, ONLY the person who initiated the block can change it
		if currStatus == database.ChatServiceFriendStatusBlocked {
			if int32(callerId) != lastActor {
				http.Error(w, "You cannot unblock yourself", http.StatusForbidden)
				return
			}
		}

		// Rule C: If currently PENDING, ONLY the receiver can accept it
		if currStatus == database.ChatServiceFriendStatusPending {
			if int32(callerId) == lastActor && dbStatus == database.ChatServiceFriendStatusAccepted {
				http.Error(w, "You cannot accept your own request", http.StatusForbidden)
				return
			}
		}
	}

	switch dbStatus {
	case database.ChatServiceFriendStatusAccepted:
		// Accepted side effect: allow chat
		isChatAllowed = true
	case database.ChatServiceFriendStatusBlocked:
		// Blocked/Requested side effect: disallow chat
		isChatAllowed = false
	}

	_, err = qtx.UpdateFriendshipStatus(ctx, database.UpdateFriendshipStatusParams{
		RequesterID: int32(targetUserId),
		AddresseeID: int32(callerId),
		Status: database.NullChatServiceFriendStatus{
			ChatServiceFriendStatus: dbStatus,
			Valid:                   true,
		},
		LastActionUserID: int32(callerId),
		IsChatAllowed: sql.NullBool{
			Bool:  isChatAllowed,
			Valid: true,
		},
	})

	if err != nil {
		http.Error(w, "Failed to update friendship", http.StatusInternalServerError)
		return
	}

	if dbStatus == database.ChatServiceFriendStatusAccepted {
		_, err = qtx.CreateDirectRoomWithMembers(ctx, database.CreateDirectRoomWithMembersParams{
			UserID:   int32(callerId),
			UserID_2: int32(targetUserId),
		})
		if err != nil {
			http.Error(w, "Failed to ensure chat room exists", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	prevStatus := currentFriendship.Status.ChatServiceFriendStatus
	isValidPrev := currentFriendship.Status.Valid

	// Scenario 1: Unfriending or Blocking (Accepted -> Blocked/Requested)
	// 1. Cutoff live status for both directions so neither sees typing/online
	if isValidPrev && prevStatus == database.ChatServiceFriendStatusAccepted {
		if dbStatus == database.ChatServiceFriendStatusBlocked || dbStatus == database.ChatServiceFriendStatusRequested {
			s.sendIsOnlineStatusEvent(targetUserId, callerId, false)
			s.sendIsOnlineStatusEvent(callerId, targetUserId, false)
		}
	}

	// Scenario 2: Becoming Friends (Pending/Requested -> Accepted)
	// 1. Instantly cross-pollinate online statuses if they are currently connected
	if dbStatus == database.ChatServiceFriendStatusAccepted && (!isValidPrev || prevStatus != database.ChatServiceFriendStatusAccepted) {
		if s.sseHub.IsUserOnline(targetUserId) {
			s.sendIsOnlineStatusEvent(callerId, targetUserId, true)
		}
		if s.sseHub.IsUserOnline(callerId) {
			s.sendIsOnlineStatusEvent(targetUserId, callerId, true)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) sendIsOnlineStatusEvent(targetId int, userId int, isOnline bool) {
	payload := api.StreamEvent{Type: api.USERSTATUS}
	err := payload.Payload.FromUserStatus(api.UserStatus{UserId: userId, IsOnline: isOnline})
	if err == nil {
		jsonData, err := json.Marshal(payload)
		if err == nil {
			s.sseHub.BroadcastToUsers([]int{targetId}, string(jsonData))
		}
	}
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

func (s *Server) GetFriendList(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}
	friends, err := s.db.GetQueries().GetFriendListWithChatIds(ctx, int32(userId))
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

func (s *Server) GetPendingFriendRequests(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	rows, err := s.db.GetQueries().GetPendingFriendRequests(ctx, int32(userId))
	if err != nil {
		http.Error(w, "Failed to retrieve pending friend requests", http.StatusInternalServerError)
		return
	}

	response := make(api.PendingFriendRequestList, 0, len(rows))
	for _, row := range rows {
		status := api.Pending // Default to pending if status is null, though ideally it should never be null for pending requests
		if row.Status.Valid {
			status = api.FriendshipStatus(row.Status.ChatServiceFriendStatus)
		}

		var addresseeID int32 // or int, depending on your struct

		if row.LastActionUserID == row.RequesterID {
			addresseeID = row.AddresseeID
		} else {
			addresseeID = row.RequesterID
		}

		response = append(response, api.PendingFriendRequest{
			RequesterId: int(row.LastActionUserID), // The one who sent the request is the last action user for pending requests
			AddresseeId: int(addresseeID),          // The other party is the addressee
			Status:      status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode pending friend requests", http.StatusInternalServerError)
		return
	}
}

func (s *Server) AcceptMessageRequest(w http.ResponseWriter, r *http.Request, requesterId int) {
	ctx := r.Context()

	receiverId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	qtx := s.db.GetQueries()

	// Get current friend state
	currentFriendship, err := qtx.GetFriendship(ctx, database.GetFriendshipParams{
		RequesterID: int32(requesterId),
		AddresseeID: int32(receiverId),
	})
	if err != nil {
		http.Error(w, "Friendship not found", http.StatusNotFound)
		return
	}

	if !currentFriendship.Status.Valid || currentFriendship.Status.ChatServiceFriendStatus != database.ChatServiceFriendStatusRequested {
		http.Error(w, "Friendship is not in requested state", http.StatusBadRequest)
		return
	}

	// Accept message request sets is_chat_allowed to true, status unchanged
	_, err = qtx.UpdateFriendshipStatus(ctx, database.UpdateFriendshipStatusParams{
		RequesterID: int32(requesterId),
		AddresseeID: int32(receiverId),
		Status: database.NullChatServiceFriendStatus{
			ChatServiceFriendStatus: currentFriendship.Status.ChatServiceFriendStatus,
			Valid:                   true,
		},
		LastActionUserID: int32(receiverId),
		IsChatAllowed: sql.NullBool{
			Bool:  true,
			Valid: true,
		},
	})
	if err != nil {
		http.Error(w, "Failed to accept message request", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) GetAllFriendshipStatuses(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	rows, err := s.db.GetQueries().GetAllFriendshipStatuses(ctx, int32(userId))
	if err != nil {
		http.Error(w, "Failed to retrieve friendship statuses", http.StatusInternalServerError)
		return
	}

	response := make([]api.FriendshipStatusItem, 0, len(rows))
	for _, row := range rows {
		var otherUserId int32

		if row.RequesterID == int32(userId) {
			otherUserId = row.AddresseeID
		} else {
			otherUserId = row.RequesterID
		}

		// 1. Create local copies of the values
		valUserId := int(otherUserId)
		valStatus := api.FriendshipStatus(row.Status.ChatServiceFriendStatus)

		response = append(response, api.FriendshipStatusItem{
			UserId: &valUserId,
			Status: &valStatus,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode friendship statuses", http.StatusInternalServerError)
		return
	}
}
