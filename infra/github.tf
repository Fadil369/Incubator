# ============================================================
# BrainSAIT Incubator — GitHub Enterprise Terraform Provider
# Manages all GitHub resources declaratively
# ============================================================
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket = "brainsait-terraform-state"
    key    = "incubator/github.tfstate"
    region = "us-east-1"
  }
}

provider "github" {
  owner = "brainsait-incubator"
  # token from GITHUB_TOKEN env var
}

# ── Variables ──
variable "startups" {
  description = "Map of startup names to their sector"
  type        = map(string)
  default = {
    "brainsait"        = "AI Operating System"
    "dsmart"           = "Healthcare AI"
    "aldabb-ai"        = "Healthcare AI"
    "pion-dialecton"   = "Healthcare AI"
    "cycls"            = "Healthcare AI"
    "ihealth"          = "Digital Health"
    "bio-grid"         = "Bioinformatics"
    "biosentry"        = "Biosecurity"
    "healthron"        = "Health Tech"
    "minova"           = "Healthcare Innovation"
    "untold-ai"        = "AI Healthcare"
    "digiations"       = "Digital Health"
    "dental-ai"        = "Dental AI"
    "vitaio"           = "Health Tech"
    "cinova"           = "Clinical Innovation"
    "ttmd"             = "Medical Tech"
    "innova"           = "Healthcare Innovation"
    "mara"             = "Health Tech"
    "medflow"          = "Medical Workflow"
    "msr04"            = "Healthcare AI"
    "physaio"          = "Physiotherapy Tech"
    "qanary"           = "Healthcare Analytics"
    "iage"             = "Aging Tech"
    "alsamer"          = "Health Tech"
    "reporty"          = "Healthcare Reporting"
    "rolooy"           = "Medical Devices"
    "baseerah"         = "Health Analytics"
    "salim"            = "Health Tech"
    "sam"              = "Healthcare AI"
    "anicon"           = "Health Tech"
    "vleed"            = "Health Tech"
    "fahm-biotech"     = "Biotechnology"
    "juleb"            = "Healthcare AI"
    "rqmii"            = "Healthcare AI"
    "senor"            = "Healthcare AI"
  }
}

variable "platform_repos" {
  description = "Platform-level repositories"
  type        = list(string)
  default = [
    "incubator-platform",
    "shared-libs",
    "data-hub",
    "api-gateway",
    "auth-service",
    "communication-hub",
    "dashboard",
    "docs-portal"
  ]
}

# ═══════════════════════════════════════════════════════════
# Platform Repositories
# ═══════════════════════════════════════════════════════════
resource "github_repository" "platform" {
  for_each = toset(var.platform_repos)

  name        = each.value
  description = "BrainSAIT Incubator — ${each.value}"
  visibility  = "private"
  auto_init   = true

  has_issues   = true
  has_wiki     = true
  has_projects = true

  vulnerability_alerts = true

  template {
    owner                = "brainsait-incubator"
    repository           = "incubator-platform"
    include_all_branches = false
  }
}

# ═══════════════════════════════════════════════════════════
# Startup Repositories (×35 startups × 4 repos)
# ═══════════════════════════════════════════════════════════
locals {
  startup_repos = flatten([
    for name, sector in var.startups : [
      for suffix in ["platform", "infra", "docs", "data"] : {
        full_name = "${name}-${suffix}"
        startup   = name
        sector    = sector
        type      = suffix
      }
    ]
  ])
}

resource "github_repository" "startup" {
  for_each = { for r in local.startup_repos : r.full_name => r }

  name        = each.value.full_name
  description = "BrainSAIT Incubator — ${each.value.startup} (${each.value.type})"
  visibility  = "private"
  auto_init   = true

  has_issues   = true
  has_projects = true
  vulnerability_alerts = true

  topics = [
    "brainsait",
    "incubator",
    each.value.startup,
    each.value.sector,
    each.value.type,
    "healthcare-ai"
  ]
}

# ═══════════════════════════════════════════════════════════
# Teams
# ═══════════════════════════════════════════════════════════
resource "github_team" "admin" {
  name        = "incubator-admins"
  description = "BrainSAIT Incubator admin team"
  privacy     = "closed"
}

resource "github_team" "platform" {
  name        = "platform-engineers"
  description = "Core platform development team"
  privacy     = "closed"
}

resource "github_team" "mentors" {
  name        = "mentors"
  description = "Mentors and advisors"
  privacy     = "closed"
}

resource "github_team" "investors" {
  name        = "investors"
  description = "Investor read-only access"
  privacy     = "closed"
}

resource "github_team" "compliance" {
  name        = "compliance"
  description = "Security and compliance team"
  privacy     = "closed"
}

resource "github_team" "startup" {
  for_each    = var.startups
  name        = "${each.key}-team"
  description = "Team for ${each.key} (${each.value})"
  privacy     = "closed"
}

# ═══════════════════════════════════════════════════════════
# Team-Repository Permissions
# ═══════════════════════════════════════════════════════════
resource "github_team_repository" "admin_all" {
  for_each = github_repository.startup

  team_id    = github_team.admin.id
  repository = each.value.name
  permission = "admin"
}

resource "github_team_repository" "platform_all" {
  for_each = github_repository.startup

  team_id    = github_team.platform.id
  repository = each.value.name
  permission = "push"
}

resource "github_team_repository" "startup_own" {
  for_each = { for r in local.startup_repos : r.full_name => r }

  team_id    = github_team.startup[each.value.startup].id
  repository = github_repository.startup[each.key].name
  permission = "push"
}

resource "github_team_repository" "investors_read" {
  for_each = github_repository.startup

  team_id    = github_team.investors.id
  repository = each.value.name
  permission = "pull"
}

# ═══════════════════════════════════════════════════════════
# Branch Protection
# ═══════════════════════════════════════════════════════════
resource "github_branch_protection" "main" {
  for_each = github_repository.startup

  repository_id = each.value.node_id
  pattern       = "main"

  required_status_checks {
    strict = true
    contexts = [
      "ci/build",
      "ci/test",
      "ci/security-scan"
    ]
  }

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
  }

  enforce_admins = false

  allows_deletions    = false
  allows_force_pushes = false
}

# ═══════════════════════════════════════════════════════════
# Organization Secrets
# ═══════════════════════════════════════════════════════════
resource "github_actions_organization_secret" "data_hub_token" {
  secret_name     = "DATA_HUB_TOKEN"
  visibility      = "private"
  plaintext_value = var.data_hub_token
}

resource "github_actions_organization_secret" "comm_hub_token" {
  secret_name     = "COMM_HUB_TOKEN"
  visibility      = "private"
  plaintext_value = var.comm_hub_token
}

resource "github_actions_organization_secret" "kube_config" {
  secret_name     = "KUBE_CONFIG"
  visibility      = "private"
  plaintext_value = var.kube_config
}

# ═══════════════════════════════════════════════════════════
# Outputs
# ═══════════════════════════════════════════════════════════
output "platform_repos" {
  value = { for k, v in github_repository.platform : k => v.html_url }
}

output "startup_repos" {
  value = { for k, v in github_repository.startup : k => v.html_url }
}

output "teams" {
  value = {
    admin    = github_team.admin.slug
    platform = github_team.platform.slug
    mentors  = github_team.mentors.slug
    investors = github_team.investors.slug
    compliance = github_team.compliance.slug
    startups = { for k, v in github_team.startup : k => v.slug }
  }
}
