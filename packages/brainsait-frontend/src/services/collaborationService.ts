import {
  incubatorChatMessages,
  incubatorChatRooms,
  incubatorEmailAutomations,
  type CollaborationMessage,
  type CollaborationRoom,
  type EmailAutomationConfig,
} from '@/lib/incubator/content';

export type { CollaborationMessage, CollaborationRoom, EmailAutomationConfig } from '@/lib/incubator/content';

const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'https://notifications.brainsait.org';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://notifications.brainsait.org/ws';

export interface NotificationHistoryItem {
  id: string;
  channel: string;
  subject: string;
  status: string;
  createdAt: string;
}

async function requestJson<T>(url: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getChatRooms(): Promise<CollaborationRoom[]> {
  return requestJson<CollaborationRoom[]>(`${NOTIFICATION_URL}/api/v1/chat/rooms`, incubatorChatRooms);
}

export async function getChatMessages(roomId: string): Promise<CollaborationMessage[]> {
  const fallback = incubatorChatMessages.filter((message) => message.roomId === roomId);
  return requestJson<CollaborationMessage[]>(`${NOTIFICATION_URL}/api/v1/chat/rooms/${roomId}/messages`, fallback);
}

export async function sendChatMessage(roomId: string, message: string): Promise<CollaborationMessage> {
  const fallback: CollaborationMessage = {
    id: `message-${Date.now()}`,
    roomId,
    senderId: 'current-user',
    senderName: 'You',
    direction: 'outgoing',
    message,
    createdAt: new Date().toISOString(),
  };

  return requestJson<CollaborationMessage>(`${NOTIFICATION_URL}/api/v1/chat/rooms/${roomId}/messages`, fallback, {
    method: 'POST',
    body: JSON.stringify({
      senderId: 'current-user',
      senderName: 'You',
      message,
    }),
  });
}

export async function getEmailAutomations(): Promise<EmailAutomationConfig[]> {
  return requestJson<EmailAutomationConfig[]>(`${NOTIFICATION_URL}/api/v1/email/automations`, incubatorEmailAutomations);
}

export async function saveEmailAutomation(
  automation: Pick<EmailAutomationConfig, 'name' | 'triggerEvent' | 'subject' | 'recipients' | 'templatePreview'>,
): Promise<EmailAutomationConfig> {
  const fallback: EmailAutomationConfig = {
    id: `automation-${Date.now()}`,
    enabled: true,
    ...automation,
  };

  return requestJson<EmailAutomationConfig>(`${NOTIFICATION_URL}/api/v1/email/automations`, fallback, {
    method: 'POST',
    body: JSON.stringify(automation),
  });
}

export async function triggerEmailAutomation(id: string, payload: Record<string, unknown>): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`${NOTIFICATION_URL}/api/v1/email/automations/${id}/trigger`, { status: 'queued' }, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getNotificationHistory(): Promise<NotificationHistoryItem[]> {
  const fallback: NotificationHistoryItem[] = incubatorEmailAutomations.map((automation) => ({
    id: automation.id,
    channel: 'email',
    subject: automation.subject,
    status: automation.enabled ? 'active' : 'paused',
    createdAt: automation.lastTriggeredAt || new Date().toISOString(),
  }));

  return requestJson<NotificationHistoryItem[]>(`${NOTIFICATION_URL}/api/v1/history`, fallback);
}

export function connectToRoom(
  roomId: string,
  handlers: {
    onOpen?: () => void;
    onMessage?: (message: CollaborationMessage) => void;
    onError?: () => void;
    onClose?: () => void;
  },
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const separator = WS_BASE_URL.endsWith('/') ? '' : '/';
  const socket = new WebSocket(`${WS_BASE_URL}${separator}${roomId}`);

  socket.addEventListener('open', () => handlers.onOpen?.());
  socket.addEventListener('close', () => handlers.onClose?.());
  socket.addEventListener('error', () => handlers.onError?.());
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data) as CollaborationMessage | { type?: string; payload?: CollaborationMessage };
      if ('roomId' in data) {
        handlers.onMessage?.(data);
        return;
      }

      if (data.payload && data.type === 'chat.message') {
        handlers.onMessage?.(data.payload);
      }
    } catch {
      handlers.onError?.();
    }
  });

  return () => socket.close();
}