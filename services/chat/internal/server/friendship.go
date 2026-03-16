package server

import (
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

func (s *Server) AcceptFriendRequest(w http.ResponseWriter, r *http.Request, requesterId int, receiverId int) {
	ctx := r.Context()

	err := s.db.UpdateFriendshipStatus(ctx, database.UpdateFriendshipStatusParams{
		RequesterID: int32(requesterId),
		AddresseeID: int32(receiverId),
		Status: database.NullChatServiceFriendStatus{
			ChatServiceFriendStatus: database.ChatServiceFriendStatusACCEPTED,
			Valid:                   true,
		},
	})

	if err != nil {
		http.Error(w, "Failed to update friendship", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
