# BrainSAIT Unified Routing

This document describes how all BrainSAIT apps are served under the single unified URL `https://app.brainsait.org` using Cloudflare Pages and a Cloudflare Worker edge router.

---

## Architecture overview

```
https://app.brainsait.org/*
         │
         ▼
  [Cloudflare Worker]          ← packages/brainsait-router
  brainsait-app-router
         │
         ├─ /incubator/*  ──►  incubator.pages.dev  (Fadil369/Incubator)
         ├─ /givc/*       ──►  givc.pages.dev        (Fadil369/GIVC)
         ├─ /doctor/*     ──►  doctor.pages.dev      (Fadil369/doctor)
         ├─ /api/*        ──►  api-gateway.brainsait.org
         └─ (default)     ──►  masterlinc.pages.dev  (platform shell)
```

Each Next.js app is deployed independently to its own Cloudflare Pages project and built with the appropriate `basePath` so that all asset URLs, router links, and API calls resolve correctly when served under the unified path prefix.

---

## Cloudflare Pages project hostnames

| App | Repo | Pages project hostname | Required `basePath` |
|---|---|---|---|
| Platform shell | Fadil369/masterlinc | `masterlinc.pages.dev` | *(none — serves at `/`)* |
| Incubator | Fadil369/Incubator | `incubator.pages.dev` | `/incubator` |
| GIVC | Fadil369/GIVC | `givc.pages.dev` | `/givc` |
| Doctor portal | Fadil369/doctor | `doctor.pages.dev` | `/doctor` |

> **Note:** These hostnames are examples. Use the actual Pages project names configured in your Cloudflare account. The important point is that the Worker's route table and each app's `basePath` must agree.

---

## Worker route binding

The Worker in `packages/brainsait-router` must be bound to the route `app.brainsait.org/*`.

### Via `wrangler.toml` (already configured)

```toml
[[env.production.routes]]
pattern = "app.brainsait.org/*"
zone_name = "brainsait.org"
```

### Manual setup in the Cloudflare dashboard

1. Open **Workers & Pages → brainsait-app-router → Settings → Triggers**.
2. Add route `app.brainsait.org/*` using zone `brainsait.org`.
3. Make sure no other Worker or Page rule intercepts `app.brainsait.org` before this Worker.

### Deploying the Worker

```bash
cd packages/brainsait-router
npm install
npm run deploy:production   # deploys with --env production
```

---

## Required `basePath` settings per app

### Incubator (`Fadil369/Incubator`) — **already configured in this PR**

```js
// packages/brainsait-frontend/next.config.js
const nextConfig = {
  basePath: '/incubator',
  // ...
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.brainsait.org',
    // ...
  },
};
```

### GIVC (`Fadil369/GIVC`) — **action required in that repo**

```js
// next.config.js (or next.config.mjs)
const nextConfig = {
  basePath: '/givc',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.brainsait.org',
  },
};
```

### Doctor portal (`Fadil369/doctor`) — **action required in that repo**

If the app is Next.js:

```js
// next.config.js
const nextConfig = {
  basePath: '/doctor',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.brainsait.org',
  },
};
```

If the app is plain static HTML, ensure all asset paths and internal links are relative (e.g., `./app.js` not `/app.js`) and that the Cloudflare Pages build outputs files that work under `/doctor/`.

### masterlinc (`Fadil369/masterlinc`) — **no `basePath` needed**

masterlinc is the shell and serves at `/`. Navigation links to other apps should use absolute paths:

```tsx
<Link href="/incubator">Incubator</Link>
<Link href="/givc">GIVC</Link>
<Link href="/doctor">Doctor Portal</Link>
```

---

## `x-request-id` propagation

The Worker generates a `crypto.randomUUID()` request-id if the incoming request does not already carry an `x-request-id` header. The value is:

- Set on the proxied upstream request
- Echoed back in the response

All services should log this value to enable end-to-end request correlation across the platform.

---

## Cloudflare Pages environment variables (per project)

Set the following in each Pages project under **Settings → Environment variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_ORIGIN` | `https://app.brainsait.org` |
| `NEXT_PUBLIC_API_URL` | `/api` |

For preview deployments you can use the Pages project's own domain (e.g., `https://incubator.pages.dev`) as `NEXT_PUBLIC_APP_ORIGIN` and the full backend URL as `NEXT_PUBLIC_API_URL`.

---

## DNS / SSL

- Add a CNAME (or Workers route) for `app.brainsait.org` pointing to the Worker.
- Cloudflare handles TLS automatically for zones already on Cloudflare.
- No additional origin certificates are required for Pages-to-Pages routing through the Worker.
