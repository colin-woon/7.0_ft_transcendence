package server

import (
	"app/internal/api"
	"app/internal/database"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"
)

type SseConnectionHub struct {
	userChannels map[int]chan string
	mutex        sync.RWMutex
}

func (s *Server) SendMessage(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID, tempSenderId int) {
	ctx := r.Context()

	var body api.SendMessageJSONRequestBody

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := s.db.Queries().CreateMessage(ctx, database.CreateMessageParams{
		ChatID:   chatId,
		SenderID: int32(tempSenderId),
		Content:  body.Content,
	})

	if err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
	}
	s.sseHub.mutex.RLock()
	if ch, exists := s.sseHub.userChannels[tempSenderId]; exists {
		ch <- fmt.Sprintf("%s", body.Content)
	}
	s.sseHub.mutex.RUnlock()
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) GetMessageHistory(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID) {
	ctx := r.Context()

	history, err := s.db.Queries().GetMessageHistoryByChatId(ctx, chatId)
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
	// 1. Clear the global WriteTimeout for this specific long-lived connection
	rc := http.NewResponseController(w)
	err := rc.SetWriteDeadline(time.Time{}) // time.Time{} is "zero value", meaning NO timeout
	if err != nil {
		// Log error if the underlying connection doesn't support setting deadlines
		fmt.Printf("Error clearing write deadline: %v\n", err)
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	sseCh := make(chan string, 10)
	s.sseHub.mutex.Lock()
	s.sseHub.userChannels[tempUserId] = sseCh
	s.sseHub.mutex.Unlock()

	// Create a ticker to send a heartbeat every 15 seconds
	ticker := time.NewTicker(15 * time.Second)
	// Ensure the ticker is stopped when the client disconnects to prevent memory leaks
	defer ticker.Stop()
	for {
		select {
		// Client disconnected
		case <-r.Context().Done():
			s.sseHub.mutex.Lock()
			delete(s.sseHub.userChannels, tempUserId)
			s.sseHub.mutex.Unlock()
			return

		// Format: "data: <message>\n\n"
		// Flush the data to the client immediately
		case message := <-sseCh:
			fmt.Fprintf(w, "data: %s\n\n", message)
			flusher.Flush()

		// Heartbeat trigger
		case <-ticker.C:
			// Lines starting with a colon are SSE comments.
			// The frontend EventSource ignores this, but it keeps the network socket alive.
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
		}
	}
}
