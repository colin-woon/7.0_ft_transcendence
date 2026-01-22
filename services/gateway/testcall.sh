#!/usr/bin/env bash

GATEWAY="http://localhost:8080/api/auth/verify"

echo "=============================="
echo "Gateway Auth Test Matrix"
echo "=============================="

run() {
  echo
  echo "▶ $1"
  shift
  curl -s -i "$@" | sed 's/\r//'
}

# ──────────────────────────────
# POLICY-LEVEL FAILURES
# ──────────────────────────────

run "1) Missing Authorization header → AUTH_REQUIRED" \
  "$GATEWAY"

run "2) Empty Authorization header → AUTH_REQUIRED" \
  -H "Authorization:" \
  "$GATEWAY"

# ──────────────────────────────
# SERVICE-LEVEL FAILURES (4xx)
# ──────────────────────────────

run "3) Auth service returns 401 → SERVICE_CLIENT_ERROR" \
  -H "Authorization: 401" \
  "$GATEWAY"

run "4) Auth service returns 403 → SERVICE_CLIENT_ERROR" \
  -H "Authorization: 403" \
  "$GATEWAY"

run "5) Auth service returns 404 → SERVICE_CLIENT_ERROR" \
  -H "Authorization: 404" \
  "$GATEWAY"

# ──────────────────────────────
# SERVICE-LEVEL FAILURES (5xx)
# ──────────────────────────────

run "6) Auth service returns 500 → SERVICE_SERVER_ERROR" \
  -H "Authorization: 500" \
  "$GATEWAY"

# ──────────────────────────────
# PROTOCOL FAILURE
# ──────────────────────────────

run "7) Auth service returns bad body → SERVICE_INVALID_RESPONSE" \
  -H "Authorization: BAD_BODY" \
  "$GATEWAY"

# ──────────────────────────────
# TIMEOUT FAILURE
# ──────────────────────────────

run "8) Auth service timeout → SERVICE_TIMEOUT" \
  -H "Authorization: TIMEOUT" \
  "$GATEWAY"

# ──────────────────────────────
# SUCCESS
# ──────────────────────────────

run "9) Valid token → SUCCESS" \
  -H "Authorization: test" \
  "$GATEWAY"

echo
echo "=============================="
echo "Test run complete"
echo "=============================="

