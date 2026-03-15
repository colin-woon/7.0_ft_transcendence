package server

import (
	"fmt"
	"net/http"
	"sync"
	"time"
	"app/internal/database"
)

type Server struct {
	port int
	sseHub *SseConnectionHub
	db database.Service
}

func NewServer() (*http.Server, func()) {
	port := 8080
	NewServer := &Server{
		port: port,
		sseHub: &SseConnectionHub {
			userChannels: make(map[int]chan string),
			mutex: sync.RWMutex{},
		},

		db: database.NewConnection(),
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	cleanup := func() {
		if err := NewServer.db.Close(); err != nil {
			fmt.Printf("Error closing database connection: %v\n", err)
		}
	}
	return server, cleanup
}
