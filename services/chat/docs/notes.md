Essentially, `oapi-codegen` builds the **pipes**, but you still have to provide the **water**.

Even with everything turned on, the generated code is just an empty shell (an `interface`). If you run it now, your server won't actually "do" anything because there is no logic connecting the HTTP request to your database.

Here is exactly what is left for you to do:

### 1. Implement the `ServerInterface`

The generated code defines an `interface` that looks something like this:

```go
type ServerInterface interface {
    PostFriendsRequesterIdReceiverId(w http.ResponseWriter, r *http.Request, requesterId int, receiverId int)
    PatchFriendsRequesterIdReceiverIdAccept(w http.ResponseWriter, r *http.Request, requesterId int, receiverId int)
}

```

You need to create a struct in `internal/server/friendship.go` that implements these methods. This is where you call your `sqlc` database functions.

### 2. Dependency Injection (The "Wiring")

You need to "glue" your database connection to your server logic. In your `internal/server/server.go`, you’ll define a struct that holds the database pool:

```go
type Server struct {
    Queries *database.Queries // This comes from your sqlc generated code
}

```

### 3. Register the Routes

In `internal/server/routes.go`, you have to tell the Chi router to use the generated handler. It looks like this:

```go
func RegisterHandlers(r chi.Router, s *Server) {
    api.HandlerFromMux(s, r) // This "connects" Chi to your logic
}

```

---

### The Workflow Visualization

### Summary: Who does what?

| Component | Who handles it? | Responsibility |
| --- | --- | --- |
| **Routing** | `oapi-codegen` | Matches `/friends/1/2` to the right function. |
| **Validation** | `oapi-codegen` | Ensures `id` is an `int`, not a `string`. |
| **Serialization** | `oapi-codegen` | Turns your Go structs into JSON for the client. |
| **Business Logic** | **YOU** | Checking if the user is blocked before friending. |
| **Database Ops** | **sqlc** (triggered by you) | Executing the actual `INSERT` or `UPDATE` SQL. |
