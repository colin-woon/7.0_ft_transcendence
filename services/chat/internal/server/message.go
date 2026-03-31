package server

import (
	"app/internal/api"
	"app/internal/database"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

type SseConnectionHub struct {
	userChannels map[int]chan string
	mutex        sync.RWMutex
}

func (s *Server) SendMessage(w http.ResponseWriter, r *http.Request, chatId uuid.UUID, senderId int) {
	ctx := r.Context()

	var body api.SendMessageJSONRequestBody

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Save message to DB (using sqlc)
	savedMsg, err := s.db.GetQueries().CreateMessage(ctx, database.CreateMessageParams{
		ChatID:   chatId,
		SenderID: int32(senderId),
		Content:  body.Content,
	})

	if err != nil {
		http.Error(w, "Failed to save message", http.StatusInternalServerError)
		return
	}

	// 2. Fetch all members of this room (The Fan-Out Query)
	memberIDs, err := s.db.GetQueries().GetRoomMemberIDs(ctx, chatId)

	if err != nil {
		http.Error(w, "Failed to fetch room members", http.StatusInternalServerError)
		return
	}

	data := api.StreamEvent{
		Type: "NEW_MESSAGE",
	}
	data.Payload.FromChatMessage(api.ChatMessage{
		ChatId:    chatId,
		Content:   savedMsg.Content,
		CreatedAt: savedMsg.CreatedAt.Time,
		Id:        int(savedMsg.ID),
		SenderId:  senderId,
	})

	jsonData, err := json.Marshal(data)
	if err != nil {
		// handle error
	}
	payload := string(jsonData)

	// 4. Push to all online members
	// Use RLock for reading
	s.sseHub.mutex.RLock()
	for _, memberId := range memberIDs {
		// Don't send the message back to the sender via SSE (they already have it in UI)
		if int(memberId) == senderId {
			continue
		}

		// If the member is online, send it
		if ch, ok := s.sseHub.userChannels[int(memberId)]; ok {
			// Non-blocking send to prevent one slow client from freezing the loop
			select {
			case ch <- payload:
			default:
				fmt.Printf("Warning: channel full for user %d\n", memberId)
			}
		}
	}
	s.sseHub.mutex.RUnlock()

	// 5. Return 201 Created to the sender
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) GetMessageHistory(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID) {
	ctx := r.Context()

	history, err := s.db.GetQueries().GetMessageHistoryByChatId(ctx, chatId)
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

func (s *Server) GetUserInbox(w http.ResponseWriter, r *http.Request, tempUserId int) {
	ctx := r.Context()

	rows, err := s.db.GetQueries().GetUserInbox(ctx, int32(tempUserId))
	if err != nil {
		http.Error(w, "Failed to retrieve user chats", http.StatusInternalServerError)
		return
	}
	// 2. Map DB Rows to API Models
	inbox := make([]api.ChatRoom, 0, len(rows))
	for _, row := range rows {
		chat := api.ChatRoom{
			ChatId: row.ChatID,
			Type:   api.ChatRoomType(row.Type),
		}

		// Handle sql.NullString -> *string
		if row.Name.Valid {
			nameVal := row.Name.String
			chat.Name = &nameVal
		}

		// Handle []int32 -> *[]int
		if row.MemberIds != nil {
			ids := make([]int, len(row.MemberIds))
			for i, v := range row.MemberIds {
				ids[i] = int(v)
			}
			chat.MemberIds = &ids
		}

		inbox = append(inbox, chat)
	}

	// 3. Encode the mapped slice
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(inbox); err != nil {
		http.Error(w, "Failed to encode user chats", http.StatusInternalServerError)
		return
	}
}

func (s *Server) CreateGroupChat(w http.ResponseWriter, r *http.Request, tempUserId int) {
	ctx := r.Context()

	var body api.CreateGroupChatJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	tx, err := s.db.GetDB().BeginTx(ctx, nil)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	qtx := s.db.GetQueries().WithTx(tx)

	chatRoom, err := qtx.CreateGroupChatRoom(ctx, sql.NullString{
		String: body.Name,
		Valid:  true,
	})

	if err != nil {
		log.Printf("Error creating group chat room: %v", err)
		http.Error(w, "Failed to create group chat", http.StatusInternalServerError)
		return
	}

	// 1. Create a slice of the correct type ([]int32) with the right capacity
	members32 := make([]int32, 0, len(body.MemberIds)+1)

	// 2. Convert and append the members from the request body
	for _, id := range body.MemberIds {
		members32 = append(members32, int32(id))
	}

	// 3. Append the creator (tempUserId) converted to int32
	members32 = append(members32, int32(tempUserId))

	// 4. Use it in your database params
	err = qtx.CreateRoomMembersForGroupChat(ctx, database.CreateRoomMembersForGroupChatParams{
		Column1: chatRoom.ID,
		Column2: int32(tempUserId),
		Column3: members32, // No cast needed here now
	})

	// 5. Explicitly Commit the Transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Create the response slice with the type the API expects ([]int)
	apiMemberIDs := make([]int, len(members32))
	for i, v := range members32 {
		apiMemberIDs[i] = int(v)
	}

	response := api.ChatRoom{
		ChatId:    chatRoom.ID,
		Type:      api.ChatRoomType(chatRoom.Type),
		Name:      &chatRoom.Name.String, // Handle nullable strings correctly
		MemberIds: &apiMemberIDs,         // Just use what the user sent you!
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}
