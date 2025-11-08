# BrainSAIT Platform - Critical Action Items & Specific Issues

## CRITICAL ISSUES TO ADDRESS IMMEDIATELY

### 1. Port Configuration Mismatch

**Issue:** Document service referenced with wrong port
**Files Affected:**
- `/home/user/Incubator/packages/brainsait-frontend/src/services/documentService.ts:13`
- Docker compose shows port 5002 but code references 3002

**Current Code:**
```typescript
const DOCS_API_BASE_URL = process.env.NEXT_PUBLIC_DOCS_API_URL || 'http://localhost:3002/api';
```

**Fix Required:**
```typescript
const DOCS_API_BASE_URL = process.env.NEXT_PUBLIC_DOCS_API_URL || 'http://localhost:5002/api';
```

**Environment Variable:**
Add to `.env.local`:
```
NEXT_PUBLIC_DOCS_API_URL=http://localhost:5002/api
```

---

### 2. Missing Frontend Authentication Pages

**Issue:** No login, register, password reset pages
**Files to Create:**
```
packages/brainsait-frontend/src/app/
├── auth/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── page.tsx
│   ├── verify-email/
│   │   └── page.tsx
│   └── layout.tsx
```

**Required API Service:**
```typescript
// packages/brainsait-frontend/src/services/authService.ts
export const authService = {
  login: (email: string, password: string) => 
    axios.post(`${API_BASE_URL}/api/auth/login`, { email, password }),
  
  register: (data: RegisterInput) =>
    axios.post(`${API_BASE_URL}/api/auth/register`, data),
  
  resetPassword: (token: string, password: string) =>
    axios.post(`${API_BASE_URL}/api/auth/reset-password`, { token, password }),
  
  verifyEmail: (token: string) =>
    axios.post(`${API_BASE_URL}/api/auth/verify-email`, { token }),
};
```

---

### 3. Database Schema Redundancies

**Issue:** Duplicate/overlapping fields
**Files Affected:** `/home/user/Incubator/packages/brainsait-backend/prisma/schema.prisma`

**Problems:**
```prisma
model User {
  // Line 17-18: Overlapping name fields
  firstName   String
  lastName    String
  name        String?   // Redundant - should derive from firstName + lastName
  
  // Line 25-26: Overlapping phone fields  
  phoneNumber String?
  phone       String?   // Redundant
  
  // Line 27: Denormalized reference
  smeId       String?   // Should use relation instead
}

model SMEProfile {
  // Line 73: Duplicate with SaudiRegulatoryCompliance
  commercialRegistrationNumber String? @unique
  
  // Line 94: Confusing relationship
  saudiRegulatory SaudiRegulatoryCompliance?
}

model SaudiRegulatoryCompliance {
  // Line 531: Duplicate field
  crNumber String? @unique
}

model Mentorship {
  // Line 176-177: Unclear relationships
  championId String?
  menteeId   String?
  // Should be mentee: User @relation(fields: [menteeId])
}
```

**Recommended Fixes:**
1. Remove `User.name`, `User.phone`, `User.smeId` (use relations)
2. Consolidate CR number to single field in SMEProfile
3. Clarify Mentorship relationships
4. Add unique constraints on commercial registration per region

---

### 4. Missing AI Service Integration

**Issue:** AI service exists but is not integrated
**Files Affected:**
- `/home/user/Incubator/packages/brainsait-ai/` (not imported in backend)
- `/home/user/Incubator/packages/brainsait-backend/src/server.ts` (no AI routes)

**Missing in Backend:**
```typescript
// Should be added to src/server.ts
import aiRoutes from './routes/aiChampions';
app.use('/api/ai-champions', aiRoutes);  // Exists but routes incomplete
```

**Required Endpoints:**
```
GET    /api/ai-champions              - List champions
POST   /api/ai-champions              - Create champion
GET    /api/ai-champions/:id          - Get champion details
PUT    /api/ai-champions/:id          - Update champion
DELETE /api/ai-champions/:id          - Delete champion
GET    /api/ai-champions/:id/mentees  - List mentees
POST   /api/ai-champions/:id/sessions - Schedule session
GET    /api/ai-analytics              - AI usage analytics
```

---

### 5. Frontend State Management Missing

**Issue:** No global state, no session persistence, no data caching
**Impact:** Every page refresh loses state, no offline support

**Solution - Install Zustand:**
```bash
npm install zustand --workspace=brainsait-frontend
```

