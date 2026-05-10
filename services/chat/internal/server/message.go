package server

import (
	"app/internal/api"
	"app/internal/database"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
)

func (s *Server) SendMessage(w http.ResponseWriter, r *http.Request, chatId uuid.UUID) {
	ctx := r.Context()

	senderId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	var body api.SendMessageJSONRequestBody

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			http.Error(w, "Request body too large", http.StatusRequestEntityTooLarge)
			return
		}
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	permission, err := s.db.GetQueries().CheckChatPermissions(ctx, database.CheckChatPermissionsParams{
		ID:     chatId,          // From the URL
		UserID: int32(senderId), // From Context
	})

	if err != nil {
		if err == sql.ErrNoRows {
			// They are not in this room, or the room doesn't exist
			http.Error(w, "Unauthorized or chat not found", http.StatusForbidden)
			return
		}
		http.Error(w, "Failed to verify chat permissions", http.StatusInternalServerError)
		return
	}

	// 2. ENFORCE 'is_chat_allowed' ONLY FOR DIRECT CHATS
	if permission.RoomType == "direct" {
		// If there's no friendship record, or it explicitly says false, block it.
		if !permission.IsChatAllowed.Valid || !permission.IsChatAllowed.Bool {
			http.Error(w, "Sending messages is not allowed. Awaiting request approval or blocked.", http.StatusForbidden)
			return
		}
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

	members := make([]int, len(memberIDs))
	for i, id := range memberIDs {
		members[i] = int(id)
	}

	s.sseHub.BroadcastToUsers(members, payload)

	// 5. Return 201 Created to the sender
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) GetMessageHistory(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID) {
	ctx := r.Context()

	currUserId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	history, err := s.db.GetQueries().GetMessageHistoryByChatId(ctx, database.GetMessageHistoryByChatIdParams{
		ChatID:      chatId,
		AddresseeID: int32(currUserId),
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
func (s *Server) GetMessageStream(w http.ResponseWriter, r *http.Request) {
	userId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

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

	fmt.Fprintf(w, ": connected\n\n")
	flusher.Flush()

	sseCh := make(chan string, 10)
	s.sseHub.AddConnection(userId, sseCh)

	// Broadcast "online" status to friends in a goroutine (non-blocking)
	go s.broadcastStatusToFriends(userId, true)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-r.Context().Done():
			s.sseHub.RemoveConnection(userId, sseCh)

			// Broadcast "offline" status to friends (synchronous during cleanup)
			if !s.sseHub.IsUserOnline(userId) {
				s.broadcastStatusToFriends(userId, false)
			}
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

func (s *Server) GetUserInbox(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	rows, err := s.db.GetQueries().GetUserInbox(ctx, int32(userId))
	if err != nil {
		http.Error(w, "Failed to retrieve user chats", http.StatusInternalServerError)
		return
	}

	inbox := make([]api.ChatRoom, 0, len(rows))
	for _, row := range rows {
		chat := api.ChatRoom{
			ChatId:        row.ChatID,
			Type:          api.ChatRoomType(row.Type),
			IsAllowedChat: row.IsAllowedChat,
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

		// NEW: Map the requested_by field
		if row.RequestedBy != 0 {
			reqId := int(row.RequestedBy)
			chat.RequestedBy = &reqId
		}

		if row.FriendshipStatus.Valid {
			status := api.FriendshipStatus(row.FriendshipStatus.ChatServiceFriendStatus)
			chat.FriendshipStatus = &status
		}

		if row.LastReadMessageID.Valid {
			msgId := int(row.LastReadMessageID.Int64)
			chat.LastReadMessageId = &msgId
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
// 3. Append the creator (userId) converted to int32
// 4. Use it in your database params
// 5. Explicitly Commit the Transaction
// Create the response slice with the type the API expects ([]int)
func (s *Server) CreateGroupChat(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

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

	members32 = append(members32, int32(userId))

	err = qtx.CreateRoomMembersForGroupChat(ctx, database.CreateRoomMembersForGroupChatParams{
		Column1: chatRoom.ID,
		Column2: int32(userId),
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

// SendTypingEvent handles the POST /message/typing/{chatId} endpoint
// 1. Fetch all members of this room
// 2. Validate that the sender is actually a member of the chat
// Return 403 if they don't belong to the chat
// 3. Create the Typing Indicator Event
// 4. Push to all online members using our new helper
// 5. Ephemeral action complete; return 204 No Content
func (s *Server) SendTypingEvent(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID) {
	ctx := r.Context()

	senderId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	permission, err := s.db.GetQueries().CheckChatPermissions(ctx, database.CheckChatPermissionsParams{
		ID:     chatId,
		UserID: int32(senderId),
	})

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Forbidden: Sender is not a member of this chat", http.StatusForbidden)
			return
		}
		http.Error(w, "Failed to verify chat permissions", http.StatusInternalServerError)
		return
	}

	if permission.IsChatAllowed.Valid && !permission.IsChatAllowed.Bool {
		http.Error(w, "Forbidden: Sender is not allowed to send messages in this chat", http.StatusForbidden)
		return
	}

	memberIDs, err := s.db.GetQueries().GetRoomMemberIDs(ctx, chatId)
	if err != nil {
		http.Error(w, "Failed to fetch room members", http.StatusInternalServerError)
		return
	}

	filteredMemberIDs := make([]int32, 0, len(memberIDs))
	for _, id := range memberIDs {
		if int(id) == senderId {
			continue
		}

		friendship, err := s.db.GetQueries().GetFriendship(ctx, database.GetFriendshipParams{
			RequesterID: int32(senderId),
			AddresseeID: id,
		})
		if err == nil && friendship.Status.Valid && friendship.Status.ChatServiceFriendStatus == database.ChatServiceFriendStatusAccepted {
			filteredMemberIDs = append(filteredMemberIDs, id)
		}
	}

	if len(filteredMemberIDs) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	data := api.StreamEvent{
		Type: api.USERTYPING,
	}
	err = data.Payload.FromTypingIndicator(api.TypingIndicator{
		ChatId:   chatId,
		SenderId: senderId,
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
	s.sseHub.BroadcastToRoomExcept(filteredMemberIDs, senderId, string(jsonData))
	w.WriteHeader(http.StatusNoContent)
}

// UpdateReadReceipt handles the PATCH /message/read/{chatId} endpoint
func (s *Server) UpdateReadReceipt(w http.ResponseWriter, r *http.Request, chatId openapi_types.UUID) {
	ctx := r.Context()

	userId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	var reqBody api.UpdateReadReceiptJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	err := s.db.GetQueries().UpdateLastReadMessageID(ctx, database.UpdateLastReadMessageIDParams{
		LastReadMessageID: sql.NullInt64{Int64: int64(reqBody.MessageId), Valid: true},
		ChatID:            chatId,
		UserID:            int32(userId),
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
		UserId:    userId,
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

	filteredMemberIDs := make([]int32, 0, len(memberIDs))
	for _, id := range memberIDs {
		if int(id) == userId {
			continue
		}

		friendship, err := s.db.GetQueries().GetFriendship(ctx, database.GetFriendshipParams{
			RequesterID: int32(userId),
			AddresseeID: id,
		})
		if err == nil && friendship.Status.Valid && friendship.Status.ChatServiceFriendStatus == database.ChatServiceFriendStatusAccepted {
			filteredMemberIDs = append(filteredMemberIDs, id)
		}
	}

	if len(filteredMemberIDs) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	s.sseHub.BroadcastToRoomExcept(filteredMemberIDs, userId, string(jsonData))
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) SendMessageRequest(w http.ResponseWriter, r *http.Request, receiverId int) {
	ctx := r.Context()

	senderId, ok := r.Context().Value(userIDKey).(int)
	if !ok {
		http.Error(w, "Internal Server Error: Missing User ID in context", http.StatusInternalServerError)
		return
	}

	var body api.SendMessageRequestJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			http.Error(w, "Request body too large", http.StatusRequestEntityTooLarge)
			return
		}
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

	existing, err := qtx.GetFriendship(ctx, database.GetFriendshipParams{
		RequesterID: int32(senderId),
		AddresseeID: int32(receiverId),
	})

	if err != nil {
		if err == sql.ErrNoRows {
			// Create friendship with "requested" status and is_chat_allowed = false
			_, err = qtx.CreateMessageRequestFriendship(ctx, database.CreateMessageRequestFriendshipParams{
				RequesterID:      int32(senderId),
				AddresseeID:      int32(receiverId),
				LastActionUserID: int32(senderId),
			})
			if err != nil {
				if strings.Contains(err.Error(), "friendship_id_order") {
					http.Error(w, "Cannot friend yourself", http.StatusBadRequest)
					return
				}
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
	} else {
		// If chat already allowed, must use standard /message/{chatId}
		if existing.IsChatAllowed.Valid && existing.IsChatAllowed.Bool {
			http.Error(w, "Chat already allowed", http.StatusBadRequest)
			return
		}

		if existing.Status.Valid && existing.Status.ChatServiceFriendStatus != database.ChatServiceFriendStatusRequested &&
			existing.Status.ChatServiceFriendStatus != database.ChatServiceFriendStatusPending {
			http.Error(w, "Friendship already exists", http.StatusConflict)
			return
		}
	}

	chatId, err := qtx.CreateDirectRoomWithMembers(ctx, database.CreateDirectRoomWithMembersParams{
		UserID:   int32(senderId),
		UserID_2: int32(receiverId),
	})
	if err != nil {
		http.Error(w, "Failed to initialize chat room", http.StatusInternalServerError)
		return
	}

	history, _ := qtx.GetMessageHistoryByChatId(ctx, database.GetMessageHistoryByChatIdParams{
		ChatID:      chatId,
		AddresseeID: int32(receiverId),
	})
	if len(history) > 0 {
		http.Error(w, "Message request already sent", http.StatusConflict)
		return
	}

	savedMsg, err := qtx.CreateMessage(ctx, database.CreateMessageParams{
		ChatID:   chatId,
		SenderID: int32(senderId),
		Content:  body.Content,
	})
	if err != nil {
		http.Error(w, "Failed to save message", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Push SSE
	memberIDs := []int32{int32(senderId), int32(receiverId)}
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

	jsonData, _ := json.Marshal(data)
	s.sseHub.BroadcastToRoomExcept(memberIDs, senderId, string(jsonData))

	w.WriteHeader(http.StatusCreated)
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

	status := currentFriendship.Status.ChatServiceFriendStatus
	isReqOrPend := status == database.ChatServiceFriendStatusRequested ||
		status == database.ChatServiceFriendStatusPending

	if !currentFriendship.Status.Valid || !isReqOrPend {
		http.Error(w, "Friendship is not in requested or pending state", http.StatusBadRequest)
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
		LastActionUserID: currentFriendship.LastActionUserID,
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
