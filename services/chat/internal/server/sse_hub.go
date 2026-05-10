package server

import (
	"fmt"
	"sync"
)

// SseConnectionHub manages active SSE connections for real-time messaging
type SseConnectionHub struct {
	userChannels map[int]map[chan string]bool
	mutex        sync.RWMutex
}

// NewSseConnectionHub creates a new SSE connection hub
func NewSseConnectionHub() *SseConnectionHub {
	return &SseConnectionHub{
		userChannels: make(map[int]map[chan string]bool),
		mutex:        sync.RWMutex{},
	}
}

// AddConnection registers a new SSE channel for a user
func (hub *SseConnectionHub) AddConnection(userId int, ch chan string) {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	if _, exists := hub.userChannels[userId]; !exists {
		hub.userChannels[userId] = make(map[chan string]bool)
	}
	hub.userChannels[userId][ch] = true
}

// RemoveConnection unregisters an SSE channel for a user
func (hub *SseConnectionHub) RemoveConnection(userId int, ch chan string) {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	if channels, exists := hub.userChannels[userId]; exists {
		delete(channels, ch)
		if len(channels) == 0 {
			delete(hub.userChannels, userId)
		}
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
		if channels, ok := hub.userChannels[int(memberId)]; ok {
			for ch := range channels {
				select {
				case ch <- payload:
				default:
					fmt.Printf("Warning: channel full for user %d\n", memberId)
				}
			}
		}
	}
}

// BroadcastToUsers sends a message to specific users (non-blocking)
func (hub *SseConnectionHub) BroadcastToUsers(userIds []int, payload string) {
	hub.mutex.RLock()
	defer hub.mutex.RUnlock()

	for _, userId := range userIds {
		if channels, ok := hub.userChannels[userId]; ok {
			for ch := range channels {
				select {
				case ch <- payload:
				default:
					fmt.Printf("Warning: channel full for user %d\n", userId)
				}
			}
		}
	}
}

// IsUserOnline checks if a user has an active SSE connection
func (hub *SseConnectionHub) IsUserOnline(userId int) bool {
	hub.mutex.RLock()
	defer hub.mutex.RUnlock()
	channels, online := hub.userChannels[userId]
	return online && len(channels) > 0
}

// GetOnlineUsers returns a list of all currently connected user IDs
func (hub *SseConnectionHub) GetOnlineUsers(userIds []int) []int {
	hub.mutex.RLock()
	defer hub.mutex.RUnlock()

	online := make([]int, 0)
	for _, userId := range userIds {
		if channels, exists := hub.userChannels[userId]; exists && len(channels) > 0 {
			online = append(online, userId)
		}
	}
	return online
}
