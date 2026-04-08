package server

import (
	"app/internal/api"
	"app/internal/database"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

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
		Type: api.NEWMESSAGE,
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

	s.broadcastToRoomExcept(memberIDs, senderId, payload)

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

// 1. Clear the global WriteTimeout for this specific long-lived connection
// Log error if the underlying connection doesn't support setting deadlines
// Create a ticker to send a heartbeat every 15 seconds
// Ensure the ticker is stopped when the client disconnects to prevent memory leaks
// Client disconnected
// Format: "data: <message>\n\n"
// Flush the data to the client immediately
// Heartbeat trigger
// Lines starting with a colon are SSE comments.
// The frontend EventSource ignores this, but it keeps the network socket alive.
func (s *Server) GetMessageStream(w http.ResponseWriter, r *http.Request, tempUserId int) {
	rc := http.NewResponseController(w)
	err := rc.SetWriteDeadline(time.Time{}) // time.Time{} is "zero value", meaning NO timeout
	if err != nil {
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

	// Broadcast "online" status to friends in a goroutine (non-blocking)
	go s.broadcastStatusToFriends(tempUserId, true)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-r.Context().Done():
			s.sseHub.mutex.Lock()
			delete(s.sseHub.userChannels, tempUserId)
			s.sseHub.mutex.Unlock()

			// Broadcast "offline" status to friends (synchronous during cleanup)
			s.broadcastStatusToFriends(tempUserId, false)
			return

		case message := <-sseCh:
			fmt.Fprintf(w, "data: %s\n\n", message)
			flusher.Flush()

		case <-ticker.C:
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
		}
	}
}

// 2. Map DB Rows to API Models
// Handle sql.NullString -> *string
// Handle []int32 -> *[]int
// 3. Encode the mapped slice
func (s *Server) GetUserInbox(w http.ResponseWriter, r *http.Request, tempUserId int) {
	ctx := r.Context()

	rows, err := s.db.GetQueries().GetUserInbox(ctx, int32(tempUserId))
	if err != nil {
		http.Error(w, "Failed to retrieve user chats", http.StatusInternalServerError)
		return
	}
	inbox := make([]api.ChatRoom, 0, len(rows))
	for _, row := range rows {
		chat := api.ChatRoom{
			ChatId: row.ChatID,
			Type:   api.ChatRoomType(row.Type),
		}

		if row.Name.Valid {
			nameVal := row.Name.String
			chat.Name = &nameVal
		}

		if row.MemberIds != nil {
			ids := make([]int, len(row.MemberIds))
			for i, v := range row.MemberIds {
				ids[i] = int(v)
			}
			chat.MemberIds = &ids
		}

		inbox = append(inbox, chat)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(inbox); err != nil {
		http.Error(w, "Failed to encode user chats", http.StatusInternalServerError)
		return
	}
}

// 1. Create a slice of the correct type ([]int32) with the right capacity
// 2. Convert and append the members from the request body
// 3. Append the creator (tempUserId) converted to int32
// 4. Use it in your database params
// 5. Explicitly Commit the Transaction
// Create the response slice with the type the API expects ([]int)
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

	members32 := make([]int32, 0, len(body.MemberIds)+1)

	for _, id := range body.MemberIds {
		members32 = append(members32, int32(id))
	}

	members32 = append(members32, int32(tempUserId))

	err = qtx.CreateRoomMembersForGroupChat(ctx, database.CreateRoomMembersForGroupChatParams{
		Column1: chatRoom.ID,
		Column2: int32(tempUserId),
		Column3: members32,
	})

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	apiMemberIDs := make([]int, len(members32))
	for i, v := range members32 {
		apiMemberIDs[i] = int(v)
	}

	response := api.ChatRoom{
		ChatId:    chatRoom.ID,
		Type:      api.ChatRoomType(chatRoom.Type),
		Name:      &chatRoom.Name.String,
		MemberIds: &apiMemberIDs,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

// Helper function to broadcast SSE events to room members, excluding the sender
// Don't send the event back to the sender
// If the member is online, send it
// Non-blocking send to prevent one slow client from freezing the loop
func (s *Server) broadcastToRoomExcept(memberIDs []int32, senderId int, payload string) {
	s.sseHub.BroadcastToRoomExcept(memberIDs, senderId, payload)
}

// SendTypingEvent handles the POST /message/typing/{chatId}/{tempSenderId} endpoint
// 1. Fetch all members of this room
// 2. Validate that the sender is actually a member of the chat
// Return 403 if they don't belong to the chat
// 3. Create the Typing Indicator Event
// 4. Push to all online members using our new helper
// 5. Ephemeral action complete; return 204 No Content
func (s *Server) SendTypingEvent(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID, tempSenderId int) {
	ctx := r.Context()
	memberIDs, err := s.db.GetQueries().GetRoomMemberIDs(ctx, chatId)
	if err != nil {
		http.Error(w, "Failed to fetch room members", http.StatusInternalServerError)
		return
	}
	isMember := false
	for _, id := range memberIDs {
		if int(id) == tempSenderId {
			isMember = true
			break
		}
	}
	if !isMember {
		http.Error(w, "Forbidden: Sender is not a member of this chat", http.StatusForbidden)
		return
	}
	data := api.StreamEvent{
		Type: api.USERTYPING,
	}
	err = data.Payload.FromTypingIndicator(api.TypingIndicator{
		ChatId:   chatId,
		SenderId: tempSenderId,
	})
	if err != nil {
		http.Error(w, "Failed to construct typing event payload", http.StatusInternalServerError)
		return
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		http.Error(w, "Failed to serialize typing event", http.StatusInternalServerError)
		return
	}
	s.broadcastToRoomExcept(memberIDs, tempSenderId, string(jsonData))
	w.WriteHeader(http.StatusNoContent)
}

// UpdateReadReceipt handles the PATCH /message/read/{chatId}/{tempUserId} endpoint
func (s *Server) UpdateReadReceipt(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID, tempUserId int) {
	ctx := r.Context()

	var reqBody api.UpdateReadReceiptJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	err := s.db.GetQueries().UpdateLastReadMessageID(ctx, database.UpdateLastReadMessageIDParams{
		LastReadMessageID: sql.NullInt64{Int64: int64(reqBody.MessageId), Valid: true},
		ChatID:            chatId,
		UserID:            int32(tempUserId),
	})
	if err != nil {
		http.Error(w, "Failed to update read receipt", http.StatusInternalServerError)
		return
	}

	memberIDs, err := s.db.GetQueries().GetRoomMemberIDs(ctx, chatId)
	if err != nil {
		http.Error(w, "Failed to fetch room members", http.StatusInternalServerError)
		return
	}

	data := api.StreamEvent{
		Type: api.USERREAD,
	}
	err = data.Payload.FromReadReceipt(api.ReadReceipt{
		ChatId:    chatId,
		UserId:    tempUserId,
		MessageId: reqBody.MessageId,
	})
	if err != nil {
		http.Error(w, "Failed to construct read receipt event payload", http.StatusInternalServerError)
		return
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		http.Error(w, "Failed to serialize read receipt event", http.StatusInternalServerError)
		return
	}

	s.broadcastToRoomExcept(memberIDs, tempUserId, string(jsonData))
	w.WriteHeader(http.StatusNoContent)
}
