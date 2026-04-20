#!/usr/bin/env bash
set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"

if [[ -z "${CF_API_TOKEN:-}" ]]; then
  echo "CF_API_TOKEN is required" >&2
  exit 1
fi

if [[ -z "${ZONE_NAME:-}" ]]; then
  echo "ZONE_NAME is required" >&2
  exit 1
fi

if [[ -z "${HOSTNAME:-}" ]]; then
  echo "HOSTNAME is required" >&2
  exit 1
fi

RECORD_TYPE="${RECORD_TYPE:-A}"
RECORD_CONTENT="${RECORD_CONTENT:-192.0.2.1}"
PROXIED="${PROXIED:-true}"

api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [[ -n "$data" ]]; then
    curl -fsS -X "$method" "${CF_API}${path}" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$data"
  else
    curl -fsS -X "$method" "${CF_API}${path}" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json"
  fi
}

zone_response="$(api GET "/zones?name=${ZONE_NAME}")"
zone_id="$(printf '%s' "$zone_response" | jq -r '.result[0].id // empty')"

if [[ -z "$zone_id" ]]; then
  echo "Zone ${ZONE_NAME} not found" >&2
  exit 1
fi

record_response="$(api GET "/zones/${zone_id}/dns_records?name=${HOSTNAME}")"
record_id="$(printf '%s' "$record_response" | jq -r '.result[0].id // empty')"

payload="$(jq -cn \
  --arg type "$RECORD_TYPE" \
  --arg name "$HOSTNAME" \
  --arg content "$RECORD_CONTENT" \
  --argjson proxied "$PROXIED" \
  '{type:$type,name:$name,content:$content,ttl:1,proxied:$proxied}')"

if [[ -n "$record_id" ]]; then
  result="$(api PUT "/zones/${zone_id}/dns_records/${record_id}" "$payload")"
  action="updated"
else
  result="$(api POST "/zones/${zone_id}/dns_records" "$payload")"
  action="created"
fi

printf '%s\n' "$result" | jq -e '.success == true' >/dev/null
printf 'DNS record %s: %s -> %s (%s, proxied=%s)\n' "$action" "$HOSTNAME" "$RECORD_CONTENT" "$RECORD_TYPE" "$PROXIED"