#!/bin/bash
set -euo pipefail

ARG="${1:-}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

for cmd in openssl keytool sha256sum; do
	if ! command -v "$cmd" >/dev/null 2>&1; then
		echo "Error: required command '$cmd' is not installed or not in PATH"
		exit 1
	fi
done

CN="ca.bumintra.org"

SAN_GATEWAY="gateway-service"
SAN_AUTH="auth-service"
SAN_CHAT="chat-service"
SAN_FORUM="forum-service"
SAN_NGINX="nginx-proxy"
SAN_WEB="web-service"

P12_PASS="bumintra"
TRUSTSTORE_PASS="bumintra"

# --- Ensure directories exist ---
mkdir -p certs/ca
mkdir -p certs/runtime/truststore
mkdir -p certs/runtime/gateway
mkdir -p certs/runtime/auth
mkdir -p certs/runtime/chat
mkdir -p certs/runtime/forum
mkdir -p certs/runtime/nginx
mkdir -p certs/runtime/web

# --- Generate CA ---
if [ ! -f "certs/ca/ca.key" ] || [ "$ARG" = "cagenkey" ]; then
	echo "Generating CA..."
	openssl genrsa -out certs/ca/ca.key 4096
	openssl req -x509 -new -nodes \
		-key certs/ca/ca.key \
		-sha256 -days 3650 \
		-out certs/ca/ca.crt \
		-subj "/CN=$CN"
	echo "✔ CA generated."
fi

if [ "$ARG" = "verify" ]; then
	openssl x509 -in certs/ca/ca.crt -noout -subject -issuer -dates
	exit 0
fi

# --- Generate SAN config ---
if [ ! -f "certs/ca/san.cnf" ] || [ "$ARG" = "cagensan" ]; then
	cat >certs/ca/san.cnf <<EOF
[ req_gateway ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @gateway_san

[ gateway_san ]
DNS.1 = ${SAN_GATEWAY}

[ req_auth ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @auth_san

[ auth_san ]
DNS.1 = ${SAN_AUTH}

[ req_chat ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @chat_san

[ chat_san ]
DNS.1 = ${SAN_CHAT}

[ req_forum ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @forum_san

[ forum_san ]
DNS.1 = ${SAN_FORUM}

[ req_nginx ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @nginx_san

[ nginx_san ]
DNS.1 = ${SAN_NGINX}
DNS.2 = localhost
IP.1 = 127.0.0.1

[ req_web ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @web_san

[ web_san ]
DNS.1 = ${SAN_WEB}
EOF
	echo "✔ SAN config generated."
fi

# --- Generate service certificates (idempotent per artifact) ---
for dir in gateway auth chat forum nginx web; do
	case "$dir" in
	gateway) SVC_CN="$SAN_GATEWAY" ;;
	auth) SVC_CN="$SAN_AUTH" ;;
	chat) SVC_CN="$SAN_CHAT" ;;
	forum) SVC_CN="$SAN_FORUM" ;;
	nginx) SVC_CN="$SAN_NGINX" ;;
	web) SVC_CN="$SAN_WEB" ;;
	esac

	KEY="certs/runtime/${dir}/${dir}.key"
	CSR="certs/runtime/${dir}/${dir}.csr"
	CRT="certs/runtime/${dir}/${dir}.crt"
	P12="certs/runtime/${dir}/${dir}-keystore.p12"

	# Force flags (optional)
	FORCE_KEY=0
	FORCE_CSR=0
	FORCE_CRT=0
	FORCE_P12=0

	# Example: use ARG to force regeneration
	# svcregen      -> regenerate all (keep CA)
	# svcregenkey   -> regenerate key+csr+crt
	# svcregencsr   -> regenerate csr+crt
	# svcregencrt   -> regenerate crt only
	if [ "${ARG:-}" = "svcregen" ]; then
		FORCE_KEY=1
		FORCE_CSR=1
		FORCE_CRT=1
		FORCE_P12=1
	elif [ "${ARG:-}" = "svcregenkey" ]; then
		FORCE_KEY=1
	elif [ "${ARG:-}" = "svcregencsr" ]; then
		FORCE_CSR=1
	elif [ "${ARG:-}" = "svcregencrt" ]; then
		FORCE_CRT=1
	elif [ "${ARG:-}" = "svcregenp12" ]; then
		FORCE_P12=1
	fi

	# --- Key ---
	if [ $FORCE_KEY -eq 1 ] || [ ! -f "$KEY" ]; then
		echo "[$dir] generating key..."
		rm -f "$CSR" "$CRT"
		openssl genrsa -out "$KEY" 2048
		FORCE_CSR=1
		FORCE_CRT=1
		chmod 600 "$KEY"
	fi

	# --- CSR ---
	if [ $FORCE_CSR -eq 1 ] || [ ! -f "$CSR" ]; then
		echo "[$dir] generating csr..."
		rm -f "$CRT"
		openssl req -new \
			-key "$KEY" \
			-out "$CSR" \
			-subj "/CN=${SVC_CN}"
		FORCE_CRT=1
	fi

	# --- CRT (sign) ---
	if [ $FORCE_CRT -eq 1 ] || [ ! -f "$CRT" ]; then
		echo "[$dir] signing crt..."
		openssl x509 -req \
			-in "$CSR" \
			-CA certs/ca/ca.crt \
			-CAkey certs/ca/ca.key \
			-CAcreateserial \
			-out "$CRT" \
			-days 825 \
			-sha256 \
			-extfile certs/ca/san.cnf \
			-extensions "req_${dir}"
	fi

	# --- P12 keystore ---
	if [[ $FORCE_P12 -eq 1 || ! -f "$P12" ]] && [[ "$dir" != 'nginx' ]] && [[ "$dir" != 'web' ]] && [[ "$dir" != 'forum' ]]; then
		echo "[$dir] generating PKCS12 keystore..."
		openssl pkcs12 -export \
			-inkey "$KEY" \
			-in "$CRT" \
			-certfile certs/ca/ca.crt \
			-name "$dir" \
			-out "$P12" \
			-passout pass:$P12_PASS
		chmod 644 "$P12"
	fi

	if [[ "$dir" = 'nginx' ]] || [[ "$dir" = 'web' ]] || [[ "$dir" = 'forum' ]]; then
		echo "[$dir] OK: key/csr/crt present (no keystore for ${dir})"
	else
		echo "[$dir] OK: key/csr/crt/p12 present"
	fi
	echo "-----------------------------------"
