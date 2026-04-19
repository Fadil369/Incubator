# BrainSAIT Ultimate Incubator — Healthcare AI Platform

## Overview

BrainSAIT Ultimate Incubator is a comprehensive healthcare AI startup incubator platform natively hosted on GitHub, designed for the **National Healthcare AI Sandbox** cohort of **35 healthcare AI startups**. Built with a microservices architecture, it provides full GitHub integration, cross-startup data sharing, HIPAA-compliant CI/CD, and real-time communication.

### Key Features

- **🏥 35 Healthcare AI Startups** — Full cohort management with per-startup repos, teams, and project boards
- **🔄 Cross-Startup Data Sharing** — Contract-based, HIPAA-compliant data exchange via Data Hub
- **🔒 HIPAA-Compliant CI/CD** — Security scanning (Trivy, CodeQL, Gitleaks) on every PR
- **💬 Multi-Channel Communication** — Slack, Discord, WebSocket routing via NATS event bus
- **🧠 ML Model Pipeline** — MLflow-integrated model registry and K8s serving
- **🌐 Full GitHub Integration** — Org, Projects, Repos, Hooks, Apps, Pages, Actions
- **📊 Monitoring & Analytics** — Prometheus + Grafana with auto-discovery
- **🌍 Multilingual Support** — Full Arabic and English support with RTL layout
- **🏗️ Infrastructure as Code** — Terraform-managed GitHub resources

## Architecture

```
brainsait-incubator (GitHub Enterprise)
├── 📦 Platform Services
│   ├── brainsait-frontend    → Next.js 14 with Material-UI & RTL
│   ├── brainsait-backend     → Express.js API with PostgreSQL & Redis
│   ├── brainsait-shared      → Common types, utilities, auth client
│   ├── brainsait-docs        → PDF generation (Puppeteer)
│   ├── brainsait-ai          → AI/ML services (Cloudflare Workers)
│   ├── data-hub              → Hasura GraphQL (cross-startup data)
│   ├── api-gateway           → Kong API Gateway
│   ├── auth-service          → Keycloak SSO
│   ├── communication-hub     → Multi-channel notifications (NATS)
│   └── dashboard             → Incubator management UI
│
├── 🚀 Startup Infra (×35 startups)
│   ├── Provisioning scripts  → Auto-create repos, teams, projects
│   ├── K8s manifests         → Namespaces, network policies, quotas
│   ├── Terraform IaC         → Declarative GitHub resource management
│   └── Per-startup CI/CD     → Shared healthcare pipeline
│
├── 📊 GitHub Integration
│   ├── Actions Workflows     → CI/CD, Data Sync, ML Deploy, Reports
│   ├── Projects              → Master board, Milestones, Demo Day
│   ├── Branch Protection     → Required reviews, status checks
│   └── Dependabot            → Auto dependency updates
│
└── 🔐 Security & Compliance
    ├── HIPAA checks          → PII detection, PHI logging prevention
    ├── Secret scanning       → Gitleaks on every push
    ├── Network policies      → Zero-trust K8s networking
    └── Audit logging         → Immutable event trail
```

### Participating Startups (35)

| Sector | Startups |
|--------|----------|
| **AI Operating System** | BrainSAIT |
| **Healthcare AI** | Dsmart, ALDABB AI, Pion Dialecton, Cycls, UntoldAI, MSR04, Sām, JULEB, Rqmii, Senor |
| **Digital Health** | iHealth, Digiations |
| **Bio/Genomics** | Bio-Grid, Biosentry, FAHM Biotechnology |
| **Dental AI** | dentalAI |
| **Clinical/Medical** | CINOVA, TTMD, Healthron, MedFlow, Innova |
| **Physiotherapy** | Physaio |
| **Analytics** | Qanary, Baseerah, Reporty |
| **Aging/Aging Tech** | iAGE |
| **Medical Devices** | ROLOOY |
| **Other Health Tech** | MINOVA, Vitaio, Mara, Alsamer, Salim, ANICON, VLEED |

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: >= 20.10.0 (optional, for containerized development)
- **PostgreSQL**: >= 13.0 (if running without Docker)
- **Redis**: >= 6.0 (if running without Docker)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url> brainsait-platform
cd brainsait-platform

# Install dependencies for all packages
npm install

# Copy environment files
cp .env.example .env
cp packages/brainsait-frontend/.env.local.example packages/brainsait-frontend/.env.local
cp packages/brainsait-backend/.env.example packages/brainsait-backend/.env
cp packages/brainsait-docs/.env.example packages/brainsait-docs/.env
```

### 2. Environment Configuration

Edit the `.env` files in each package to match your environment:

#### Root `.env`
```env
NODE_ENV=development
DATABASE_URL=postgresql://brainsait:password123@localhost:5432/brainsait_db
REDIS_URL=redis://:redis123@localhost:6379
JWT_SECRET=your-super-secret-jwt-key
```

#### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_DOCS_URL=http://localhost:5002
```

