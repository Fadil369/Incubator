/**
 * BrainSAIT Data Hub Proxy
 * GraphQL proxy with caching, contract validation, subscription management
 */
export interface Env {
    SCHEMA_CACHE: KVNamespace;
    CONTRACT_REGISTRY: KVNamespace;
    SUBSCRIPTION_MAP: KVNamespace;
    DB: D1Database;
    DATA_STORE: R2Bucket;
    CONTRACT_FILES: R2Bucket;
    DATA_SYNC_QUEUE: Queue;
    NOTIFICATION_QUEUE: Queue;
    DATA_ANALYTICS: AnalyticsEngineDataset;
    HASURA_URL: string;
    CACHE_TTL: string;
}
declare const _default: {
    fetch(request: Request, env: Env): Promise<Response>;
    queue(batch: MessageBatch<unknown>, env: Env): Promise<void>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map