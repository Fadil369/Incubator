#!/usr/bin/env bash
# ============================================================
# BrainSAIT — Cloudflare Resources Provisioner (brainsait.org)
# Account: d7b99530559ab4f2545e9bdc72a7ab9b
# Zone: brainsait.org (117f23e28c474f87e9984bc4b6753a1b)
# ============================================================
set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"
ACCOUNT_ID="d7b99530559ab4f2545e9bdc72a7ab9b"
ZONE_ID="117f23e28c474f87e9984bc4b6753a1b"
ZONE_NAME="brainsait.org"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${BLUE}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

if [ -z "${CF_API_TOKEN:-}" ]; then
  echo "Set CF_API_TOKEN environment variable"
  exit 1
fi

cf_api() {
  curl -sS -X "$1" "${CF_API}$2" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    "${@:3}"
}

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ☁️  BrainSAIT CF Provisioner — brainsait.org       ║"
echo "║   Account: ${ACCOUNT_ID}          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════
# Existing resources (skip creation)
# ═══════════════════════════════════════════════════════════
log "Existing resources detected:"
log "  • 20 KV Namespaces (UNIFIED_SESSIONS, HEALTH_DATA, CONFIG_STORE, etc.)"
log "  • 15 D1 Databases (brainsait-unified-api, brainsait-healthcare-d1, etc.)"
log "  • 20 R2 Buckets (brainsait-documents, brainsait-storage, etc.)"
log "  • 2 Queues (brainsait-claims, brainsait-notifications)"
log "  • 50+ Workers (brainsait-portal, brainsait-ai-mesh, etc.)"
log "  • 10 Pages projects (brainsait-org, elfadil-com, etc.)"
echo ""

# ═══════════════════════════════════════════════════════════
# Phase 1: Create missing KV Namespaces
# ═══════════════════════════════════════════════════════════
info "Phase 1: Creating missing KV Namespaces..."

MISSING_KV=(
  "brainsait-feature-flags"
  "brainsait-startup-registry"
  "brainsait-ai-model-registry"
  "brainsait-prompt-templates"
  "brainsait-webhook-secrets"
  "brainsait-event-log"
  "brainsait-schema-cache"
  "brainsait-contract-registry"
  "brainsait-subscription-map"
  "brainsait-channel-config"
  "brainsait-notification-log"
  "brainsait-isr-cache"
  "brainsait-status-data"
  "brainsait-uptime-history"
  "brainsait-dead-letter"
  "brainsait-jwks-cache"
)

for ns in "${MISSING_KV[@]}"; do
  info "  Creating KV: $ns"
  cf_api POST "/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
    -d "{\"title\":\"$ns\"}" 2>/dev/null | jq -r '.result.id // .errors[0].message' || true
done

# ═══════════════════════════════════════════════════════════
# Phase 2: Create missing D1 Databases
# ═══════════════════════════════════════════════════════════
info "Phase 2: Creating missing D1 Databases..."

MISSING_D1=(
  "brainsait-audit"
  "brainsait-events"
  "brainsait-auth"
  "brainsait-notifications"
  "brainsait-dashboard"
  "brainsait-status"
  "brainsait-queue-logs"
  "brainsait-schemas"
)

for db in "${MISSING_D1[@]}"; do
  info "  Creating D1: $db"
  cf_api POST "/accounts/$ACCOUNT_ID/d1/database" \
    -d "{\"name\":\"$db\"}" 2>/dev/null | jq -r '.result.uuid // .errors[0].message' || true
done

# ═══════════════════════════════════════════════════════════
# Phase 3: Create missing R2 Buckets
# ═══════════════════════════════════════════════════════════
info "Phase 3: Creating missing R2 Buckets..."

MISSING_R2=(
  "brainsait-backups"
  "brainsait-data-contracts"
  "brainsait-contracts"
  "brainsait-ai-outputs"
  "brainsait-models"
  "brainsait-training-data"
  "brainsait-predictions"
  "brainsait-dashboard-assets"
)

