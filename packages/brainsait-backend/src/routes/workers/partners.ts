/**
 * Partner Lifecycle Management Routes
 *
 * Covers the full partner journey from application receipt to incubator access:
 *
 *  POST  /api/v1/partners/application              — Receive application (webhook from brainsait-org or direct)
 *  GET   /api/v1/partners/applications             — Admin: list applications (requires X-Admin-Key)
 *  GET   /api/v1/partners/applications/:id         — Admin: get one application
 *  POST  /api/v1/partners/applications/:id/accept  — Admin: accept → generate magic link → send email
 *  POST  /api/v1/partners/applications/:id/reject  — Admin: reject → send rejection email
 *  GET   /api/v1/partners/validate?token=xxx       — Validate invitation token, return partner info
 *  POST  /api/v1/partners/complete-onboarding      — Partner completes onboarding and persists profile details after clicking magic link
 */

import { Hono } from 'hono';

interface Env {
  PARTNER_APPLICATIONS: KVNamespace;
  SENDGRID_API_KEY: string;
  ADMIN_KEY: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ONBOARDED';

export interface PartnerApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  country: string;
  partnerType: string;
  description: string;
  status: ApplicationStatus;
  referenceId: string;
  inviteToken?: string;
  inviteSentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  onboardedAt?: string;
  startupSlug?: string;
  timezone?: string;
  linkedIn?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const PARTNER_TYPE_NAMES: Record<string, string> = {
  tech: 'Technology Partner',
  health: 'Healthcare Provider',
  dist: 'Distribution Partner',
  integ: 'Integration Partner',
};

const partners = new Hono<{ Bindings: Env }>();

// ── Middleware: require admin key ─────────────────────────────────────────────

function requireAdmin(c: { req: { header: (k: string) => string | undefined }, env: Env }, next: () => Promise<Response>): Promise<Response> {
  const key = c.req.header('x-admin-key');
  const expected = c.env.ADMIN_KEY;
  if (!expected || !key || key !== expected) {
    return Promise.resolve(new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }));
  }
  return next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateReferenceId(): string {
  return `BSP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function generateInviteToken(applicationId: string, secret: string): Promise<string> {
  const payload = `${applicationId}:${Date.now()}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  // Encode payload as base64url without Node.js Buffer
  const payloadB64Url = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${payloadB64Url}.${hex}`;
}

async function verifyInviteToken(token: string, secret: string): Promise<string | null> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payloadB64Url = token.slice(0, dot);
  const providedHex = token.slice(dot + 1);
  let payload: string;
  try {
    // Decode base64url (RFC 4648 §5) without Node.js Buffer: restore standard base64
    const base64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      payloadB64Url.length + ((4 - (payloadB64Url.length % 4)) % 4),
      '='
    );
    payload = atob(base64);
  } catch {
    return null;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expectedHex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (providedHex !== expectedHex) return null;
  // payload = "applicationId:timestamp" — token valid for 7 days
  const parts = payload.split(':');
  if (parts.length < 2) return null;
  const ts = parseInt(parts[parts.length - 1]);
  if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) return null;
  return parts.slice(0, -1).join(':'); // applicationId
}

async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  html: string,
  text: string,
  apiKey: string
): Promise<void> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name: toName }] }],
      from: { email: 'partner@brainsait.org', name: 'BrainSAIT Partners' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid error ${res.status}: ${body}`);
  }
}