**Create Store:**
```typescript
// packages/brainsait-frontend/src/lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authService.login(email, password);
          set({ user: res.data.user, token: res.data.token });
        } finally {
          set({ isLoading: false });
        }
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

---

### 6. Document Service Not Functional

**Issue:** Document service is a stub with no template system
**Files Affected:**
- `/home/user/Incubator/packages/brainsait-docs/src/` (incomplete)
- No Puppeteer integration
- No file storage
- No template system

**Required Implementation:**
1. Create template directory structure:
```
packages/brainsait-docs/
├── templates/
│   ├── en/
│   │   ├── feasibility-study.html
│   │   ├── business-plan.html
│   │   └── certificate.html
│   └── ar/
│       ├── feasibility-study.html
│       ├── business-plan.html
│       └── certificate.html
├── output/           (generated PDFs)
└── temp/             (temporary files)
```

2. Implement PDF generation service:
```typescript
// packages/brainsait-docs/src/services/pdfService.ts
export class PDFService {
  async generateFeasibilityStudy(data: any): Promise<Buffer> {
    const template = await this.loadTemplate('feasibility-study', data.language);
    const html = await this.renderTemplate(template, data);
    return await this.htmlToPdf(html);
  }
}
```

---

### 7. Database Connection Not Verified

**Issue:** Prisma schema exists but migrations not applied
**Required Steps:**
```bash
cd packages/brainsait-backend

# Generate Prisma client
npx prisma generate

# Run migrations (create tables)
npx prisma migrate dev --name initial

# Seed database
npx prisma db seed
```

**Missing Seed File:**
```typescript
// packages/brainsait-backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@brainsait.com',
      password: 'hashedPassword',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

### 8. Frontend Dockerfile Build Issue

**Issue:** References Next.js standalone build which isn't enabled
**File:** `/home/user/Incubator/packages/brainsait-frontend/Dockerfile:24`

**Current Line:**
```dockerfile
COPY --from=builder /app/.next/standalone ./
```

**Fix Required - Enable Standalone Build:**
```javascript
// packages/brainsait-frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Add this line
  reactStrictMode: true,
  // ... rest of config
};
module.exports = nextConfig;
```

---

### 9. Type Safety Issues in Controllers

**Issue:** Using `any` type instead of proper Prisma types
**File:** `/home/user/Incubator/packages/brainsait-backend/src/controllers/smeController.ts:27`

**Current Code:**
```typescript
const where: any = {};
if (companyType) {
  where.companyType = companyType;
}
```

**Fix Required:**
```typescript
const where: Prisma.SMEProfileWhereInput = {};
if (companyType) {
  where.companyType = companyType as SMEType;
}
```

---

### 10. Missing Healthcare License Validation

**Issue:** No validation for healthcare licenses in API
**Required Addition:**

```typescript
// packages/brainsait-backend/src/utils/healthcareValidation.ts
export const validateHealthcareLicense = (license: string, country: string) => {
  // Saudi healthcare licenses follow specific format
  if (country === 'SA') {
    // Validate Saudi health council license format
    const saPattern = /^(GCC|MOH|SFDA)-\d{4,6}$/;
    return saPattern.test(license);
  }
  return true; // Add other country validations
};
```

---

### 11. Missing Error Codes in API Responses

**Issue:** Frontend can't handle specific error types
**Required Change:**

```typescript
// packages/brainsait-backend/src/middleware/errorHandler.ts
// Add error codes to responses
if (err.code === 'P2002') {
  const message = 'Unique constraint violation';
  error = { 
    ...error, 
    message, 
    statusCode: 400,
    code: 'DUPLICATE_ENTRY'  // Add code
  };
}
```

---

### 12. Missing API Documentation

**Required:**
- Swagger/OpenAPI documentation
- API endpoint listing
- Request/response schemas
- Authentication requirements

**Install Dependencies:**
```bash
npm install --workspace=brainsait-backend swagger-ui-express swagger-jsdoc
```

---

## PRIORITY IMPLEMENTATION ORDER

### Week 1: CRITICAL
1. Fix port configuration (5 minutes)
2. Fix Dockerfile build issue (30 minutes)
3. Create auth pages (4 hours)
4. Create auth service (2 hours)
5. Fix database schema redundancies (3 hours)

### Week 2: HIGH PRIORITY
6. Implement state management with Zustand (4 hours)
7. Create missing API services (6 hours)
8. Wire AI service integration (4 hours)
9. Setup testing infrastructure (4 hours)

### Week 3: MEDIUM PRIORITY
10. Complete Document Service (8 hours)
11. Healthcare validation (4 hours)
12. API documentation (6 hours)
13. i18n setup (4 hours)

---

## QUICK FIX CHECKLIST

```bash
# 1. Fix document service port reference (1 min)
sed -i 's/localhost:3002/localhost:5002/g' \
  packages/brainsait-frontend/src/services/documentService.ts

# 2. Create required directories
mkdir -p packages/brainsait-frontend/src/app/auth/{login,register,reset-password,verify-email}
mkdir -p packages/brainsait-backend/prisma/migrations

# 3. Generate Prisma
cd packages/brainsait-backend && npx prisma generate

# 4. Create baseline files
touch packages/brainsait-frontend/src/services/authService.ts
touch packages/brainsait-frontend/src/lib/store.ts
```

---

## TESTING THE FIXES

```bash
# Build and test frontend
npm run build --workspace=brainsait-frontend

# Test backend
npm run test --workspace=brainsait-backend

# Run in Docker
docker-compose up --build

# Verify services are running
curl http://localhost:5000/health
curl http://localhost:5002/health
curl http://localhost:3000/health
```

---

**Total Estimated Time to Address All Critical Issues: 25-30 developer-hours**
