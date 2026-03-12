package server

import (
	"app/internal/api"
	"app/internal/database"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func (s *Server) SendMessage(w http.ResponseWriter, r *http.Request, senderId int, receiverId int) {
	ctx := r.Context()

	var body api.SendMessageJSONRequestBody

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := s.db.CreateMessage(ctx, database.CreateMessageParams{
		SenderID:   int32(senderId),
		ReceiverID: int32(receiverId),
		Content:    body.Content,
	})

	if err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
	}
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) GetMessageHistory(w http.ResponseWriter, r *http.Request, senderId int, receiverId int) {
	ctx := r.Context()

	history, err := s.db.GetMessageHistoryByUserPair(ctx, database.GetMessageHistoryByUserPairParams{
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

func (s *Server) GetMessageStream(w http.ResponseWriter, r *http.Request, tempUserId int) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// 3. Setup a 10-second ticker
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			// Client disconnected
			return
		case t := <-ticker.C:
			// Format: "data: <message>\n\n"
			fmt.Fprintf(w, "data: The time is %s\n\n", t.Format(time.RFC3339))

			// Flush the data to the client immediately
			flusher.Flush()
		}
	}
}
