#remember to install jq for output formatting - apt-get install jq
#!/bin/bash

# --- CONFIGURATION ---
BASE_URL="http://localhost:8002/auth"
# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== STARTING DTO & API TESTS (CORRECTED) ===${NC}"

# ==============================================================================
# TEST 1: CREATE USER (Testing UserCreateDTO)
# ==============================================================================
echo -e "\n${GREEN}[1] Testing Registration...${NC}"
echo "Endpoint: POST /register"

# Random username to ensure unique constraint passes
RANDOM_USER="user_$(date +%s)"
REGISTER_PAYLOAD=$(cat <<EOF
{
  "email": "${RANDOM_USER}@example.com",
  "username": "${RANDOM_USER}",
  "fullName": "Test User",
  "avatarUrl": "http://avatar.com/default.png"
}
EOF
)

# 1. Send Request & Capture Response
RESPONSE=$(curl -s -X POST "${BASE_URL}/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_PAYLOAD")

# 2. Extract ID
USER_ID=$(echo $RESPONSE | jq -r '.id')

if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ Registration Failed!${NC}"
    echo "Server Output: $RESPONSE"
    exit 1
else
    echo -e "${GREEN}✅ Registered User ID: $USER_ID${NC}"
    echo $RESPONSE | jq .
fi

# ==============================================================================
# TEST 2: GET PROFILE (Testing UserResponseDTO)
# ==============================================================================
echo -e "\n${GREEN}[2] Testing Get Profile (UserResponseDTO)...${NC}"
echo "Endpoint: GET /userinfo/${USER_ID}"  # <--- UPDATED URL HERE

# Capture response to variable first to avoid jq crashes on error
PROFILE_RESPONSE=$(curl -s -X GET "${BASE_URL}/userinfo/${USER_ID}")

# Check if response is valid JSON before parsing
if echo "$PROFILE_RESPONSE" | jq . > /dev/null 2>&1; then
    echo "$PROFILE_RESPONSE" | jq .
else
    echo -e "${RED}❌ Failed to fetch profile. Raw output:${NC}"
    echo "$PROFILE_RESPONSE"
fi

# ==============================================================================
# TEST 3: UPDATE USER (Testing UserUpdateDTO + Security)
# ==============================================================================
echo -e "\n${GREEN}[3] Testing Update (UserUpdateDTO)...${NC}"
echo "Endpoint: PATCH /update/${USER_ID}" # <--- UPDATED URL HERE
echo "Attempting to update 'bio' (ALLOWED) and 'role' (FORBIDDEN)."

UPDATE_PAYLOAD=$(cat <<EOF
{
  "bio": "I am a new bio!",
  "role": "ADMIN"
}
EOF
)

UPDATE_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/update/${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD")

echo "Response after update:"
if echo "$UPDATE_RESPONSE" | jq . > /dev/null 2>&1; then
    echo "$UPDATE_RESPONSE" | jq .
    
    # Verification
    ROLE_CHECK=$(echo $UPDATE_RESPONSE | jq -r '.role')
    BIO_CHECK=$(echo $UPDATE_RESPONSE | jq -r '.bio')

    if [ "$ROLE_CHECK" == "STUDENT" ] && [ "$BIO_CHECK" == "I am a new bio!" ]; then
        echo -e "${GREEN}✅ SUCCESS: Bio updated, Role remained STUDENT.${NC}"
    else
        echo -e "${RED}❌ FAILED: Security check failed.${NC}"
    fi
else
    echo -e "${RED}❌ Update Failed. Raw output:${NC}"
    echo "$UPDATE_RESPONSE"
fi

echo -e "\n${GREEN}=== TEST COMPLETE ===${NC}"