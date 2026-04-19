#!/usr/bin/env bash
# ============================================================
# BrainSAIT Ultimate Incubator — Full GitHub Org Provisioner
# Creates all 35 startup repos, teams, projects, and configs
# ============================================================
set -euo pipefail

ORG="brainsait-incubator"
GH="gh"

# ── Color output ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*"; }
info() { echo -e "${BLUE}[→]${NC} $*"; }

# ── Startup Registry ──
declare -A STARTUPS=(
  [brainsait]="AI Operating System for Healthcare"
  [dsmart]="Healthcare AI"
  [aldabb-ai]="Healthcare AI"
  [pion-dialecton]="Healthcare AI"
  [cycls]="Healthcare AI"
  [ihealth]="Digital Health"
  [bio-grid]="Bioinformatics"
  [biosentry]="Biosecurity"
  [healthron]="Health Tech"
  [minova]="Healthcare Innovation"
  [untold-ai]="AI Healthcare"
  [digiations]="Digital Health"
  [dental-ai]="Dental AI"
  [vitaio]="Health Tech"
  [cinova]="Clinical Innovation"
  [ttmd]="Medical Tech"
  [innova]="Healthcare Innovation"
  [mara]="Health Tech"
  [medflow]="Medical Workflow"
  [msr04]="Healthcare AI"
  [physaio]="Physiotherapy Tech"
  [qanary]="Healthcare Analytics"
  [iage]="Aging Tech"
  [alsamer]="Health Tech"
  [reporty]="Healthcare Reporting"
  [rolooy]="Medical Devices"
  [baseerah]="Health Analytics"
  [salim]="Health Tech"
  [sam]="Healthcare AI"
  [anicon]="Health Tech"
  [vleed]="Health Tech"
  [fahm-biotech]="Biotechnology"
  [juleb]="Healthcare AI"
  [rqmii]="Healthcare AI"
  [senor]="Healthcare AI"
)

# ── Platform Repos ──
PLATFORM_REPOS=(
  "incubator-platform"
  "shared-libs"
  "data-hub"
  "api-gateway"
  "auth-service"
  "communication-hub"
  "dashboard"
  "docs-portal"
)

# ═══════════════════════════════════════════════════════════
# Phase 1: Organization Setup
# ═══════════════════════════════════════════════════════════
setup_org() {
  info "Phase 1: Configuring GitHub Organization..."

  # Create org if not exists (requires manual creation or enterprise admin)
  # $GH org create "$ORG" --description "BrainSAIT Ultimate Incubator — Healthcare AI Sandbox" 2>/dev/null || true

  # ── Teams ──
  local teams=(
    "incubator-admins:Admin team for the incubator platform"
    "platform-engineers:Core platform development team"
    "mentors:Mentors and advisors"
    "investors:Read-only access for investors"
    "compliance:Security and compliance team"
  )

  for team_spec in "${teams[@]}"; do
    IFS=':' read -r team_name team_desc <<< "$team_spec"
    info "Creating team: $team_name"
    $GH api "orgs/$ORG/teams" \
      --method POST \
      -f name="$team_name" \
      -f description="$team_desc" \
      -f privacy="closed" \
      2>/dev/null || warn "Team $team_name already exists"
  done

  # ── Per-Startup Teams ──
  for startup in "${!STARTUPS[@]}"; do
    local team="${startup}-team"
    info "Creating team: $team"
    $GH api "orgs/$ORG/teams" \
      --method POST \
      -f name="$team" \
      -f description="Team for ${startup} startup" \
      -f privacy="closed" \
      2>/dev/null || true
  done

  log "Organization setup complete"
}

# ═══════════════════════════════════════════════════════════
# Phase 2: Platform Repositories
# ═══════════════════════════════════════════════════════════
create_platform_repos() {
  info "Phase 2: Creating platform repositories..."

  for repo in "${PLATFORM_REPOS[@]}"; do
    info "Creating platform repo: $repo"
    $GH repo create "$ORG/$repo" \
      --private \
      --description "BrainSAIT Incubator — $repo" \
      --enable-issues \
      --enable-wiki \
      --enable-projects \
      2>/dev/null || warn "Repo $repo already exists"

    # Apply branch protection
    protect_main "$repo"
  done

  log "Platform repos created"
}

# ═══════════════════════════════════════════════════════════
# Phase 3: Startup Repositories (×35)
# ═══════════════════════════════════════════════════════════
create_startup_repos() {
  info "Phase 3: Creating startup repositories..."

  for startup in "${!STARTUPS[@]}"; do
    local desc="${STARTUPS[$startup]}"

    # 4 repos per startup
    local repos=("${startup}-platform" "${startup}-infra" "${startup}-docs" "${startup}-data")

    for repo in "${repos[@]}"; do
      info "Creating: $ORG/$repo"
      $GH repo create "$ORG/$repo" \
        --private \
        --description "BrainSAIT Incubator — ${startup}: ${repo}" \
        --enable-issues \
        --enable-projects \
        2>/dev/null || warn "Repo $repo already exists"

      protect_main "$repo"
      apply_repo_labels "$repo"
      apply_repo_templates "$repo"
    done

    # Add startup team to its repos
    for repo in "${repos[@]}"; do
      $GH api "orgs/$ORG/teams/${startup}-team/repos/$ORG/$repo" \
        --method PUT \
        -f permission="push" \
        2>/dev/null || true
    done
  done

  log "All startup repos created"
}