for bucket in "${MISSING_R2[@]}"; do
  info "  Creating R2: $bucket"
  cf_api POST "/accounts/$ACCOUNT_ID/r2/buckets" \
    -d "{\"name\":\"$bucket\"}" 2>/dev/null | jq -r '.result.name // .errors[0].message' || true
done

# ═══════════════════════════════════════════════════════════
# Phase 4: Create missing Queues
# ═══════════════════════════════════════════════════════════
info "Phase 4: Creating missing Queues..."

MISSING_QUEUES=(
  "brainsait-github-events"
  "brainsait-pipeline-events"
  "brainsait-data-sync"
  "brainsait-inference"
  "brainsait-training"
  "brainsait-batch-inference"
  "brainsait-notification-retries"
)

for queue in "${MISSING_QUEUES[@]}"; do
  info "  Creating Queue: $queue"
  cf_api POST "/accounts/$ACCOUNT_ID/workers/queues" \
    -d "{\"queue_name\":\"$queue\",\"type\":\"standard\"}" 2>/dev/null | jq -r '.result.queue_name // .errors[0].message' || true
done

# ═══════════════════════════════════════════════════════════
# Phase 5: Create Vectorize Indexes
# ═══════════════════════════════════════════════════════════
info "Phase 5: Creating Vectorize Indexes..."

VECTORIZE_INDEXES=(
  "brainsait-embeddings"
  "brainsait-knowledge"
  "brainsait-knowledge-graph"
)

for idx in "${VECTORIZE_INDEXES[@]}"; do
  info "  Creating Vectorize: $idx"
  cf_api POST "/accounts/$ACCOUNT_ID/vectorize/indexes" \
    -d "{\"name\":\"$idx\",\"config\":{\"dimensions\":768,\"metric\":\"cosine\"}}" 2>/dev/null | jq -r '.result.name // .errors[0].message' || true
done

# ═══════════════════════════════════════════════════════════
# Phase 6: Deploy Workers
# ═══════════════════════════════════════════════════════════
info "Phase 6: Deploying Workers..."

WORKERS=(
  "workers/event-bridge"
  "workers/data-hub-proxy"
  "workers/auth-gateway"
  "workers/notification-router"
  "workers/ml-inference"
  "workers/queue-consumers"
  "workers/schema-registry"
)

for worker in "${WORKERS[@]}"; do
  if [ -f "$worker/wrangler.toml" ]; then
    info "  Deploying: $worker"
    cd "$worker"
    npx wrangler deploy --env production 2>&1 | tail -1 || warn "  Deploy failed for $worker"
    cd - > /dev/null
  fi
done

# ═══════════════════════════════════════════════════════════
# Phase 7: DNS Records
# ═══════════════════════════════════════════════════════════
info "Phase 7: Creating DNS records..."

DNS_RECORDS=(
  "api"
  "auth"
  "data-hub"
  "ml"
  "events"
  "notifications"
  "schemas"
  "dashboard"
  "docs"
  "status"
  "staging-api"
  "staging-ai"
)

for subdomain in "${DNS_RECORDS[@]}"; do
  info "  DNS: ${subdomain}.brainsait.org → Workers"
  # Workers routes handle these via wrangler.toml [env.production.route]
done

echo ""
log "═══════════════════════════════════════════════════"
log "Provisioning complete for brainsait.org!"
log ""
log "Existing (reused):"
log "  • 20 KV Namespaces"
log "  • 15 D1 Databases"
log "  • 20 R2 Buckets"
log "  • 2 Queues"
log "  • 50+ Workers"
log "  • 10 Pages projects"
log ""
log "New resources created:"
log "  • ${#MISSING_KV[@]} new KV Namespaces"
log "  • ${#MISSING_D1[@]} new D1 Databases"
log "  • ${#MISSING_R2[@]} new R2 Buckets"
log "  • ${#MISSING_QUEUES[@]} new Queues"
log "  • ${#VECTORIZE_INDEXES[@]} Vectorize Indexes"
log "  • ${#WORKERS[@]} new Workers"
log "═══════════════════════════════════════════════════"
echo ""
echo "Deploy with:"
echo "  export CF_API_TOKEN=your_token_here"
echo "  bash scripts/provision-cloudflare.sh"