### 3. Development Setup

#### Option A: Docker Development (Recommended)

```bash
# Start all services with Docker
npm run docker:up

# Or build and start
npm run docker:build
npm run docker:up
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Document Service**: http://localhost:5002
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

#### Option B: Local Development

1. **Start Database Services**:
```bash
# PostgreSQL (install locally or use Docker)
docker run --name brainsait-postgres -e POSTGRES_DB=brainsait_db -e POSTGRES_USER=brainsait -e POSTGRES_PASSWORD=password123 -p 5432:5432 -d postgres:15-alpine

# Redis (install locally or use Docker)
docker run --name brainsait-redis -p 6379:6379 -d redis:7-alpine redis-server --requirepass redis123
```

2. **Start Development Servers**:
```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run dev:frontend   # Frontend on port 3000
npm run dev:backend    # Backend on port 5000
npm run dev:docs       # Document service on port 5002
```

### 4. Database Setup

```bash
# Generate Prisma client
cd packages/brainsait-backend
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run db:seed
```

## Development Workflow

### Package Scripts

```bash
# Development
npm run dev              # Start all services in development
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run dev:docs         # Start document service only

# Building
npm run build            # Build all packages
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Testing
npm run test             # Run tests for all packages
npm run lint             # Lint all packages
npm run format           # Format code with Prettier

# Docker
npm run docker:build     # Build Docker images
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services

# Utilities
npm run clean            # Clean all build artifacts
```

### Code Quality

The project includes comprehensive code quality tools:

- **TypeScript**: Type safety across all packages
- **ESLint**: Code linting with custom rules per package
- **Prettier**: Code formatting
- **Pre-commit hooks**: Automated quality checks

```bash
# Run code quality checks
npm run lint             # Check for linting errors
npm run format           # Format code
npm run type-check       # TypeScript type checking
```

## Package Details

### Frontend (`brainsait-frontend`)

- **Framework**: Next.js 14 with App Router
- **UI Library**: Material-UI v5 with custom theming
- **Internationalization**: React i18next with Arabic/English support
- **RTL Support**: Full right-to-left layout support
- **State Management**: React Query for server state
- **Styling**: Emotion with Material-UI theming

**Key Features**:
- Responsive design with mobile-first approach
- Dark/Light theme support
- Arabic and English localization
- Accessible components (WCAG 2.1 AA)
- Progressive Web App (PWA) ready

### Backend (`brainsait-backend`)

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and caching
- **Authentication**: JWT-based authentication
- **Validation**: Express-validator for request validation
- **File Upload**: Multer with configurable storage

**API Features**:
- RESTful API design
- Rate limiting and security middleware
- Comprehensive error handling
- Request/response logging
- Health check endpoints
- Database migrations and seeding

### Document Service (`brainsait-docs`)

- **Framework**: Express.js with TypeScript
- **PDF Generation**: Puppeteer for server-side rendering
- **Templating**: Handlebars with custom helpers
- **Multilingual**: Arabic and English template support
- **Features**: QR codes, charts, and custom styling

**Document Types**:
- Program certificates
- Business reports
- Invoices and receipts
- Program summaries
- Custom documents

### Shared Package (`brainsait-shared`)

- **Types**: Common TypeScript interfaces and enums
- **Utilities**: Validation, formatting, and helper functions
- **Constants**: Application-wide constants and configurations
- **Validation**: Zod schemas for runtime type checking

## API Documentation

### Authentication Endpoints

```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/forgot-password  # Password reset request
POST /api/auth/reset-password   # Password reset
```

### User Management

```
GET    /api/users           # List users
GET    /api/users/:id       # Get user by ID
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user
```

### SME Management

```
GET    /api/sme             # List SMEs
POST   /api/sme             # Create SME
GET    /api/sme/:id         # Get SME by ID
PUT    /api/sme/:id         # Update SME
DELETE /api/sme/:id         # Delete SME
```

### Document Generation

```
POST /api/pdf/generate          # Generate custom PDF
POST /api/pdf/certificate       # Generate certificate
POST /api/pdf/report            # Generate report
POST /api/pdf/invoice           # Generate invoice
POST /api/pdf/program-summary   # Generate program summary
```

## Database Schema

The platform uses PostgreSQL with the following main entities:

- **Users**: System users (SME owners, mentors, admins)
- **SME Profiles**: Small and medium enterprise information
- **Mentor Profiles**: Mentor expertise and availability
- **Programs**: Incubation and training programs
- **Enrollments**: SME program participation
- **Mentorships**: Mentor-SME relationships
- **Sessions**: Mentoring and training sessions

## Deployment

### Docker Production Deployment

```bash
# Production build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With SSL and Nginx
docker-compose --profile production up -d
```

### Environment Variables

Configure the following environment variables for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres-server:5432/brainsait_db
REDIS_URL=redis://redis-server:6379
JWT_SECRET=your-production-jwt-secret
DOMAIN=brainsait.com
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### Health Checks

Each service provides health check endpoints:

- Frontend: `/health`
- Backend: `/health`
- Document Service: `/health`

## Monitoring and Logging

### Application Logs

- **Winston** for structured logging
- **Morgan** for HTTP request logging
- Log levels: error, warn, info, http, debug
- Production logs written to files

### Error Tracking

Optional integration with error tracking services:

- Sentry for error monitoring
- Custom error handlers with structured logging
- Client-side error boundaries in React

## Security

### Security Features

- **Helmet.js**: Security headers and protection
- **Rate Limiting**: API rate limiting per IP
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Request validation and sanitization
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

### Best Practices

- Regular dependency updates
- Environment variable validation
- Secure file upload handling
- HTTPS enforcement in production
- Database connection encryption

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm run test:coverage

# Run specific package tests
npm run test --workspace=brainsait-backend
```

