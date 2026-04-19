# 🚀 BrainSAIT Incubator — Startup Onboarding Guide

Welcome to the BrainSAIT Ultimate Incubator! This guide will walk you through setting up your development environment and integrating with all incubator resources.

## 📋 Prerequisites

- GitHub account with access to `brainsait-incubator` organization
- `gh` CLI installed ([install guide](https://cli.github.com/))
- Docker & Docker Compose
- Node.js 20+ or Python 3.12+ (depending on your stack)
- `kubectl` for Kubernetes deployments

## 🔑 Step 1: Access Setup

### GitHub Organization Access

```bash
# Accept your org invitation (check email)
# Then verify access:
gh auth login --hostname github.com
gh api user/orgs --jq '.[].login' | grep brainsait

# Clone your repos:
gh repo clone brainsait-incubator/[your-startup]-platform
gh repo clone brainsait-incubator/[your-startup]-infra
gh repo clone brainsait-incubator/[your-startup]-docs
gh repo clone brainsait-incubator/[your-startup]-data
```

### Authentication

```bash
# Get your Keycloak credentials from incubator admin
# Then configure:
export KEYCLOAK_URL=https://auth.brainsait.dev
export KEYCLOAK_REALM=brainsait
export KEYCLOAK_CLIENT_ID=[your-startup]
export KEYCLOAK_CLIENT_SECRET=[from-admin]

# Verify auth:
curl -s https://auth.brainsait.dev/realms/brainsait/.well-known/openid-configuration | jq .issuer
```

## 🏗️ Step 2: Local Development

```bash
cd [your-startup]-platform

# Option A: Full incubator stack (all services)
cd ../../  # Go to incubator-platform root
docker compose up -d

# Option B: Just your service
npm install  # or pip install -e ".[dev]"
npm run dev
```

### Verify connectivity:

```bash
# API Gateway
curl http://localhost:8000/health

# Auth Service
curl http://localhost:8080/realms/brainsait/.well-known/openid-configuration

# Data Hub
curl http://localhost:8081/healthz

# Communication Hub
curl http://localhost:4000/health
```

## 📊 Step 3: Data Hub Integration

### Define your data contracts

Create `.contract.json` files in `data-contracts/`:

```json
{
  "name": "patient-diagnostics",
  "version": "1.0.0",
  "description": "Anonymized diagnostic data for cross-startup analytics",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "age_range": { "type": "string", "enum": ["18-25", "26-35", "36-55", "56+"] },
    "category": { "type": "string" },
    "severity": { "type": "integer", "minimum": 1, "maximum": 5 }
  },
  "required": ["id", "age_range", "category"],
  "hipaa_compliant": true,
  "pii_fields": [],
  "sharing_policy": "anonymized-only"
}
```

### Sync schemas

```bash
# Manual sync
npm run data:sync

# Or it happens automatically on push to main
git add data-contracts/
git commit -m "feat: add diagnostic data contract"
git push
```

### Subscribe to other startups' data

```bash
# Via API
curl -X POST https://data-hub.brainsait.dev/api/v1/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "bio-grid", "contract": "genomics-anonymous"}'
```

## 💬 Step 4: Communication Integration

### Configure notifications

```bash
curl -X PUT https://comm-hub.brainsait.dev/api/v1/channels/[your-startup] \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channels": [
      {
        "type": "slack",
        "target": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
        "filters": ["pipeline_complete", "data_updated", "milestone_reached"],
        "enabled": true
      },
      {
        "type": "discord",
        "target": "https://discord.com/api/webhooks/YOUR/WEBHOOK",
        "filters": ["pipeline_complete"],
        "enabled": true
      },
      {
        "type": "websocket",
        "target": "wss://comm-hub.brainsait.dev/ws",
        "filters": ["*"],
        "enabled": true
      }
    ]
  }'
```

### Subscribe to events (WebSocket)

```javascript
const ws = new WebSocket('wss://comm-hub.brainsait.dev/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.source);
};
```

## 🔄 Step 5: CI/CD Pipeline

Your repos already have the shared CI/CD pipeline. Key secrets to configure:

```bash
# In your repo settings > Secrets and variables > Actions:
gh secret set DATA_HUB_TOKEN --repo brainsait-incubator/[your-startup]-platform
gh secret set COMM_HUB_TOKEN --repo brainsait-incubator/[your-startup]-platform
gh secret set SLACK_WEBHOOK --repo brainsait-incubator/[your-startup]-platform
gh secret set KUBE_CONFIG --repo brainsait-incubator/[your-startup]-platform
```

### Pipeline stages:
1. **Build & Test** — Auto-detects Node/Python, runs lint + test
2. **Security Scan** — Trivy, CodeQL, Gitleaks, HIPAA compliance
3. **Data Sync** — Syncs schemas to Data Hub
4. **Deploy** — K8s deployment to staging/production

## 📊 Step 6: GitHub Projects Integration

Your startup has a dedicated project board. Issues and PRs are automatically tracked in:

- **Your board**: `https://github.com/orgs/brainsait-incubator/projects/[number]`
- **Master board**: Cross-startup tracking
- **Milestone tracker**: KPI and milestone tracking

### Labels to use:
- `priority:critical/high/medium/low`
- `type:feature/bug/docs/infra/security/data`
- `milestone:week-1/week-2/month-1/demo-day`
- `compliance:hipaa/soc2`
- `data-sharing:internal/cross-startup`

## 🔐 Step 7: Security & Compliance

### Branch Protection
- All repos require 1 approval review
- Status checks must pass (build, test, security-scan)
- No force pushes, no deletions

### HIPAA Checklist
- [ ] No PHI in logs (our logger auto-redacts)
- [ ] Data contracts declare PII fields
- [ ] Encryption at rest and in transit
- [ ] Access control via Keycloak RBAC
- [ ] Audit logging enabled

## 📚 Resources

| Resource | URL |
|----------|-----|
| API Gateway | https://api.brainsait.dev |
| Auth (Keycloak) | https://auth.brainsait.dev |
| Data Hub (Hasura) | https://data-hub.brainsait.dev |
| Dashboard | https://dashboard.brainsait.dev |
| Documentation | https://docs.brainsait.dev |
| Communication Hub | https://comm-hub.brainsait.dev |
| Status Page | https://status.brainsait.dev |

## 🆘 Support

- **Slack**: `#incubator-support`
- **GitHub Issues**: `brainsait-incubator/incubator-platform/issues`
- **Office Hours**: Thursdays 2-4 PM (Riyadh time)
- **Emergency**: Tag `@incubator-admins` in any issue
