#!/bin/bash

# --- CONFIGURATION ---
BASE_URL="http://localhost:8000" #
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== STARTING FULL FORUM API TEST ===${NC}"
echo "Target: $BASE_URL"

# ==============================================================================
# 1. CREATE PROJECT (POST /projects)
# ==============================================================================
echo -e "\n${GREEN}[1] Creating Project 'Minishell'...${NC}"

# Unique slug to prevent conflicts
SLUG="minishell_$(date +%s)"
PAYLOAD="{\"slug\": \"$SLUG\", \"name\": \"Minishell Project\", \"description\": \"Building a baby bash.\"}"

RESPONSE=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

PROJECT_ID=$(echo $RESPONSE | jq -r '.id')

if [ "$PROJECT_ID" == "null" ] || [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Failed to create project.${NC}"
    echo $RESPONSE | jq .
    exit 1
else
    echo -e "${GREEN}✅ Project Created! ID: $PROJECT_ID${NC}"
    echo $RESPONSE | jq .
fi

# ==============================================================================
# 2. LIST PROJECTS (GET /projects)
# ==============================================================================
echo -e "\n${GREEN}[2] Listing Projects...${NC}"
curl -s "$BASE_URL/projects" | jq .

# ==============================================================================
# 3. CREATE POST (POST /projects/{id}/posts)
# ==============================================================================
echo -e "\n${GREEN}[3] Creating Post in Project $PROJECT_ID...${NC}"

PAYLOAD='{"title": "How to handle pipes?", "content": "I am stuck on pipe() and dup2(). Help!"}'

RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/posts" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

POST_ID=$(echo $RESPONSE | jq -r '.id')

if [ "$POST_ID" == "null" ]; then
    echo -e "${RED}❌ Failed to create post.${NC}"
    echo $RESPONSE
    exit 1
else
    echo -e "${GREEN}✅ Post Created! ID: $POST_ID${NC}"
fi

# ==============================================================================
# 4. LIST PROJECT POSTS (GET /projects/{id}/posts)
# ==============================================================================
echo -e "\n${GREEN}[4] Listing Posts in Project $PROJECT_ID...${NC}"
# Should return a list (summary view)
curl -s "$BASE_URL/projects/$PROJECT_ID/posts" | jq .

# ==============================================================================
# 5. GET POST DETAIL (GET /posts/{id})
# ==============================================================================
echo -e "\n${GREEN}[5] Reading Post Detail (Increments View Count)...${NC}"
# This should increment view_count from 0 to 1
curl -s "$BASE_URL/posts/$POST_ID" | jq .

# ==============================================================================
# 6. CREATE COMMENT (POST /posts/{id}/comments)
# ==============================================================================
echo -e "\n${GREEN}[6] Adding Comment to Post $POST_ID...${NC}"

PAYLOAD='{"content": "Read the man page for pipe(2), it helps."}'

RESPONSE=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/comments" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

COMMENT_ID=$(echo $RESPONSE | jq -r '.id')

if [ "$COMMENT_ID" == "null" ]; then
    echo -e "${RED}❌ Failed to add comment.${NC}"
    echo $RESPONSE
else
    echo -e "${GREEN}✅ Comment Added! ID: $COMMENT_ID${NC}"
fi

# ==============================================================================
# 7. LIST COMMENTS (GET /posts/{id}/comments)
# ==============================================================================
echo -e "\n${GREEN}[7] Listing Comments for Post $POST_ID...${NC}"
curl -s "$BASE_URL/posts/$POST_ID/comments" | jq .

# ==============================================================================
# 8. VERIFY VIEW COUNT INCREMENT
# ==============================================================================
echo -e "\n${GREEN}[8] Verifying View Count Logic...${NC}"
# We read the post in Step 5. Reading it again here should make view_count = 2.
VIEW_COUNT=$(curl -s "$BASE_URL/posts/$POST_ID" | jq -r '.view_count')

if [ "$VIEW_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✅ View Count is working! Current count: $VIEW_COUNT${NC}"
else
    echo -e "${RED}⚠️ View Count did not increment correctly. Got: $VIEW_COUNT${NC}"
fi

echo -e "\n${BLUE}=== ALL TESTS COMPLETE ===${NC}"