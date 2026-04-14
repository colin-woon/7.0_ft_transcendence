#!/bin/bash
set -euo pipefail

MODE="${1:-regen}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

for cmd in openssl keytool sha256sum; do
	if ! command -v "$cmd" >/dev/null 2>&1; then
		echo "Error: required command '$cmd' is not installed or not in PATH"
		exit 1
	fi
done

CN="ca.42overflow.com"

SAN_GATEWAY="gateway-service"
SAN_AUTH="auth-service"
SAN_CHAT="chat-service"
SAN_FORUM="forum-service"
SAN_NGINX="nginx-proxy"
SAN_WEB="web-service"
SAN_PROMETHEUS="prometheus-service"
SAN_GRAFANA="grafana-service"
SAN_POSTGRES_EXPORTER="postgres-exporter-service"

P12_PASS="bumintra"
TRUSTSTORE_PASS="bumintra"

AUTH_KEY_DIR="services/auth/src/main/resources"
AUTH_PRIVATE_KEY="${AUTH_KEY_DIR}/privateKey.pem"
AUTH_PUBLIC_KEY="${AUTH_KEY_DIR}/publicKey.pem"
GATEWAY_PUBLIC_KEY="services/gateway/src/main/resources/publicKey.pem"
GRAFANA_DS_PROD="infra/obs/grafana/provisioning/datasources/prometheus.prod.yml"

ensure_dirs() {
	mkdir -p certs/ca
	mkdir -p certs/runtime/truststore
	mkdir -p certs/runtime/gateway
	mkdir -p certs/runtime/auth
	mkdir -p certs/runtime/chat
	mkdir -p certs/runtime/forum
	mkdir -p certs/runtime/nginx
	mkdir -p certs/runtime/web
	mkdir -p certs/runtime/prometheus
	mkdir -p certs/runtime/grafana
	mkdir -p certs/runtime/postgres_exporter
}

clean_all() {
	echo "Cleaning generated certificates and JWT keys..."
	rm -rf certs/runtime certs/ca
	rm -f "$AUTH_PRIVATE_KEY" "$AUTH_PUBLIC_KEY" "$GATEWAY_PUBLIC_KEY"
	echo "✔ Clean complete."
}

write_san_config() {
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

[ req_prometheus ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @prometheus_san

[ prometheus_san ]
DNS.1 = ${SAN_PROMETHEUS}

[ req_grafana ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @grafana_san

[ grafana_san ]
DNS.1 = ${SAN_GRAFANA}

[ req_postgres_exporter ]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @postgres_exporter_san

[ postgres_exporter_san ]
DNS.1 = ${SAN_POSTGRES_EXPORTER}
EOF
	echo "✔ SAN config generated."
}

generate_ca() {
	echo "Generating CA..."
	openssl genrsa -out certs/ca/ca.key 4096
	openssl req -x509 -new -nodes \
		-key certs/ca/ca.key \
		-sha256 -days 3650 \
		-out certs/ca/ca.crt \
		-subj "/CN=$CN"
	echo "✔ CA generated."
}

verify_all() {
	if [ ! -f "certs/ca/ca.crt" ]; then
		echo "Error: certs/ca/ca.crt not found"
		exit 1
	fi

	openssl x509 -in certs/ca/ca.crt -noout -subject -issuer -dates
	echo "-----------------------------------"

	for dir in gateway auth chat forum nginx web prometheus grafana postgres_exporter; do
		CRT="certs/runtime/${dir}/${dir}.crt"
		if [ -f "$CRT" ]; then
			echo "[$dir] crt present"
			openssl x509 -in "$CRT" -noout -subject -issuer -dates | sed 's/^/  /'
		else
			echo "[$dir] crt missing"
		fi
		echo "-----------------------------------"
	done

	if [ -f "$AUTH_PUBLIC_KEY" ] && [ -f "$GATEWAY_PUBLIC_KEY" ]; then
		AUTH_PUB_SHA="$(sha256sum "$AUTH_PUBLIC_KEY" | awk '{print $1}')"
		GW_PUB_SHA="$(sha256sum "$GATEWAY_PUBLIC_KEY" | awk '{print $1}')"
		if [ "$AUTH_PUB_SHA" = "$GW_PUB_SHA" ]; then
			echo "[auth] gateway public key matches auth public key"
		else
			echo "[auth] gateway public key does NOT match auth public key"
			exit 1
		fi
	else
		echo "[auth] JWT public keys missing"
	fi
}

write_grafana_prod_datasource() {
	echo "[grafana] generating prod datasource provisioning..."

	local ca_cert client_cert client_key
	ca_cert="$(sed 's/^/              /' certs/ca/ca.crt)"
	client_cert="$(sed 's/^/              /' certs/runtime/grafana/grafana.crt)"
	client_key="$(sed 's/^/              /' certs/runtime/grafana/grafana.key)"

	cat >"$GRAFANA_DS_PROD" <<EOF
apiVersion: 1

datasources:
    - name: Prometheus
      uid: prometheus
      type: prometheus
      access: proxy
      url: https://prometheus-service:9090/prometheus/
      isDefault: true
      editable: false
      jsonData:
          tlsAuth: true
          tlsAuthWithCACert: true
          serverName: prometheus-service
      secureJsonData:
          tlsCACert: |
$ca_cert
          tlsClientCert: |
$client_cert
          tlsClientKey: |
$client_key
EOF
	echo "[grafana] prod datasource provisioning written"
	echo "-----------------------------------"
}

case "$MODE" in
"" | regen)
	clean_all
	;;
clean)
	clean_all
	exit 0
	;;
