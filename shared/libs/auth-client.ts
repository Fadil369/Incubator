/**
 * BrainSAIT Auth Client
 * JWT verification + Keycloak integration for all incubator services
 */
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://auth.brainsait.dev';
const REALM = process.env.KEYCLOAK_REALM || 'brainsait';

const client = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 600000,
  rateLimit: true,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key!.getPublicKey());
    });
  });
}

export interface TokenPayload {
  sub: string;
  email: string;
  preferred_username: string;
  realm_access: { roles: string[] };
  resource_access: Record<string, { roles: string[] }>;
  startup_id?: string;
  exp: number;
  iat: number;
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') throw new Error('Invalid token');

  const signingKey = await getSigningKey(decoded.header.kid as string);
  const payload = jwt.verify(token, signingKey, {
    algorithms: ['RS256'],
    issuer: `${KEYCLOAK_URL}/realms/${REALM}`,
  }) as TokenPayload;

  return payload;
}

export function hasRole(payload: TokenPayload, role: string): boolean {
  return (
    payload.realm_access?.roles?.includes(role) ||
    Object.values(payload.resource_access || {}).some((r) => r.roles?.includes(role))
  );
}

export function isStartupMember(payload: TokenPayload, startupId: string): boolean {
  return (
    payload.startup_id === startupId ||
    hasRole(payload, 'incubator-admin') ||
    hasRole(payload, `${startupId}-member`)
  );
}

export function requireAuth(requiredRole?: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
      }

      const token = authHeader.slice(7);
      const payload = await verifyToken(token);
      req.user = payload;

      if (requiredRole && !hasRole(payload, requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
