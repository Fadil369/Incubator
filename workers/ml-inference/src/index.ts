/**
 * BrainSAIT ML Inference Worker
 * Workers AI inference, embeddings, RAG, batch processing
 */
export interface Env {
  MODEL_CACHE: KVNamespace;
  INFERENCE_CACHE: KVNamespace;
  MODEL_STORE: R2Bucket;
  PREDICTION_LOGS: R2Bucket;
  BATCH_QUEUE: Queue;
  EMBEDDINGS: VectorizeIndex;
  AI: Ai;
  ML_ANALYTICS: AnalyticsEngineDataset;
  DEFAULT_MODEL: string;
  EMBEDDING_MODEL: string;
}

interface InferenceRequest {
  model?: string;
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  startup?: string;
  session_id?: string;
}

interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'ml-inference' });
    }

    // ── Chat Completion ──
    if (url.pathname === '/v1/chat/completions' && request.method === 'POST') {
      return handleChatCompletion(request, env);
    }

    // ── Text Generation ──
    if (url.pathname === '/v1/completions' && request.method === 'POST') {
      return handleCompletion(request, env);
    }

    // ── Embeddings ──
    if (url.pathname === '/v1/embeddings' && request.method === 'POST') {
      return handleEmbeddings(request, env);
    }

    // ── RAG Query ──
    if (url.pathname === '/v1/rag/query' && request.method === 'POST') {
      return handleRAG(request, env);
    }

    // ── Vector Search ──
    if (url.pathname === '/v1/vectors/search' && request.method === 'POST') {
      return handleVectorSearch(request, env);
    }

    // ── Batch Inference ──
    if (url.pathname === '/v1/batch' && request.method === 'POST') {
      return handleBatch(request, env);
    }

    // ── Model Registry ──
    if (url.pathname === '/v1/models' && request.method === 'GET') {
      return listModels(env);
    }

    // ── Inference Analytics ──
    if (url.pathname === '/v1/analytics' && request.method === 'GET') {
      return getAnalytics(url, env);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const job = msg.body as { id: string; request: InferenceRequest };
      try {
        const result = await runInference(job.request, env);
        // Store result in R2
        await env.PREDICTION_LOGS.put(`batch/${job.id}.json`, JSON.stringify(result));
        msg.ack();
      } catch (err) {
        msg.retry();
      }
    }
  },
};

async function handleChatCompletion(request: Request, env: Env): Promise<Response> {
  const body = await request.json<InferenceRequest>();

  // Check cache
  const cacheKey = `chat:${hashRequest(body)}`;
  const cached = await env.INFERENCE_CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const model = body.model || env.DEFAULT_MODEL;
  const messages = body.messages || [{ role: 'user', content: body.prompt || '' }];

  const result = await env.AI.run(model as keyof AiModels, {
    messages: messages as AiMessage[],
    max_tokens: body.max_tokens || 2048,
    temperature: body.temperature || 0.7,
    stream: body.stream || false,
  });

  // Cache for 5 minutes
  await env.INFERENCE_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });

  // Log to R2
  const inferenceId = crypto.randomUUID();
  await env.PREDICTION_LOGS.put(`chat/${inferenceId}.json`, JSON.stringify({
    id: inferenceId,
    model,
    messages,
    result,
    timestamp: new Date().toISOString(),
    startup: body.startup,
  }));

  // Analytics
  env.ML_ANALYTICS.writeDataPoint({
    blobs: ['chat', model, body.startup || 'unknown'],
    doubles: [Date.now(), messages.length],
    indexes: [inferenceId],
  });

  return Response.json(result);
}

async function handleCompletion(request: Request, env: Env): Promise<Response> {
  const body = await request.json<InferenceRequest>();
  const model = body.model || env.DEFAULT_MODEL;

  const result = await env.AI.run(model as keyof AiModels, {
    prompt: body.prompt || '',
    max_tokens: body.max_tokens || 2048,
    temperature: body.temperature || 0.7,
  });

  return Response.json(result);
}

