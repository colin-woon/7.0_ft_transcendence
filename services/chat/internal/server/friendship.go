package server

import (
	"app/internal/api"
	"app/internal/database"
	"log"
	"net/http"
	"strings"
)

func (s *Server) SendFriendRequest(w http.ResponseWriter, r *http.Request, requesterId int, receiverId int) {
	ctx := r.Context()

	_, err := s.db.Queries().CreateFriendship(ctx, database.CreateFriendshipParams{
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

	// 1. Start the Database Transaction
	// Note: s.db should be your *sql.DB connection pool
	tx, err := s.db.GetDB().BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback() // Automatically rolls back if we exit before Commit()

	// 2. Bind the transaction to your sqlc Queries
	qtx := s.db.Queries().WithTx(tx)

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

func (s *Server) GetFriendList(w http.ResponseWriter, r *http.Request, tempUserId int) {
	// ctx := r.Context()

	// friends, err := s.db.Queries().GetFriendListWithRoomIds(ctx, int32(tempUserId))
	// if err != nil {
	// 	http.Error(w, "Failed to retrieve friend list", http.StatusInternalServerError)
	// 	return
	// }

	// w.Header().Set("Content-Type", "application/json")
	// json.NewEncoder(w).Encode(friends)
}