### Testing Stack

- **Jest**: Testing framework
- **Supertest**: API testing
- **React Testing Library**: Component testing (frontend)
- **Prisma Test Environment**: Database testing

## Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed
- Ensure code passes all quality checks

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check if ports are in use
   lsof -i :3000 -i :5000 -i :5002
   
   # Kill processes if needed
   kill -9 <PID>
   ```

2. **Database Connection Issues**:
   ```bash
   # Check PostgreSQL status
   docker ps | grep postgres
   
   # View database logs
   docker logs brainsait-postgres
   ```

3. **Redis Connection Issues**:
   ```bash
   # Test Redis connection
   redis-cli -h localhost -p 6379 ping
   
   # With password
   redis-cli -h localhost -p 6379 -a redis123 ping
   ```

4. **Puppeteer Issues** (Document Service):
   ```bash
   # Install additional dependencies on Ubuntu/Debian
   sudo apt-get install -y libgbm-dev
   
   # For Alpine Linux (Docker)
   apk add --no-cache chromium
   ```

### Performance Tips

- Use Redis caching for frequently accessed data
- Optimize database queries with proper indexing
- Enable gzip compression in production
- Use CDN for static assets
- Monitor memory usage in Puppeteer service

## Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for general questions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Material-UI team for the excellent React components
- Prisma team for the modern database toolkit
- Next.js team for the React framework
- All open source contributors who made this project possible

---

## 🧠 Incubator Infrastructure

### Quick Commands

```bash
# Provision all 35 startups on GitHub (repos, teams, projects, webhooks)
bash scripts/provision-all.sh

# Bootstrap a single startup
bash scripts/bootstrap-startup.sh <startup-name>

# Deploy full platform stack locally
docker compose up -d

# Apply Terraform-managed GitHub resources
cd infra && terraform init && terraform plan && terraform apply
```

### Key Infrastructure Files

| Path | Description |
|------|-------------|
| `scripts/provision-all.sh` | Full GitHub org provisioner (35 startups × 4 repos) |
| `scripts/bootstrap-startup.sh` | Single startup bootstrapper |
| `infra/github.tf` | Terraform: all GitHub resources declaratively |
| `.github/workflows/incubator-ci-healthcare.yml` | HIPAA-compliant 5-stage CI/CD |
| `.github/workflows/incubator-data-sync.yml` | Cross-startup data synchronization |
| `.github/workflows/incubator-ml-deploy.yml` | ML model deployment pipeline |
| `.github/workflows/incubator-reports.yml` | Weekly/monthly analytics reports |
| `shared/libs/auth-client.ts` | Keycloak JWT verification |
| `shared/libs/data-contracts.ts` | HIPAA-compliant schema validator |
| `shared/libs/event-bus.ts` | NATS cross-startup event publishing |
| `shared/libs/logger.ts` | PHI-safe structured logging |
| `shared/api-gateway/kong.yml` | Kong API gateway routing config |
| `shared/communication/index.ts` | Multi-channel notification hub |
| `k8s/base/` | K8s namespaces, network policies, quotas |
| `docs/onboarding.md` | Startup onboarding guide |
| `docs/data-sharing.md` | Data sharing protocol & tiers |

### Data Sharing Protocol

Startups share data via **contracts** (JSON Schema + HIPAA extensions):

```
Startup A → data-contracts/patient-data.contract.json → push to main
  → CI auto-syncs to Data Hub → Subscribed startups notified
  → Startup B queries via GraphQL → Full audit trail
```

### GitHub Actions Workflows

- **CI/CD** — Build → Security Scan → Data Sync → Deploy → Notify
- **Data Sync** — Schema discovery, Data Hub sync, subscriber notifications
- **ML Deploy** — Train → Register (MLflow) → Build → Deploy → Smoke test
- **Reports** — Weekly cross-startup analytics, published as GitHub Issues

---

**Built with ❤️ for Healthcare Innovation in the Arab World**