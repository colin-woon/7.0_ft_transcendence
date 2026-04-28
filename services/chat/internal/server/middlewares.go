package server

import (
	"context"
	"net/http"
	"strconv"
)

// Define a custom type for the context key to avoid collisions
type contextKey string

const userIDKey contextKey = "userId"

// AuthMiddleware extracts the X-User-Id header injected by the API Gateway.
// It accepts an 'env' string to allow a fallback user in development mode.
// Dev Mode Fallback: If no header is provided in local dev, default to user 1
// Inject the ID into the request context
// Pass the request to the next handler with the new context
func AuthMiddleware(env string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			idStr := r.Header.Get("X-Intra-User-Id")

			if idStr == "" && env == "development" {
				idStr = "1"
			}

			id, err := strconv.Atoi(idStr)
			if err != nil || id == 0 {
				http.Error(w, "Unauthorized: Invalid or missing X-Intra-User-Id", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, id)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func BodyLimitMiddleware(limit int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, limit)
			next.ServeHTTP(w, r)
		})
	}
}
