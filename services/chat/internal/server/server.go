package server

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
	"app/internal/database"
)

type Server struct {
	port   int
	sseHub *SseConnectionHub
	db     database.Service
}

type TransportConfig struct {
	TLSEnabled bool
	CertFile   string
	KeyFile    string
	CAFile     string
}

func NewServer() (*http.Server, func(), TransportConfig) {
	port := envInt("CHAT_PORT", 8080)
	NewServer := &Server{
		port: port,
		sseHub: &SseConnectionHub{
			userChannels: make(map[int]chan string),
			mutex:        sync.RWMutex{},
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

	tlsConfig := TransportConfig{
		TLSEnabled: envBool("CHAT_TLS_ENABLED", false),
		CertFile:   os.Getenv("CHAT_TLS_CERT_FILE"),
		KeyFile:    os.Getenv("CHAT_TLS_KEY_FILE"),
		CAFile:     os.Getenv("CHAT_TLS_CA_FILE"),
	}

	if tlsConfig.TLSEnabled {
		serverTLSConfig, err := buildTLSConfig(tlsConfig)
		if err != nil {
			panic(fmt.Sprintf("failed to build chat TLS config: %v", err))
		}
		server.TLSConfig = serverTLSConfig
	}

	cleanup := func() {
		if err := NewServer.db.Close(); err != nil {
			fmt.Printf("Error closing database connection: %v\n", err)
		}
	}
	return server, cleanup, tlsConfig
}

func buildTLSConfig(cfg TransportConfig) (*tls.Config, error) {
	cert, err := tls.LoadX509KeyPair(cfg.CertFile, cfg.KeyFile)
	if err != nil {
		return nil, fmt.Errorf("load key pair: %w", err)
	}

	caPEM, err := os.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, fmt.Errorf("read client CA: %w", err)
	}

	caPool := x509.NewCertPool()
	if !caPool.AppendCertsFromPEM(caPEM) {
		return nil, fmt.Errorf("append client CA certs")
	}

	return &tls.Config{
		MinVersion:   tls.VersionTLS12,
		Certificates: []tls.Certificate{cert},
		ClientCAs:    caPool,
		ClientAuth:   tls.RequireAndVerifyClientCert,
	}, nil
}

func envInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}

func envBool(key string, fallback bool) bool {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}

	value, err := strconv.ParseBool(raw)
	if err != nil {
		return fallback
	}
	return value
}
