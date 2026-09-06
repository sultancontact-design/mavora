/**
 * WebSocket Manager for Mavora
 * Bidirectional real-time communication
 * 
 * @module lib/realtime/websocket
 */

import { NotificationType, NotificationPriority } from '@/lib/realtime-notifications';

// ============================================================
// Types & Interfaces
// ============================================================

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface WebSocketMessage {
  id: string;
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
  senderId?: string;
}

export enum WebSocketMessageType {
  // Connection
  PING = 'ping',
  PONG = 'pong',
  CONNECTION_ACK = 'connection_ack',
  
  // Messaging
  MESSAGE_SEND = 'message_send',
  MESSAGE_RECEIVED = 'message_received',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  
  // Notifications
  NOTIFICATION_PUSH = 'notification_push',
  NOTIFICATION_READ = 'notification_read',
  
  // Presence
  PRESENCE_UPDATE = 'presence_update',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  
  // Listings
  LISTING_UPDATE = 'listing_update',
  BID_PLACED = 'bid_placed',
  OFFER_MADE = 'offer_made',
  
  // System
  ERROR = 'error',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

export interface WebSocketConfig {
  url?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  enableLogging?: boolean;
  authToken?: string;
}

export interface WebSocketEventHandler {
  onConnect?: () => void;
  onDisconnect?: (code: number, reason: string) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

// ============================================================
// WebSocket Client Class
// ============================================================

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private handlers: WebSocketEventHandler = {};
  private status: WebSocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_WS_URL || `wss://${window.location.host}/ws`,
      reconnectAttempts: config.reconnectAttempts || 10,
      reconnectInterval: config.reconnectInterval || 3000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      enableLogging: config.enableLogging || process.env.NODE_ENV === 'development',
      authToken: config.authToken || '',
    };
  }

  // ============================================================
  // Connection Management
  // ============================================================

  /**
   * Connect to WebSocket server
   */
  connect(authToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (authToken) {
        this.config.authToken = authToken;
      }

      this.setStatus('connecting');

      try {
        const url = new URL(this.config.url);
        if (this.config.authToken) {
          url.searchParams.set('token', this.config.authToken);
        }

        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          this.log('Connected to WebSocket server');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Send queued messages
          this.flushMessageQueue();
          
          this.handlers.onConnect?.();
          resolve();
        };

        this.ws.onclose = (event) => {
          this.log(`Disconnected: code=${event.code}, reason=${event.reason}`);
          this.stopHeartbeat();
          this.setStatus('disconnected');
          
          this.handlers.onDisconnect?.(event.code, event.reason);
          
          // Attempt reconnection
          if (this.reconnectAttempts < this.config.reconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (event) => {
          this.log('WebSocket error');
          this.setStatus('error');
          this.handlers.onError?.(event);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(code: number = 1000, reason: string = 'Client disconnect'): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }

    this.setStatus('disconnected');
    this.reconnectAttempts = this.config.reconnectAttempts; // Prevent auto-reconnect
  }

  // ============================================================
  // Message Handling
  // ============================================================

  /**
   * Send a message through WebSocket
   */
  send(type: WebSocketMessageType, payload: any, waitForAck: boolean = false): Promise<void> {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: new Date(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log(`Sent: ${type}`, payload);
      return Promise.resolve();
    } else {
      // Queue message for later
      if (waitForAck) {
        return new Promise((resolve, reject) => {
          message.payload._callback = { resolve, reject };
          this.messageQueue.push(message);
        });
      }
      this.messageQueue.push(message);
      return Promise.resolve();
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      this.log(`Received: ${message.type}`, message.payload);

      // Handle pings
      if (message.type === WebSocketMessageType.PING) {
        this.send(WebSocketMessageType.PONG, {});
        return;
      }

      // Handle connection ack
      if (message.type === WebSocketMessageType.CONNECTION_ACK) {
        this.handlers.onConnect?.();
        return;
      }

      // Call general handler
      this.handlers.onMessage?.(message);

      // Call type-specific listeners
      const typeListeners = this.listeners.get(message.type);
      if (typeListeners) {
        for (const listener of typeListeners) {
          listener(message.payload);
        }
      }

    } catch (error) {
      this.error('Failed to parse message:', error);
    }
  }

  /**
   * Register listener for specific message type
   */
  on(type: WebSocketMessageType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Remove all listeners for a type
  */
  off(type: WebSocketMessageType): void {
    this.listeners.delete(type);
  }

  // ============================================================
  // Event Handlers
  // ============================================================

  /**
   * Register event handlers
   */
  onEvent(handlers: WebSocketEventHandler): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // ============================================================
  // Convenience Methods
  // ============================================================

  /**
   * Send a chat message
   */
  async sendMessage(conversationId: string, content: string, attachments?: string[]): Promise<void> {
    await this.send(WebSocketMessageType.MESSAGE_SEND, {
      conversation_id: conversationId,
      content,
      attachments: attachments || [],
    }, true);
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    const type = isTyping 
      ? WebSocketMessageType.TYPING_START 
      : WebSocketMessageType.TYPING_STOP;
    
    this.send(type, { conversation_id: conversationId });
  }

  /**
   * Update presence status
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    this.send(WebSocketMessageType.PRESENCE_UPDATE, { status });
  }

  /**
   * Mark notification as read via WebSocket
   */
  markNotificationRead(notificationId: string): void {
    this.send(WebSocketMessageType.NOTIFICATION_READ, { notification_id: notificationId });
  }

  // ============================================================
  // Private Methods
  // ============================================================

  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.handlers.onStatusChange?.(status);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send(WebSocketMessageType.PING, {});
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    
    this.log(`Reconnecting in ${this.config.reconnectInterval}ms (attempt ${this.reconnectAttempts})`);
    this.handlers.onReconnect?.(this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval * Math.min(this.reconnectAttempts, 5)); // Exponential backoff capped at 5x
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(message));
      this.log(`Sent queued: ${message.type}`);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[WS]', ...args);
    }
  }

  private error(...args: any[]): void {
    console.error('[WS]', ...args);
  }

  // ============================================================
  // Getters
  // ============================================================

  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// Export class for testing
export { WebSocketManager };

export default wsManager;
