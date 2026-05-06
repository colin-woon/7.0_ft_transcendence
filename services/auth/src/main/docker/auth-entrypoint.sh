#!/usr/bin/env bash
set -euo pipefail

SEED_FILE_PATH="${AUTH_SEED_FILE_PATH:-/var/lib/auth/seed/seed_file.json}"

mkdir -p "/var/lib/auth/avatars" "$(dirname "$SEED_FILE_PATH")"
if [[ ! -f "$SEED_FILE_PATH" ]]; then
	printf '[]\n' > "$SEED_FILE_PATH"
fi

chown -R 185:0 /var/lib/auth
chmod -R u+rwX,g+rwX /var/lib/auth

if [[ "$(id -u)" -eq 0 ]]; then
	exec setpriv --reuid=185 --regid=0 --clear-groups -- "$@"
fi

exec "$@"