async function handleEmbeddings(request: Request, env: Env): Promise<Response> {
  const body = await request.json<EmbeddingRequest>();
  const model = body.model || env.EMBEDDING_MODEL;
  const texts = Array.isArray(body.text) ? body.text : [body.text];

  const results = [];
  for (const text of texts) {
    const embedding = await env.AI.run(model as keyof AiModels, { text });
    results.push({ text, embedding });
  }

  return Response.json({ data: results, model });
}

async function handleRAG(request: Request, env: Env): Promise<Response> {
  const { query, top_k = 5, model } = await request.json() as { query: string; top_k?: number; model?: string };

  // Generate query embedding
  const queryEmbedding = await env.AI.run(env.EMBEDDING_MODEL as keyof AiModels, { text: query });
  const vector = (queryEmbedding as { data: number[][] }).data[0];

  // Search vector index
  const matches = await env.EMBEDDINGS.query(vector, { topK: top_k });

  // Build context from matches
  const context = matches.matches
    .map((m) => (m.metadata as Record<string, string>)?.text || '')
    .filter(Boolean)
    .join('\n---\n');

  // Generate response with context
  const result = await env.AI.run((model || env.DEFAULT_MODEL) as keyof AiModels, {
    messages: [
      { role: 'system', content: `You are a healthcare AI assistant. Use the following context to answer the question. If the context doesn't contain relevant information, say so.\n\nContext:\n${context}` },
      { role: 'user', content: query },
    ],
  });

  return Response.json({
    answer: result,
    sources: matches.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata })),
  });
}

async function handleVectorSearch(request: Request, env: Env): Promise<Response> {
  const { vector, top_k = 10, filter } = await request.json() as { vector: number[]; top_k?: number; filter?: Record<string, string> };

  const matches = await env.EMBEDDINGS.query(vector, { topK: top_k, filter });
  return Response.json({ matches: matches.matches });
}

async function handleBatch(request: Request, env: Env): Promise<Response> {
  const { requests } = await request.json() as { requests: InferenceRequest[] };

  if (requests.length > 100) {
    return Response.json({ error: 'Max 100 requests per batch' }, { status: 400 });
  }

  const jobs = requests.map((req) => ({
    id: crypto.randomUUID(),
    request: req,
  }));

  for (const job of jobs) {
    await env.BATCH_QUEUE.send(job);
  }

  return Response.json({
    status: 'queued',
    job_count: jobs.length,
    job_ids: jobs.map((j) => j.id),
  });
}

async function listModels(env: Env): Promise<Response> {
  return Response.json({
    models: [
      { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', type: 'chat' },
      { id: '@cf/mistral/mistral-7b-instruct-v0.2', name: 'Mistral 7B', type: 'chat' },
      { id: '@cf/qwen/qwen1.5-14b-chat-awq', name: 'Qwen 1.5 14B', type: 'chat' },
      { id: '@cf/baai/bge-base-en-v1.5', name: 'BGE Base EN', type: 'embedding' },
      { id: '@cf/meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', type: 'chat' },
    ],
  });
}

async function getAnalytics(url: URL, env: Env): Promise<Response> {
  const period = url.searchParams.get('period') || '24h';
  return Response.json({
    period,
    total_inferences: 0, // Would query Analytics Engine
    total_tokens: 0,
    avg_latency_ms: 0,
    models_used: [],
  });
}

async function runInference(request: InferenceRequest, env: Env): Promise<unknown> {
  const model = request.model || env.DEFAULT_MODEL;
  if (request.messages) {
    return env.AI.run(model as keyof AiModels, { messages: request.messages as AiMessage[], max_tokens: request.max_tokens || 2048 });
  }
  return env.AI.run(model as keyof AiModels, { prompt: request.prompt || '', max_tokens: request.max_tokens || 2048 });
}

function hashRequest(body: Record<string, unknown>): string {
  return JSON.stringify(body).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0).toString(16);
}
