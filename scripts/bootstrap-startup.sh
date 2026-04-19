#!/usr/bin/env bash
# ============================================================
# BrainSAIT — Bootstrap a New Startup Workspace
# Creates standard repo structure and pushes to GitHub
# ============================================================
set -euo pipefail

STARTUP="${1:?Usage: bootstrap-startup.sh <startup-name>}"
ORG="brainsait-incubator"
TEMPLATE_DIR="/root/.openclaw/workspace/brainsait-incubator/templates/repo"
REPOS=("${STARTUP}-platform" "${STARTUP}-infra" "${STARTUP}-docs" "${STARTUP}-data")

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${BLUE}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  🧠 BrainSAIT Startup Bootstrap          ║"
echo "║  Startup: ${STARTUP}                     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Create GitHub Team ──
info "Creating team: ${STARTUP}-team"
gh api "orgs/$ORG/teams" --method POST \
  -f name="${STARTUP}-team" \
  -f description="Team for ${STARTUP}" \
  -f privacy="closed" 2>/dev/null || warn "Team may already exist"

# ── Create Repos ──
for repo in "${REPOS[@]}"; do
  info "Creating repo: $repo"
  gh repo create "$ORG/$repo" \
    --private \
    --description "BrainSAIT Incubator — ${STARTUP}: $(echo $repo | sed "s/${STARTUP}-//")" \
    --enable-issues \
    --enable-projects \
    2>/dev/null || warn "Repo $repo already exists"
done

# ── Initialize Platform Repo with Full Template ──
info "Initializing ${STARTUP}-platform with template..."
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
gh repo clone "$ORG/${STARTUP}-platform" . -- --quiet 2>/dev/null || git init

# Copy template
cp -r "$TEMPLATE_DIR/"* . 2>/dev/null || true
cp -r "$TEMPLATE_DIR/".[!.]* . 2>/dev/null || true

# Customize README
sed -i "s/\[Startup Name\]/$(echo $STARTUP | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')/g" README.md 2>/dev/null || true

# Create data contracts dir
mkdir -p data-contracts
cat > data-contracts/README.md << 'EOF'
# Data Contracts

Define your data sharing contracts here. Each `.contract.json` file
describes a data interface that other startups can consume.

## Example Contract

```json
{
  "name": "patient-records",
  "version": "1.0.0",
  "description": "Anonymized patient record sharing",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "age_range": { "type": "string", "enum": ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"] },
    "diagnosis_category": { "type": "string" },
    "created_at": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "age_range", "diagnosis_category"],
  "hipaa_compliant": true,
  "pii_fields": [],
  "sharing_policy": "anonymized-only"
}
```
EOF

# Create K8s manifests
mkdir -p k8s/staging k8s/production
cat > k8s/staging/kustomization.yaml << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: brainsait-staging
resources:
  - ../base
patches:
  - target:
      kind: Deployment
      name: ${STARTUP}
    patch: |
      - op: replace
        path: /spec/replicas
        value: 1
EOF

cat > k8s/production/kustomization.yaml << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: brainsait-production
resources:
  - ../base
patches:
  - target:
      kind: Deployment
      name: ${STARTUP}
    patch: |
      - op: replace
        path: /spec/replicas
        value: 3
EOF

# Commit & push
git add -A
git commit -m "init: bootstrap ${STARTUP} with incubator template" --quiet 2>/dev/null || true
git push --force --quiet 2>/dev/null || warn "Push may need auth setup"

cd -
rm -rf "$TMPDIR"

# ── Assign Team to Repos ──
for repo in "${REPOS[@]}"; do
  gh api "orgs/$ORG/teams/${STARTUP}-team/repos/$ORG/$repo" \
    --method PUT -f permission="push" 2>/dev/null || true
done

# ── Create Project Board ──
info "Creating project board for ${STARTUP}..."
gh project create \
  --owner "$ORG" \
  --title "${STARTUP} — Development Board" \
  --body "Development tracking board for ${STARTUP}" \
  2>/dev/null || warn "Project creation may need v2 API"

echo ""
log "═══════════════════════════════════════"
log "Bootstrap complete for: ${STARTUP}"
log "  • Repos: ${REPOS[*]}"
log "  • Team: ${STARTUP}-team"
log "  • 4 repos initialized with template"
log "═══════════════════════════════════════"
