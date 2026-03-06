# --- Stage 1: Base (Dependency Caching) ---
FROM golang:1.25.8-alpine AS base
WORKDIR /app
# Install build essentials for Cgo if needed (optional for 42KL projects)
COPY services/chat/go.mod services/chat/go.sum ./
RUN go mod download

# --- Stage 2: Development (Hot Reloading) ---
FROM base AS development
# Install Air for hot reloading
RUN go install github.com/air-verse/air@latest

# Expose port (default for Go apps varies, adjust as needed)
EXPOSE 8080

# Air will handle the build and run process
CMD ["air"]

# --- Stage 3: Builder (For Production) ---
FROM base AS builder
COPY services/chat/. .
# Build as a static binary to keep the prod image tiny
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

# --- Stage 4: Production ---
FROM alpine:3.23 AS prod
WORKDIR /app
COPY --from=builder /app/main /app/main
# # Add ca-certificates in case your chat service talks to external APIs (HTTPS)
# RUN apk add --no-cache ca-certificates
EXPOSE 8080
CMD ["./main"]