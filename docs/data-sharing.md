# 📊 BrainSAIT Data Sharing Protocol

## Overview

The BrainSAIT Data Hub enables secure, HIPAA-compliant data sharing across all 35 incubator startups. This document defines the protocol, policies, and technical implementation.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Startup A   │     │  Startup B   │     │  Startup C   │
│  (bio-grid)  │     │  (dentalAI)  │     │  (vitaio)    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │   Data Contracts   │   Data Contracts   │
       │   (JSON Schema)    │   (JSON Schema)    │
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                  BrainSAIT Data Hub                      │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Hasura  │  │ MinIO    │  │ Postgres │  │ Redis   │ │
│  │ GraphQL │  │ (S3)     │  │ (Meta)   │  │ (Cache) │ │
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Contract Registry + Validation + Access Control │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Notification │  │ Audit Log    │  │ Analytics    │
│ (Slack/WS)   │  │ (Immutable)  │  │ (Grafana)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Data Sharing Tiers

### Tier 1: Public (Catalog Only)
- Schema metadata visible to all startups
- No actual data shared
- Useful for API discovery

### Tier 2: Internal (Same Sector)
- Startups in same healthcare subsector can share
- Requires data contract approval
- PII must be anonymized

### Tier 3: Cross-StartUp (Explicit Consent)
- One-to-one data sharing
- Both parties sign data agreement
- Full audit trail

### Tier 4: Aggregated (Analytics Only)
- Data aggregated across multiple startups
- Individual records never exposed
- Used for cohort analytics and benchmarking

## Data Contract Specification

Each data contract is a JSON Schema file with HIPAA extensions:

```json
{
  "$schema": "https://brainsait.dev/schemas/data-contract-v1.json",
  "name": "genomic-variants",
  "version": "1.2.0",
  "owner": "bio-grid",
  "description": "Anonymized genomic variant annotations",

  "type": "object",
  "properties": {
    "variant_id": {
      "type": "string",
      "format": "uuid"
    },
    "chromosome": {
      "type": "string",
      "enum": ["chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7", "chr8",
               "chr9", "chr10", "chr11", "chr12", "chr13", "chr14", "chr15",
               "chr16", "chr17", "chr18", "chr19", "chr20", "chr21", "chr22",
               "chrX", "chrY"]
    },
    "position": {
      "type": "integer",
      "minimum": 0
    },
    "reference_allele": {
      "type": "string",
      "pattern": "^[ACGT]+$"
    },
    "alternate_allele": {
      "type": "string",
      "pattern": "^[ACGT]+$"
    },
    "clinical_significance": {
      "type": "string",
      "enum": ["benign", "likely_benign", "uncertain", "likely_pathogenic", "pathogenic"]
    }
  },
  "required": ["variant_id", "chromosome", "position"],

  "hipaa_compliant": true,
  "pii_fields": [],
  "sharing_policy": "anonymized-only",
  "encryption": "both",
  "retention_days": 2555,

  "access": {
    "read": ["*"],
    "write": ["bio-grid"],
    "subscribe": ["dental-ai", "vitaio", "qanary"]
  }
}
```

## API Endpoints

### Contract Management

```
POST   /api/v1/contracts                  Create a new contract
GET    /api/v1/contracts                  List all contracts
GET    /api/v1/contracts/:name            Get contract by name
PUT    /api/v1/contracts/:name            Update contract
DELETE /api/v1/contracts/:name            Delete contract
POST   /api/v1/contracts/:name/validate   Validate data against contract
```

### Data Exchange

```
POST   /api/v1/data/:contract/publish     Publish data (with validation)
GET    /api/v1/data/:contract/query        Query shared data (GraphQL)
POST   /api/v1/data/:contract/subscribe    Subscribe to updates
GET    /api/v1/data/:contract/stream       Real-time data stream (SSE)
```

### Subscriptions

```
POST   /api/v1/subscriptions              Subscribe to a startup's data
GET    /api/v1/subscriptions               List my subscriptions
DELETE /api/v1/subscriptions/:id           Unsubscribe
GET    /api/v1/subscriptions/:startup      Who subscribes to this startup
```

### Audit

```
GET    /api/v1/audit                      Query audit log
GET    /api/v1/audit/:contract             Audit log for specific contract
GET    /api/v1/audit/export                Export audit log (CSV/JSON)
```

## Security Controls

1. **Access Control**: JWT-based, role-scoped per contract
2. **Encryption**: TLS 1.3 in transit, AES-256 at rest
3. **Audit Logging**: Every read/write/query logged immutably
4. **Data Validation**: Schema validation on every write
5. **PII Detection**: Automated scanning before publish
6. **Rate Limiting**: Per-startup, per-contract limits
7. **Retention**: Auto-purge after retention period

## Compliance

- All data sharing follows HIPAA Safe Harbor de-identification
- No 18 HIPAA identifiers exposed without explicit BAA
- Audit logs retained for 7 years minimum
- Cross-border data transfers require compliance review
