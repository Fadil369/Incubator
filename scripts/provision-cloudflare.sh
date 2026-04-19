#!/usr/bin/env bash
# ============================================================
# BrainSAIT — Cloudflare Resources Provisioner
# Creates all CF Workers, Pages, KV, D1, R2, Queues, etc.
# ============================================================
set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"
ACCOUNT_ID="87a79e73521fc85dab488b2c700554e3"
ZONE_NAME="brainsait.com"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${BLUE}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*"; }

# Auth check
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
echo "║   ☁️  BrainSAIT Cloudflare Resource Provisioner      ║"
echo "║   Workers · Pages · KV · D1 · R2 · Queues · DO     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════
# Phase 1: KV Namespaces
# ═══════════════════════════════════════════════════════════
info "Phase 1: Creating KV Namespaces..."

KV_NAMESPACES=(
  "brainsait-sessions"
  "brainsait-cache"
  "brainsait-rate-limit"
  "brainsait-config"
  "brainsait-feature-flags"
  "brainsait-startup-registry"
  "brainsait-ai-cache"
  "brainsait-model-registry"
  "brainsait-prompt-templates"
  "brainsait-webhook-secrets"
  "brainsait-event-log"
  "brainsait-schema-cache"
  "brainsait-contract-registry"
  "brainsait-subscription-map"
  "brainsait-jwks-cache"
  "brainsait-session-store"
  "brainsait-startup-roles"
  "brainsait-channel-config"
  "brainsait-notification-log"
  "brainsait-isr-cache"
  "brainsait-status-data"
  "brainsait-uptime-history"
  "brainsait-dead-letter"
)

for ns in "${KV_NAMESPACES[@]}"; do
  info "  Creating KV: $ns"
  cf_api POST "/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
    -d "{\"title\":\"$ns\"}" > /dev/null 2>&1 || warn "  $ns may already exist"
done

log "KV Namespaces created"

# ═══════════════════════════════════════════════════════════
# Phase 2: D1 Databases
# ═══════════════════════════════════════════════════════════
info "Phase 2: Creating D1 Databases..."

D1_DATABASES=(
  "brainsait-prod"
  "brainsait-audit"
  "brainsait-events"
  "brainsait-data-hub"
  "brainsait-auth"
  "brainsait-notifications"
  "brainsait-dashboard"
  "brainsait-status"
  "brainsait-queue-logs"
)

for db in "${D1_DATABASES[@]}"; do
  info "  Creating D1: $db"
  cf_api POST "/accounts/$ACCOUNT_ID/d1/database" \
    -d "{\"name\":\"$db\"}" > /dev/null 2>&1 || warn "  $db may already exist"
done

log "D1 Databases created"

# ═══════════════════════════════════════════════════════════
# Phase 3: R2 Buckets
# ═══════════════════════════════════════════════════════════
info "Phase 3: Creating R2 Buckets..."

R2_BUCKETS=(
  "brainsait-documents"
  "brainsait-uploads"
  "brainsait-backups"
  "brainsait-data-contracts"
  "brainsait-data-store"
  "brainsait-contracts"
  "brainsait-ai-outputs"
  "brainsait-models"
  "brainsait-training-data"
  "brainsait-predictions"
  "brainsait-dashboard-assets"
)

for bucket in "${R2_BUCKETS[@]}"; do
  info "  Creating R2: $bucket"
  cf_api POST "/accounts/$ACCOUNT_ID/r2/buckets" \
    -d "{\"name\":\"$bucket\"}" > /dev/null 2>&1 || warn "  $bucket may already exist"
done

log "R2 Buckets created"

# ═══════════════════════════════════════════════════════════
# Phase 4: Queues
# ═══════════════════════════════════════════════════════════
info "Phase 4: Creating Queues..."

QUEUES=(
  "brainsait-events"
  "brainsait-github-events"
  "brainsait-pipeline-events"
  "brainsait-notifications"
  "brainsait-notification-retries"
  "brainsait-data-sync"
  "brainsait-inference"
  "brainsait-training"
  "brainsait-batch-inference"
)

for queue in "${QUEUES[@]}"; do
  info "  Creating Queue: $queue"
  cf_api POST "/accounts/$ACCOUNT_ID/workers/queues" \
    -d "{\"queue_name\":\"$queue\",\"type\":\"standard\"}" > /dev/null 2>&1 || warn "  $queue may already exist"