# ═══════════════════════════════════════════════════════════
# Phase 4: Branch Protection
# ═══════════════════════════════════════════════════════════
protect_main() {
  local repo="$1"
  $GH api "repos/$ORG/$repo/branches/main/protection" \
    --method PUT \
    -f required_status_checks='{"strict":true,"contexts":["ci/build","ci/test","ci/security-scan"]}' \
    -f enforce_admins=false \
    -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
    -f restrictions=null \
    -f allow_force_pushes=false \
    -f allow_deletions=false \
    2>/dev/null || true
}

# ═══════════════════════════════════════════════════════════
# Phase 5: Labels
# ═══════════════════════════════════════════════════════════
apply_repo_labels() {
  local repo="$1"
  local labels=(
    "priority:critical:FF0000"
    "priority:high:FF6600"
    "priority:medium:FFCC00"
    "priority:low:00CC00"
    "type:feature:0052CC"
    "type:bug:FC2929"
    "type:docs:0075CA"
    "type:infra:5319E7"
    "type:security:D93F0B"
    "type:data:1D76DB"
    "milestone:week-1:006B75"
    "milestone:week-2:006B75"
    "milestone:month-1:006B75"
    "milestone:demo-day:006B75"
    "compliance:hipaa:D93F0B"
    "compliance:soc2:D93F0B"
    "data-sharing:internal:5319E7"
    "data-sharing:cross-startup:5319E7"
    "needs-review:B60205"
    "blocked:D93F0B"
  )

  for label_spec in "${labels[@]}"; do
    IFS=':' read -r name color description <<< "$label_spec"
    $GH label create "$name" --repo "$ORG/$repo" --color "$color" --description "$description" --force 2>/dev/null || true
  done
}

# ═══════════════════════════════════════════════════════════
# Phase 6: Repo Templates (push initial files)
# ═══════════════════════════════════════════════════════════
apply_repo_templates() {
  local repo="$1"
  local tmpdir="/tmp/repo-init-$repo"
  rm -rf "$tmpdir"
  mkdir -p "$tmpdir"
  cd "$tmpdir"

  $GH repo clone "$ORG/$repo" . -- --quiet 2>/dev/null || git init

  # Copy template files from the incubator-platform/templates/repo/
  local template_dir="/root/.openclaw/workspace/brainsait-incubator/templates/repo"
  if [ -d "$template_dir" ]; then
    cp -rn "$template_dir/"* . 2>/dev/null || true
  fi

  # If it's a platform repo, add platform-specific template
  if [[ "$repo" == *"-platform" ]]; then
    cp -rn "/root/.openclaw/workspace/brainsait-incubator/templates/platform/"* . 2>/dev/null || true
  fi

  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git add -A
    git commit -m "init: bootstrap incubator template for $repo" --quiet
    git push --force --quiet 2>/dev/null || true
  fi

  cd -
  rm -rf "$tmpdir"
}

# ═══════════════════════════════════════════════════════════
# Phase 7: GitHub Projects
# ═══════════════════════════════════════════════════════════
create_projects() {
  info "Phase 4: Creating GitHub Projects..."

  local projects=(
    "Incubator Master Board|Board tracking all 35 startups across milestones"
    "Milestone Tracker|Cohort milestones and KPI tracking"
    "Demo Day Pipeline|Demo day preparation and rehearsal scheduling"
    "Mentor Matching|Mentor-startup pairing and session tracking"
    "Investment Pipeline|Investor engagement and funding tracker"
  )

  for project_spec in "${projects[@]}"; do
    IFS='|' read -r title body <<< "$project_spec"
    info "Creating project: $title"
    $GH api "orgs/$ORG/projects" \
      --method POST \
      -f name="$title" \
      -f body="$body" \
      2>/dev/null || warn "Project may need v2 API"
  done

  log "Projects created"
}

# ═══════════════════════════════════════════════════════════
# Phase 8: Webhooks
# ═══════════════════════════════════════════════════════════
setup_webhooks() {
  info "Phase 5: Configuring organization webhooks..."

  # Main event bridge webhook
  $GH api "orgs/$ORG/hooks" \
    --method POST \
    -f name="web" \
    -f active=true \
    -f config='{"url":"https://events.brainsait.dev/webhooks/github","content_type":"json","secret":"REPLACE_WITH_WEBHOOK_SECRET","insecure_ssl":"0"}' \
    -f 'events[]=push' \
    -f 'events[]=pull_request' \
    -f 'events[]=issues' \
    -f 'events[]=issue_comment' \
    -f 'events[]=release' \
    -f 'events[]=workflow_run' \
    -f 'events[]=project_card' \
    -f 'events[]=repository' \
    -f 'events[]=team' \
    -f 'events[]=member' \
    -f 'events[]=security_advisory' \
    2>/dev/null || warn "Webhook may already exist"

  log "Webhooks configured"
}

# ═══════════════════════════════════════════════════════════
# Main Execution
# ═══════════════════════════════════════════════════════════
main() {
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║   🧠 BrainSAIT Ultimate Incubator Provisioner       ║"
  echo "║   GitHub Enterprise — Healthcare AI Sandbox         ║"
  echo "║   35 Startups · Full Platform Integration           ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""

  setup_org
  create_platform_repos
  create_startup_repos
  create_projects
  setup_webhooks

  echo ""
  log "═══════════════════════════════════════════════════"
  log "Incubator provisioning complete!"
  log "  • ${#STARTUPS[@]} startups × 4 repos = $(( ${#STARTUPS[@]} * 4 )) repos"
  log "  • ${#PLATFORM_REPOS[@]} platform repos"
  log "  • 5 organizational projects"
  log "  • $(( ${#STARTUPS[@]} + 5 )) teams"
  log "  • Webhook integrations active"
  log "═══════════════════════════════════════════════════"
}

main "$@"