done

if [ ! -f "certs/runtime/truststore/shared-truststore.p12" ] || [ "${ARG:-}" = "svcgenp12" ]; then
	echo "[truststore] generating shared truststore..."

	keytool -importcert -noprompt \
		-alias internal-svc-ca \
		-file certs/ca/ca.crt \
		-keystore certs/runtime/truststore/shared-truststore.p12 \
		-storetype PKCS12 \
		-storepass $TRUSTSTORE_PASS

	echo "[truststore] created."
	echo "-----------------------------------"
else
	echo "[truststore] OK: shared truststore present"
	echo "-----------------------------------"
fi

AUTH_KEY_DIR="services/auth/src/main/resources"
AUTH_PRIVATE_KEY="${AUTH_KEY_DIR}/privateKey.pem"
AUTH_PUBLIC_KEY="${AUTH_KEY_DIR}/publicKey.pem"
GATEWAY_PUBLIC_KEY="services/gateway/src/main/resources/publicKey.pem"

JWT_REGEN=0
if [ "${ARG:-}" = "jwtregen" ]; then
	JWT_REGEN=1
	echo "[auth] forced JWT key rotation requested (jwtregen)"
	rm -f "$AUTH_PRIVATE_KEY" "$AUTH_PUBLIC_KEY"
fi

if [ ! -f "$AUTH_PRIVATE_KEY" ] || [ ! -f "$AUTH_PUBLIC_KEY" ]; then
	echo "[auth] generating JWT keys..."
	openssl genrsa -out "$AUTH_PRIVATE_KEY" 2048
	openssl rsa -in "$AUTH_PRIVATE_KEY" -pubout -out "$AUTH_PUBLIC_KEY"
	chmod 600 "$AUTH_PRIVATE_KEY"
	chmod 644 "$AUTH_PUBLIC_KEY"
else
	chmod 600 "$AUTH_PRIVATE_KEY"
	chmod 644 "$AUTH_PUBLIC_KEY"
	if [ "$JWT_REGEN" -eq 0 ]; then
		echo "[auth] JWT keys already exist (no rotation performed)"
	fi
fi

if [ ! -f "$AUTH_PUBLIC_KEY" ]; then
	echo "Error: auth public key not found at $AUTH_PUBLIC_KEY"
	exit 1
fi

mkdir -p "$(dirname "$GATEWAY_PUBLIC_KEY")"
cp "$AUTH_PUBLIC_KEY" "$GATEWAY_PUBLIC_KEY"

AUTH_PUB_SHA="$(sha256sum "$AUTH_PUBLIC_KEY" | awk '{print $1}')"
GW_PUB_SHA="$(sha256sum "$GATEWAY_PUBLIC_KEY" | awk '{print $1}')"

if [ "$AUTH_PUB_SHA" != "$GW_PUB_SHA" ]; then
	echo "Error: gateway public key does not match auth public key after copy"
	exit 1
fi

echo "[auth] public key synced to gateway and verified"
