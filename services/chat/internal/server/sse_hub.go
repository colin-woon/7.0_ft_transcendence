package server

import (
	"fmt"
	"sync"
)

// SseConnectionHub manages active SSE connections for real-time messaging
type SseConnectionHub struct {
	userChannels map[int]chan string
	mutex        sync.RWMutex
}

// NewSseConnectionHub creates a new SSE connection hub
func NewSseConnectionHub() *SseConnectionHub {
	return &SseConnectionHub{
		userChannels: make(map[int]chan string),
		mutex:        sync.RWMutex{},
	}
}

// BroadcastToRoomExcept sends a message to all users in a room except the sender
func (hub *SseConnectionHub) BroadcastToRoomExcept(memberIDs []int32, senderId int, payload string) {
	hub.mutex.RLock()
	defer hub.mutex.RUnlock()

	for _, memberId := range memberIDs {
		if int(memberId) == senderId {
			continue
		}
		if ch, ok := hub.userChannels[int(memberId)]; ok {
			select {
			case ch <- payload:
			default:
				fmt.Printf("Warning: channel full for user %d\n", memberId)
			}
		}
	}
}

// BroadcastToUsers sends a message to specific users (non-blocking)
func (hub *SseConnectionHub) BroadcastToUsers(userIds []int, payload string) {
	hub.mutex.RLock()
	defer hub.mutex.RUnlock()

	for _, userId := range userIds {
		if ch, ok := hub.userChannels[userId]; ok {
			select {
			case ch <- payload:
			default:
				fmt.Printf("Warning: channel full for user %d\n", userId)
			}
		}
	}
}

// IsUserOnline checks if a user has an active SSE connection
func (hub *SseConnectionHub) IsUserOnline(userId int) bool {
	hub.mutex.RLock()
	defer hub.mutex.RUnlock()
	_, online := hub.userChannels[userId]
	return online
}

// GetOnlineUsers returns a list of all currently connected user IDs
func (hub *SseConnectionHub) GetOnlineUsers(userIds []int) []int {
	hub.mutex.RLock()
	defer hub.mutex.RUnlock()

	online := make([]int, 0)
	for _, userId := range userIds {
		if _, exists := hub.userChannels[userId]; exists {
			online = append(online, userId)
		}
	}
	return online
}