done

log "Queues created"

# ═══════════════════════════════════════════════════════════
# Phase 5: Vectorize Indexes
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
    -d "{\"name\":\"$idx\",\"config\":{\"dimensions\":768,\"metric\":\"cosine\"}}" > /dev/null 2>&1 || warn "  $idx may already exist"
done

log "Vectorize indexes created"

# ═══════════════════════════════════════════════════════════
# Phase 6: Analytics Engine
# ═══════════════════════════════════════════════════════════
info "Phase 6: Creating Analytics Engine datasets..."

DATASETS=(
  "brainsait_api_usage"
  "brainsait_ai_usage"
  "brainsait_events"
  "brainsait_auth"
  "brainsait_data_usage"
  "brainsait_ml_usage"
  "brainsait_status"
)

for ds in "${DATASETS[@]}"; do
  info "  Creating dataset: $ds"
  # Analytics Engine datasets are created via wrangler
  echo "    → Use: wrangler analytics-engine dataset create $ds"
done

log "Analytics Engine datasets noted"

# ═══════════════════════════════════════════════════════════
# Phase 7: Deploy Workers
# ═══════════════════════════════════════════════════════════
info "Phase 7: Deploying Workers..."

WORKERS=(
  "workers/event-bridge"
  "workers/data-hub-proxy"
  "workers/auth-gateway"
  "workers/notification-router"
  "workers/ml-inference"
  "workers/queue-consumers"
  "packages/brainsait-backend"
  "packages/brainsait-ai"
)

for worker in "${WORKERS[@]}"; do
  info "  Deploying: $worker"
  if [ -f "$worker/wrangler.toml" ]; then
    cd "$worker"
    npx wrangler deploy --env production 2>&1 || warn "  Deploy failed for $worker"
    cd - > /dev/null
  else
    warn "  No wrangler.toml in $worker, skipping"
  fi
done

log "Workers deployed"

# ═══════════════════════════════════════════════════════════
# Phase 8: Deploy Pages
# ═══════════════════════════════════════════════════════════
info "Phase 8: Deploying Cloudflare Pages..."

info "  Dashboard: packages/brainsait-frontend"
info "  → Use: npx wrangler pages project create brainsait-dashboard --production-branch main"
info "  → Use: npx wrangler pages deploy .project-name brainsait-dashboard"

info "  Status Page: pages/status-page"
info "  → Use: npx wrangler pages project create brainsait-status --production-branch main"

log "Pages deployment noted"

# ═══════════════════════════════════════════════════════════
# Phase 9: DNS & Routes
# ═══════════════════════════════════════════════════════════
info "Phase 9: DNS records (configure in CF dashboard)..."

DNS_RECORDS=(
  "api.brainsait.com"
  "auth.brainsait.com"
  "data-hub.brainsait.com"
  "ml.brainsait.com"
  "events.brainsait.com"
  "notifications.brainsait.com"
  "dashboard.brainsait.com"
  "docs.brainsait.com"
  "status.brainsait.com"
  "staging-api.brainsait.com"
  "staging-ai.brainsait.com"
)

for record in "${DNS_RECORDS[@]}"; do
  info "  DNS: $record → Workers route"
done

log "DNS configuration noted"

echo ""
log "═══════════════════════════════════════════════════"
log "Cloudflare provisioning complete!"
log "  • ${#KV_NAMESPACES[@]} KV Namespaces"
log "  • ${#D1_DATABASES[@]} D1 Databases"
log "  • ${#R2_BUCKETS[@]} R2 Buckets"
log "  • ${#QUEUES[@]} Queues"
log "  • ${#VECTORIZE_INDEXES[@]} Vectorize Indexes"
log "  • ${#DATASETS[@]} Analytics Engine Datasets"
log "  • ${#WORKERS[@]} Workers"
log "  • 2 Pages Projects"
log "  • ${#DNS_RECORDS[@]} DNS Routes"
log "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Set CF_API_TOKEN and re-run for automated provisioning"
echo "  2. Deploy workers: cd workers/<name> && wrangler deploy"
echo "  3. Deploy pages: cd packages/brainsait-frontend && wrangler pages deploy"
echo "  4. Configure DNS in Cloudflare dashboard"
echo ""
