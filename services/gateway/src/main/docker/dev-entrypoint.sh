#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/app}"
APP_USER="${APP_USER:-gatewaydev}"
APP_GROUP="${APP_GROUP:-gatewaydev}"
MAVEN_HOME_DIR="${MAVEN_CONFIG:-/tmp/.m2}"

if [ "$(id -u)" -ne 0 ]; then
  exec "$@"
fi

TARGET_UID="$(stat -c '%u' "$APP_DIR")"
TARGET_GID="$(stat -c '%g' "$APP_DIR")"

if getent group "$APP_GROUP" >/dev/null 2>&1; then
  groupmod -o -g "$TARGET_GID" "$APP_GROUP"
else
  groupadd -o -g "$TARGET_GID" "$APP_GROUP"
fi

if id -u "$APP_USER" >/dev/null 2>&1; then
  usermod -o -u "$TARGET_UID" -g "$TARGET_GID" "$APP_USER"
else
  useradd -o -u "$TARGET_UID" -g "$TARGET_GID" -d /tmp -s /bin/bash "$APP_USER"
fi

mkdir -p "$MAVEN_HOME_DIR/repository" "$APP_DIR/target"
chown -R "$TARGET_UID:$TARGET_GID" "$MAVEN_HOME_DIR" "$APP_DIR/target" 2>/dev/null || true

export HOME=/tmp

exec runuser -u "$APP_USER" -- "$@"
