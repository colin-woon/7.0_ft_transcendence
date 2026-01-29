FROM redis:7.4.7-alpine

LABEL service="gateway-redis"
LABEL usage="Redis instance for API Gateway rate limiting"
LABEL role="rate limiting"

CMD ["redis-server", \
     "--save", "", \
     "--appendonly", "no", \
     "--maxmemory-policy", "noeviction", \
     "--tcp-keepalive", "60", \
     "--timeout", "0"]
