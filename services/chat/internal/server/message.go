package server

import (
	"app/internal/api"
	"app/internal/database"
	"encoding/json"
	"net/http"
)

func (s *Server) PostMessageSenderIdReceiverId(w http.ResponseWriter, r *http.Request, senderId int, receiverId int) {
	ctx := r.Context()

	var body api.PostMessageSenderIdReceiverIdJSONRequestBody

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := s.db.SendMessage(ctx, database.SendMessageParams{
		SenderID:   int32(senderId),
		ReceiverID: int32(receiverId),
		Content:    body.Content,
	})

	if err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
	}
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) GetHistorySenderIdReceiverId(w http.ResponseWriter, r *http.Request, senderId int, receiverId int) {
	ctx := r.Context()

	history, err := s.db.GetChatHistory(ctx, database.GetChatHistoryParams{
		SenderID:   int32(senderId),
		ReceiverID: int32(receiverId),
	})

	if err != nil {
		http.Error(w, "Failed to retrieve chat history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(history); err != nil {
		http.Error(w, "Failed to encode chat history", http.StatusInternalServerError)
		return
	}
}