verify)
	verify_all
	exit 0
	;;
*)
	echo "Usage: ./certs.sh [clean|verify]"
	exit 1
	;;
esac

ensure_dirs
generate_ca
write_san_config

for dir in gateway auth chat forum nginx web prometheus grafana postgres_exporter; do
	case "$dir" in
	gateway) SVC_CN="$SAN_GATEWAY" ;;
	auth) SVC_CN="$SAN_AUTH" ;;
	chat) SVC_CN="$SAN_CHAT" ;;
	forum) SVC_CN="$SAN_FORUM" ;;
	nginx) SVC_CN="$SAN_NGINX" ;;
	web) SVC_CN="$SAN_WEB" ;;
	prometheus) SVC_CN="$SAN_PROMETHEUS" ;;
	grafana) SVC_CN="$SAN_GRAFANA" ;;
	postgres_exporter) SVC_CN="$SAN_POSTGRES_EXPORTER" ;;
	esac

	KEY="certs/runtime/${dir}/${dir}.key"
	CSR="certs/runtime/${dir}/${dir}.csr"
	CRT="certs/runtime/${dir}/${dir}.crt"
	P12="certs/runtime/${dir}/${dir}-keystore.p12"
	NEEDS_P12=0

	case "$dir" in
	gateway | auth) NEEDS_P12=1 ;;
	esac

	# --- Key ---
	echo "[$dir] generating key..."
	openssl genrsa -out "$KEY" 2048
	if [[ $NEEDS_P12 -eq 1 ]]; then
		chmod 600 "$KEY"
	else
		chmod 644 "$KEY"
	fi

	# --- CSR ---
	echo "[$dir] generating csr..."
	openssl req -new \
		-key "$KEY" \
		-out "$CSR" \
		-subj "/CN=${SVC_CN}"

	# --- CRT (sign) ---
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

	# --- P12 keystore ---
	if [[ $NEEDS_P12 -eq 1 ]]; then
		echo "[$dir] generating PKCS12 keystore..."
		if [ -d "$P12" ]; then
			echo "[$dir] warning: $P12 is a directory; removing it to regenerate keystore file"
			rmdir "$P12"
		fi
		openssl pkcs12 -export \
			-inkey "$KEY" \
			-in "$CRT" \
			-certfile certs/ca/ca.crt \
			-name "$dir" \
			-out "$P12" \
			-passout pass:$P12_PASS
		chmod 644 "$P12"
	fi

	if [[ $NEEDS_P12 -eq 1 ]]; then
		echo "[$dir] OK: key/csr/crt/p12 present"
	else
		echo "[$dir] OK: key/csr/crt present (no keystore for ${dir})"
	fi
	echo "-----------------------------------"
done

echo "[truststore] generating shared truststore..."

if [ -d "certs/runtime/truststore/shared-truststore.p12" ]; then
	echo "[truststore] warning: shared-truststore.p12 is a directory; removing it"
	rmdir "certs/runtime/truststore/shared-truststore.p12"
fi

keytool -importcert -noprompt \
	-alias internal-svc-ca \
	-file certs/ca/ca.crt \
	-keystore certs/runtime/truststore/shared-truststore.p12 \
	-storetype PKCS12 \
	-storepass $TRUSTSTORE_PASS

echo "[truststore] created."
echo "-----------------------------------"

echo "[auth] generating JWT keys..."
openssl genrsa -out "$AUTH_PRIVATE_KEY" 2048
openssl rsa -in "$AUTH_PRIVATE_KEY" -pubout -out "$AUTH_PUBLIC_KEY"
chmod 600 "$AUTH_PRIVATE_KEY"
chmod 644 "$AUTH_PUBLIC_KEY"

if [ ! -f "$AUTH_PUBLIC_KEY" ]; then
	echo "Error: auth public key not found at $AUTH_PUBLIC_KEY"
	exit 1
fi

mkdir -p "$(dirname "$GATEWAY_PUBLIC_KEY")"

if [ -d "$AUTH_PRIVATE_KEY" ] || [ -d "$AUTH_PUBLIC_KEY" ]; then
	echo "Error: JWT key path points to a directory under $AUTH_KEY_DIR"
	exit 1
fi

cp "$AUTH_PUBLIC_KEY" "$GATEWAY_PUBLIC_KEY"

AUTH_PUB_SHA="$(sha256sum "$AUTH_PUBLIC_KEY" | awk '{print $1}')"
GW_PUB_SHA="$(sha256sum "$GATEWAY_PUBLIC_KEY" | awk '{print $1}')"

if [ "$AUTH_PUB_SHA" != "$GW_PUB_SHA" ]; then
	echo "Error: gateway public key does not match auth public key after copy"
	exit 1
fi

echo "[auth] public key synced to gateway and verified"
write_grafana_prod_datasource
