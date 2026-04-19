/**
 * BrainSAIT Queue Consumers
 * Central queue processing for all platform events
 */
export interface Env {
  DB: D1Database;
  DEAD_LETTER: KVNamespace;
  NOTIFICATION_QUEUE: Queue;
  EVENT_QUEUE: Queue;
}

interface QueueMessage {
  id?: string;
  type?: string;
  source?: string;
  target?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export default {
  // ── Events Queue ──
  async events(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await env.DB.prepare(
          'INSERT INTO events (id, type, source, data, processed_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          msg.body.id || crypto.randomUUID(),
          msg.body.type || 'unknown',
          msg.body.source || 'unknown',
          JSON.stringify(msg.body),
          new Date().toISOString()
        ).run();
        msg.ack();
      } catch (err) {
        await handleRetry(msg, env, err as Error);
      }
    }
  },

  // ── GitHub Events Queue ──
  async githubEvents(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const event = msg.body;
        // Process GitHub-specific events
        if (event.type === 'issues' || event.type === 'pull_request') {
          await env.NOTIFICATION_QUEUE.send({
            type: `github.${event.type}`,
            source: 'queue-consumer',
            data: event.data,
          });
        }
        msg.ack();
      } catch (err) {
        await handleRetry(msg, env, err as Error);
      }
    }
  },

  // ── Pipeline Events Queue ──
  async pipelineEvents(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const event = msg.body;
        // Route pipeline events to notifications
        await env.NOTIFICATION_QUEUE.send({
          type: `pipeline.${event.type}`,
          source: 'queue-consumer',
          data: event.data,
        });
        msg.ack();
      } catch (err) {
        await handleRetry(msg, env, err as Error);
      }
    }
  },

  // ── Data Sync Queue ──
  async dataSync(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const event = msg.body;
        console.log(`[data-sync] Processing: ${event.type} from ${event.source}`);
        // Data sync logic handled by data-hub-proxy
        msg.ack();
      } catch (err) {
        await handleRetry(msg, env, err as Error);
      }
    }
  },

  // ── Inference Queue ──
  async inference(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        console.log(`[inference] Processing batch job: ${msg.body.id}`);
        // ML inference handled by ml-inference worker
        msg.ack();
      } catch (err) {
        await handleRetry(msg, env, err as Error);
      }
    }
  },

  // ── Training Queue ──
  async training(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        console.log(`[training] Processing training job: ${msg.body.id}`);
        msg.ack();
      } catch (err) {
        await handleRetry(msg, env, err as Error);
      }
    }
  },

  // ── Notification Retries ──
  async notificationRetries(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await env.NOTIFICATION_QUEUE.send(msg.body);
        msg.ack();
      } catch (err) {
        // Final failure — store in dead letter
        await env.DEAD_LETTER.put(
          `dl:${Date.now()}:${msg.body.id || 'unknown'}`,
          JSON.stringify({ original: msg.body, error: (err as Error).message, failedAt: new Date().toISOString() }),
          { expirationTtl: 604800 }
        );
        msg.ack();
      }
    }
  },
};

async function handleRetry(msg: Message<QueueMessage>, env: Env, error: Error): Promise<void> {
  if (msg.attempts >= 3) {
    await env.DEAD_LETTER.put(
      `dl:${Date.now()}:${msg.body.id || 'unknown'}`,
      JSON.stringify({ original: msg.body, error: error.message, attempts: msg.attempts, failedAt: new Date().toISOString() }),
      { expirationTtl: 604800 }
    );
    msg.ack();
  } else {
    msg.retry();
  }
}
