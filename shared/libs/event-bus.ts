/**
 * BrainSAIT Event Bus Client
 * NATS-based event publishing & subscribing for cross-startup communication
 */
import { connect, NatsConnection, StringCodec, Subscription } from 'nats';

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const sc = StringCodec();

let connection: NatsConnection | null = null;

export async function getNatsConnection(): Promise<NatsConnection> {
  if (!connection) {
    connection = await connect({ servers: NATS_URL });
  }
  return connection;
}

export interface EventMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  data: Record<string, unknown>;
  timestamp: string;
  correlationId: string;
}

export async function publishEvent(
  subject: string,
  event: Omit<EventMessage, 'id' | 'timestamp' | 'correlationId'> & { correlationId?: string }
): Promise<void> {
  const nats = await getNatsConnection();
  const fullEvent: EventMessage = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    correlationId: event.correlationId ?? crypto.randomUUID(),
  };
  nats.publish(subject, sc.encode(JSON.stringify(fullEvent)));
}

export async function subscribeToEvents(
  subject: string,
  handler: (event: EventMessage) => Promise<void>
): Promise<Subscription> {
  const nats = await getNatsConnection();
  const sub = nats.subscribe(subject);

  (async () => {
    for await (const msg of sub) {
      try {
        const event = JSON.parse(sc.decode(msg.data)) as EventMessage;
        await handler(event);
      } catch (err) {
        // Structured error logging — do NOT silently swallow
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({
          level: 'error',
          service: 'event-bus',
          subject,
          error: errMsg,
          ts: new Date().toISOString(),
        }));
        // Re-publish to a dead-letter subject so operators can inspect
        try {
          nats.publish(`${subject}.dlq`, sc.encode(JSON.stringify({ error: errMsg, subject, ts: new Date().toISOString() })));
        } catch { /* best-effort DLQ */ }
      }
    }
  })();

  return sub;
}

// ── Predefined subjects ──
export const Subjects = {
  STARTUP_STATUS: (id: string) => `incubator.startups.${id}.status`,
  DATA_CONTRACT_UPDATED: (id: string) => `incubator.data.${id}.updated`,
  PIPELINE_COMPLETE: (id: string) => `incubator.pipelines.${id}.complete`,
  BROADCAST: 'incubator.broadcast',
  MILESTONE: 'incubator.milestones',
  MENTOR_SESSION: 'incubator.mentors.sessions',
  INVESTOR_UPDATE: 'incubator.investors.updates',
} as const;
