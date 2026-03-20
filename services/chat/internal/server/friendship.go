package server

import (
	"app/internal/api"
	"app/internal/database"
	"net/http"
	"strings"
)

func (s *Server) SendFriendRequest(w http.ResponseWriter, r *http.Request, requesterId int, receiverId int) {
	ctx := r.Context()

	_, err := s.db.CreateFriendship(ctx, database.CreateFriendshipParams{
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
	case api.Accepted:
		dbStatus = database.ChatServiceFriendStatusAccepted
	case api.Declined:
		dbStatus = database.ChatServiceFriendStatusDeclined
	case api.Blocked:
		dbStatus = database.ChatServiceFriendStatusBlocked
	case api.None:
		dbStatus = database.ChatServiceFriendStatusNone
	default:
		http.Error(w, "Invalid status value", http.StatusBadRequest)
		return
	}

	err := s.db.UpdateFriendshipStatus(ctx, database.UpdateFriendshipStatusParams{
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

	w.WriteHeader(http.StatusOK)
}