function buildAcceptanceEmailHtml(app: PartnerApplication, portalUrl: string): string {
  const partnerTypeName = PARTNER_TYPE_NAMES[app.partnerType] ?? app.partnerType;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Welcome to BrainSAIT Incubator</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#1e1b4b 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;">
            <div style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:12px;padding:10px 20px;margin-bottom:20px;">
              <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">✅ Application Accepted</span>
            </div>
            <h1 style="margin:0 0 12px;color:#f8fafc;font-size:28px;font-weight:700;">Welcome to BrainSAIT Incubator!</h1>
            <p style="margin:0;color:#94a3b8;font-size:15px;">You've been accepted as a <strong style="color:#a78bfa;">${partnerTypeName}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:#1e1e3a;padding:36px 40px 24px;">
            <p style="margin:0 0 16px;color:#e2e8f0;font-size:16px;line-height:1.7;">Dear <strong style="color:#f8fafc;">${app.firstName}</strong>,</p>
            <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              We are thrilled to welcome <strong style="color:#f8fafc;">${app.organization}</strong> to the <strong style="color:#a78bfa;">BrainSAIT Ultimate Incubator Program</strong>. Your application has been reviewed and accepted by our team.
            </p>
            <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              Click the button below to access your personalized incubator portal and complete your onboarding. This link is valid for <strong style="color:#d4a574;">7 days</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#a78bfa);color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:10px;letter-spacing:-0.3px;">
                Access My Incubator Portal →
              </a>
            </div>
            <p style="margin:0;color:#64748b;font-size:12px;text-align:center;word-break:break-all;">
              Or copy this link: <a href="${portalUrl}" style="color:#8b5cf6;">${portalUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#1e1e3a;padding:0 40px 28px;">
            <div style="background:#16213e;border:1px solid #2d3a5e;border-radius:12px;padding:24px;">
              <p style="margin:0 0 16px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">What's Waiting For You</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ['🚀', 'Incubator Program Dashboard', 'Track milestones, access resources, book mentor sessions'],
                  ['🔧', 'GitHub Repository Setup', 'Auto-provisioned repos, CI/CD pipelines, and templates'],
                  ['🤝', 'Dedicated Mentor Assignment', 'Weekly 1-on-1 sessions with a BrainSAIT domain expert'],
                  ['📊', 'Analytics & KPI Tracking', 'Real-time dashboards for your startup growth metrics'],
                ].map(([icon, title, desc]) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #1e2d4a;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;font-size:20px;vertical-align:middle;">${icon}</td>
                      <td style="padding-left:12px;vertical-align:middle;">
                        <strong style="color:#e2e8f0;font-size:14px;">${title}</strong><br>
                        <span style="color:#64748b;font-size:12px;">${desc}</span>
                      </td>
                    </tr></table>
                  </td>
                </tr>`).join('')}
              </table>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#16213e;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
              © ${new Date().getFullYear()} BrainSAIT · <a href="https://brainsait.org" style="color:#8b5cf6;">brainsait.org</a><br>
              Reference: <code style="color:#64748b;">${app.referenceId}</code>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAcceptanceEmailText(app: PartnerApplication, portalUrl: string): string {
  const partnerTypeName = PARTNER_TYPE_NAMES[app.partnerType] ?? app.partnerType;
  return `Welcome to BrainSAIT Incubator, ${app.firstName}!

Your application for ${app.organization} has been ACCEPTED as a ${partnerTypeName}.

Access your personalized incubator portal here (valid for 7 days):
${portalUrl}

What's waiting for you:
  • Incubator Program Dashboard
  • GitHub Repository Setup (auto-provisioned)
  • Dedicated Mentor Assignment
  • Analytics & KPI Tracking

Reference: ${app.referenceId}
© ${new Date().getFullYear()} BrainSAIT · brainsait.org
`;
}

function buildRejectionEmailHtml(app: PartnerApplication): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>BrainSAIT Partner Application Update</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px 16px 0 0;padding:40px;text-align:center;">
            <h1 style="margin:0 0 12px;color:#f8fafc;font-size:26px;font-weight:700;">Application Update</h1>
            <p style="margin:0;color:#94a3b8;font-size:15px;">BrainSAIT Partner Program</p>
          </td>
        </tr>
        <tr>
          <td style="background:#1e1e3a;padding:36px 40px;">
            <p style="margin:0 0 16px;color:#e2e8f0;font-size:16px;line-height:1.7;">Dear ${app.firstName},</p>
            <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              Thank you for your interest in partnering with BrainSAIT. After careful review of your application for <strong style="color:#f8fafc;">${app.organization}</strong>, we are unable to move forward at this time.
            </p>
            <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              We encourage you to reapply in the future as the program evolves. In the meantime, you're welcome to explore our platform and documentation at <a href="https://brainsait.org" style="color:#8b5cf6;">brainsait.org</a>.
            </p>
            <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">
              If you have questions, please reply to this email or reach out to <a href="mailto:partner@brainsait.org" style="color:#8b5cf6;">partner@brainsait.org</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#16213e;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#475569;font-size:12px;">
              © ${new Date().getFullYear()} BrainSAIT · <a href="https://brainsait.org" style="color:#8b5cf6;">brainsait.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildRejectionEmailText(app: PartnerApplication): string {
  return `BrainSAIT Partner Program — Application Update

Dear ${app.firstName},

Thank you for your interest in partnering with BrainSAIT.

After careful review of your application for ${app.organization}, we are unable to move forward at this time.

We encourage you to reapply in the future. You can also explore our platform at https://brainsait.org.

Questions? Contact partner@brainsait.org.

© ${new Date().getFullYear()} BrainSAIT · brainsait.org
`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Receive application (from brainsait-org email-worker webhook or direct POST from partners.html)
partners.post('/application', async (c) => {
  type Body = {
    firstName: string;
    lastName: string;
    email: string;
    organization: string;
    country: string;
    partnerType: string;
    description: string;
  };
  const body = await c.req.json<Body>().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON' }, 400);

  const required = ['firstName', 'lastName', 'email', 'organization', 'country', 'partnerType', 'description'] as const;
  for (const field of required) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return c.json({ error: `Missing required field: ${field}` }, 400);
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const application: PartnerApplication = {
    id,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.toLowerCase().trim(),
    organization: body.organization.trim(),
    country: body.country.trim(),
    partnerType: body.partnerType.trim(),
    description: body.description.trim(),
    status: 'PENDING',
    referenceId: generateReferenceId(),
    createdAt: now,
    updatedAt: now,
  };

  await c.env.PARTNER_APPLICATIONS.put(`application:${id}`, JSON.stringify(application), {
    expirationTtl: 365 * 24 * 60 * 60, // 1 year
  });

  return c.json({ success: true, applicationId: id, referenceId: application.referenceId });
});

// Admin: list applications
partners.get('/applications', async (c) => {
  const adminKey = c.req.header('x-admin-key');
  if (!c.env.ADMIN_KEY || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const status = c.req.query('status');
  const keys: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const page = await c.env.PARTNER_APPLICATIONS.list({ prefix: 'application:', cursor });
    keys.push(...page.keys.map((key) => key.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const applications = (
    await Promise.all(
      keys.map(async (key) => {
        const raw = await c.env.PARTNER_APPLICATIONS.get(key);
        return raw ? (JSON.parse(raw) as PartnerApplication) : null;
      })
    )
  )
    .filter((a): a is PartnerApplication => a !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filtered = status ? applications.filter((a) => a.status === status) : applications;
  return c.json({ applications: filtered, total: filtered.length });
});

// Admin: get single application
partners.get('/applications/:id', async (c) => {
  const adminKey = c.req.header('x-admin-key');
  if (!c.env.ADMIN_KEY || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const { id } = c.req.param();
  const raw = await c.env.PARTNER_APPLICATIONS.get(`application:${id}`);
  if (!raw) return c.json({ error: 'Not found' }, 404);
  return c.json(JSON.parse(raw) as PartnerApplication);
});

// Admin: accept application → generate magic link → send acceptance email
partners.post('/applications/:id/accept', async (c) => {
  const adminKey = c.req.header('x-admin-key');
  if (!c.env.ADMIN_KEY || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();
  const raw = await c.env.PARTNER_APPLICATIONS.get(`application:${id}`);
  if (!raw) return c.json({ error: 'Application not found' }, 404);

  const app = JSON.parse(raw) as PartnerApplication;
  if (app.status === 'ACCEPTED' || app.status === 'ONBOARDED') {
    return c.json({ error: `Application is already ${app.status}` }, 409);
  }

  // Derive startup slug from organization name
  const slug = app.organization
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Generate signed invitation token
  const inviteToken = await generateInviteToken(id, c.env.JWT_SECRET);
  const now = new Date().toISOString();

  const updated: PartnerApplication = {
    ...app,
    status: 'ACCEPTED',
    inviteToken,
    inviteSentAt: now,
    acceptedAt: now,
    startupSlug: slug,
    updatedAt: now,
  };

  await c.env.PARTNER_APPLICATIONS.put(`application:${id}`, JSON.stringify(updated));

  // Build portal URL with magic token
  const frontendUrl = c.env.FRONTEND_URL || 'https://brainsait.org';
  const portalUrl = `${frontendUrl}/portal/accept?token=${encodeURIComponent(inviteToken)}&app=${id}`;
  const emailSent = Boolean(c.env.SENDGRID_API_KEY);

  // Send acceptance email
  if (emailSent) {
    await sendEmail(
      updated.email,
      `${updated.firstName} ${updated.lastName}`,
      '🎉 Your BrainSAIT Incubator Application is Accepted!',
      buildAcceptanceEmailHtml(updated, portalUrl),
      buildAcceptanceEmailText(updated, portalUrl),
      c.env.SENDGRID_API_KEY
    );
  }

  return c.json({
    success: true,
    applicationId: id,
    startupSlug: slug,
    portalUrl,
    emailSent,
    message: emailSent
      ? `Application accepted and invitation email sent to ${updated.email}`
      : `Application accepted, but invitation email was not sent because SENDGRID_API_KEY is not configured`,
  });
});

// Admin: reject application → send rejection email
partners.post('/applications/:id/reject', async (c) => {
  const adminKey = c.req.header('x-admin-key');
  if (!c.env.ADMIN_KEY || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { id } = c.req.param();
  const raw = await c.env.PARTNER_APPLICATIONS.get(`application:${id}`);
  if (!raw) return c.json({ error: 'Application not found' }, 404);

  const app = JSON.parse(raw) as PartnerApplication;
  if (app.status === 'REJECTED') {
    return c.json({ error: 'Application is already rejected' }, 409);
  }

  const now = new Date().toISOString();
  const updated: PartnerApplication = { ...app, status: 'REJECTED', rejectedAt: now, updatedAt: now };
  await c.env.PARTNER_APPLICATIONS.put(`application:${id}`, JSON.stringify(updated));
  const emailSent = Boolean(c.env.SENDGRID_API_KEY);

  if (emailSent) {
    await sendEmail(
      updated.email,
      `${updated.firstName} ${updated.lastName}`,
      'BrainSAIT Partner Application — Update',
      buildRejectionEmailHtml(updated),
      buildRejectionEmailText(updated),
      c.env.SENDGRID_API_KEY
    );
  }

  return c.json({
    success: true,
    emailSent,
    message: emailSent
      ? `Application rejected and notification sent to ${updated.email}`
      : `Application rejected, but notification email was not sent because SENDGRID_API_KEY is not configured`,
  });
});

// Validate invitation token (called by frontend /portal/accept page)
partners.get('/validate', async (c) => {
  const token = c.req.query('token');
  const appId = c.req.query('app');
  if (!token || !appId) return c.json({ error: 'Missing token or app parameter' }, 400);

  const applicationId = await verifyInviteToken(token, c.env.JWT_SECRET);
  if (!applicationId || applicationId !== appId) {
    return c.json({ error: 'Invalid or expired invitation link' }, 401);
  }

  const raw = await c.env.PARTNER_APPLICATIONS.get(`application:${applicationId}`);
  if (!raw) return c.json({ error: 'Application not found' }, 404);

  const app = JSON.parse(raw) as PartnerApplication;
  if (app.status !== 'ACCEPTED' && app.status !== 'ONBOARDED') {
    return c.json({ error: 'This invitation link is no longer valid' }, 403);
  }

  // Return safe subset (no token)
  const { inviteToken: _tok, ...safeApp } = app;
  return c.json({ valid: true, application: safeApp });
});

// Complete onboarding — partner sets password and any additional profile info
partners.post('/complete-onboarding', async (c) => {
  type Body = { token: string; appId: string; password?: string; timezone?: string; linkedIn?: string };
  const body = await c.req.json<Body>().catch(() => null);
  if (!body?.token || !body?.appId) return c.json({ error: 'Missing token or appId' }, 400);

  const applicationId = await verifyInviteToken(body.token, c.env.JWT_SECRET);
  if (!applicationId || applicationId !== body.appId) {
    return c.json({ error: 'Invalid or expired invitation link' }, 401);
  }

  const raw = await c.env.PARTNER_APPLICATIONS.get(`application:${applicationId}`);
  if (!raw) return c.json({ error: 'Application not found' }, 404);

  const app = JSON.parse(raw) as PartnerApplication;
  if (app.status === 'ONBOARDED') {
    return c.json({ success: true, startupSlug: app.startupSlug, message: 'Already onboarded' });
  }

  const now = new Date().toISOString();
  const trimmedTimezone = body.timezone?.trim();
  const trimmedLinkedIn = body.linkedIn?.trim();
  const trimmedPassword = body.password?.trim();
  const passwordHash = trimmedPassword ? await hashPassword(trimmedPassword) : undefined;

  const updated: PartnerApplication = {
    ...app,
    status: 'ONBOARDED',
    onboardedAt: now,
    updatedAt: now,
    ...(trimmedTimezone ? { timezone: trimmedTimezone } : {}),
    ...(trimmedLinkedIn ? { linkedIn: trimmedLinkedIn } : {}),
    ...(passwordHash ? { passwordHash } : {}),
  };
  await c.env.PARTNER_APPLICATIONS.put(`application:${applicationId}`, JSON.stringify(updated));

  return c.json({
    success: true,
    startupSlug: updated.startupSlug,
    referenceId: updated.referenceId,
    message: 'Onboarding complete. Redirecting to your portal…',
  });
});

export default partners;
