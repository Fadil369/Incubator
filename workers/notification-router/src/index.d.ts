/**
 * BrainSAIT Notification Router
 * Routes events to Slack, Discord, Email, WebSocket
 */
export interface Env {
    CHANNEL_CONFIG: KVNamespace;
    NOTIFICATION_LOG: KVNamespace;
    DB: D1Database;
    RETRY_QUEUE: Queue;
    WS_SESSIONS: DurableObjectNamespace;
}
interface NotificationEvent {
    type: string;
    source: string;
    target?: string;
    data?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    channels?: string[];
}
declare const _default: {
    fetch(request: Request, env: Env): Promise<Response>;
    queue(batch: MessageBatch<NotificationEvent>, env: Env): Promise<void>;
};
export default _default;
export declare class WebSocketSession {
    private state;
    sessions: Set<WebSocket>;
    constructor(state: DurableObjectState);
    fetch(request: Request): Promise<Response>;
}
//# sourceMappingURL=index.d.ts.map