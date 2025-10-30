/**
 * Chat utility functions for message handling and offline support
 */

import { Message } from '@/contexts/ChatContext';

/**
 * Deduplicate messages based on ID and content
 */
export function deduplicateMessages(messages: Message[]): Message[] {
  const seen = new Set<string>();
  const result: Message[] = [];

  for (const msg of messages) {
    // Create a unique key based on ID (if available) or content+time+sender
    const key = msg.id || `${msg.sender}-${msg.content}-${msg.time}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(msg);
    }
  }

  return result;
}

/**
 * Merge messages from different sources (localStorage, API, real-time)
 * Prioritizes server IDs over client-generated IDs
 */
export function mergeMessages(
  localMessages: Message[],
  serverMessages: Message[],
): Message[] {
  const merged = new Map<string, Message>();

  // Add local messages first
  for (const msg of localMessages) {
    const key = msg.id || `${msg.sender}-${msg.content}-${msg.time}`;
    merged.set(key, msg);
  }

  // Add/update with server messages (they take priority)
  for (const msg of serverMessages) {
    // Server messages should have proper IDs
    if (msg.id) {
      merged.set(msg.id, msg);
    } else {
      // Fallback key for server messages without ID
      const key = `${msg.sender}-${msg.content}-${msg.time}`;
      merged.set(key, msg);
    }
  }

  // Convert to array and sort by time
  const result = Array.from(merged.values());

  // Sort chronologically (parse time if needed, or use a more robust approach)
  result.sort((a, b) => {
    // If messages have timestamps in createdAt or similar, use those
    // For now, keep insertion order since we're already in chronological order
    return 0;
  });

  return deduplicateMessages(result);
}

/**
 * Offline message queue item
 */
export interface QueuedMessage {
  id: string;
  chatName: string;
  message: {
    sender: string;
    receiver?: string;
    groupName?: string;
    text: string;
  };
  type: 'private' | 'group';
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'sending' | 'failed';
}

/**
 * Offline message queue manager
 */
export class OfflineMessageQueue {
  private static STORAGE_KEY = 'offline_message_queue';
  private static MAX_RETRIES = 3;

  /**
   * Add a message to the offline queue
   */
  static enqueue(
    chatName: string,
    message: { sender: string; receiver?: string; groupName?: string; text: string },
    type: 'private' | 'group',
  ): string {
    const queue = this.getQueue();
    const queuedMessage: QueuedMessage = {
      id: `offline-${Date.now()}-${Math.random()}`,
      chatName,
      message,
      type,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    queue.push(queuedMessage);
    this.saveQueue(queue);

    return queuedMessage.id;
  }

  /**
   * Get all pending messages from the queue
   */
  static getQueue(): QueuedMessage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to read offline queue:', error);
      return [];
    }
  }

  /**
   * Save the queue to localStorage
   */
  static saveQueue(queue: QueuedMessage[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Remove a message from the queue
   */
  static dequeue(messageId: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter((msg) => msg.id !== messageId);
    this.saveQueue(filtered);
  }

  /**
   * Mark a message as sending
   */
  static markAsSending(messageId: string): void {
    const queue = this.getQueue();
    const message = queue.find((msg) => msg.id === messageId);
    if (message) {
      message.status = 'sending';
      this.saveQueue(queue);
    }
  }

  /**
   * Mark a message as failed and increment retry count
   */
  static markAsFailed(messageId: string): void {
    const queue = this.getQueue();
    const message = queue.find((msg) => msg.id === messageId);
    if (message) {
      message.status = 'failed';
      message.retryCount++;

      // Remove if max retries reached
      if (message.retryCount >= this.MAX_RETRIES) {
        this.dequeue(messageId);
      } else {
        this.saveQueue(queue);
      }
    }
  }

  /**
   * Get pending messages that should be retried
   */
  static getPendingMessages(): QueuedMessage[] {
    const queue = this.getQueue();
    return queue.filter(
      (msg) => msg.status === 'pending' || msg.status === 'failed',
    );
  }

  /**
   * Clear the entire queue
   */
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Store last connection timestamp for a user
 */
export function setLastConnectionTime(userEmail: string): void {
  const key = `last_connection_${userEmail}`;
  localStorage.setItem(key, new Date().toISOString());
}

/**
 * Get last connection timestamp for a user
 */
export function getLastConnectionTime(userEmail: string): Date | null {
  const key = `last_connection_${userEmail}`;
  const stored = localStorage.getItem(key);
  return stored ? new Date(stored) : null;
}
