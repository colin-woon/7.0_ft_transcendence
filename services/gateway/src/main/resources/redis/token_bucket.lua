-- Redis 7 Token Bucket (Gateway Rate Limiter)
-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = refill_rate_per_sec
-- ARGV[3] = cost
-- ARGV[4] = now_ms (0 = use Redis time)

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local now_ms = tonumber(ARGV[4])

if capacity <= 0 or refill_rate <= 0 or cost <= 0 then
	return { 0, 0, "invalid-args" }
end

-- Use Redis server time if not provided
if now_ms == nil or now_ms == 0 then
	local t = redis.call("TIME")
	now_ms = (tonumber(t[1]) * 1000) + math.floor(tonumber(t[2]) / 1000)
end

-- Load state
local data = redis.call("HMGET", key, "tokens", "ts")
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if tokens == nil then
	tokens = capacity
end
if ts == nil then
	ts = now_ms
end

-- Refill
local elapsed_ms = now_ms - ts
if elapsed_ms < 0 then
	elapsed_ms = 0
end

local refill = (elapsed_ms / 1000.0) * refill_rate
tokens = math.min(capacity, tokens + refill)

-- Consume
local allowed = 0
if tokens >= cost then
	allowed = 1
	tokens = tokens - cost
end

-- Persist
redis.call("HMSET", key, "tokens", tokens, "ts", now_ms)

-- TTL (enough time to refill from empty)
local refill_time_sec = capacity / refill_rate
local ttl_ms = math.floor((refill_time_sec * 2.0) * 1000)
if ttl_ms < 1000 then
	ttl_ms = 1000
end
redis.call("PEXPIRE", key, ttl_ms)

return { allowed, tokens, ttl_ms }
