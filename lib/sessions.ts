/**
 * Session Management Utilities
 * Client-side utilities for managing chat sessions
 */

import { Session, Message } from './types';

/**
 * Fetch user's sessions
 */
export async function fetchSessions(token: string): Promise<Session[]> {
  // TODO: Implement API endpoint for fetching sessions
  // For now, return empty array
  console.warn('fetchSessions: API endpoint not yet implemented');
  return [];
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  modelId: string,
  modelName: string,
  token: string
): Promise<Session> {
  // TODO: Implement API endpoint for creating sessions
  const session: Session = {
    id: `session-${Date.now()}`,
    userId,
    type: 'chat',
    title: 'New Chat',
    modelId,
    modelName,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      messageCount: 0,
      totalTokens: 0,
    },
  };

  console.warn('createSession: Using mock session, API endpoint not yet implemented');
  return session;
}

/**
 * Update session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Session>,
  token: string
): Promise<Session> {
  // TODO: Implement API endpoint
  console.warn('updateSession: API endpoint not yet implemented');
  throw new Error('Not implemented');
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string, token: string): Promise<void> {
  // TODO: Implement API endpoint
  console.warn('deleteSession: API endpoint not yet implemented');
}

/**
 * Fetch messages for a session
 */
export async function fetchMessages(sessionId: string, token: string): Promise<Message[]> {
  // TODO: Implement API endpoint
  console.warn('fetchMessages: API endpoint not yet implemented');
  return [];
}

/**
 * Save message to session
 */
export async function saveMessage(
  sessionId: string,
  message: Omit<Message, 'id'>,
  token: string
): Promise<Message> {
  // TODO: Implement API endpoint
  const savedMessage: Message = {
    ...message,
    id: `msg-${Date.now()}`,
  };

  console.warn('saveMessage: Using mock message, API endpoint not yet implemented');
  return savedMessage;
}

/**
 * Generate a session title from messages
 */
export function generateSessionTitle(messages: Message[]): string {
  if (messages.length === 0) return 'New Chat';

  // Use first user message as title
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  // Truncate to first 50 characters
  const title = firstUserMessage.content.slice(0, 50);
  return title.length < firstUserMessage.content.length ? `${title}...` : title;
}

/**
 * Calculate total tokens from messages
 */
export function calculateTotalTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    return total + (msg.metadata?.tokens || 0);
  }, 0);
}

/**
 * Format session date for display
 */
export function formatSessionDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Local storage keys
 */
const STORAGE_KEYS = {
  CURRENT_SESSION: 'rabbit-current-session',
  CHAT_CONFIG: 'rabbit-chat-config',
} as const;

/**
 * Save current session ID to local storage
 */
export function saveCurrentSessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
  }
}

/**
 * Get current session ID from local storage
 */
export function getCurrentSessionId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  }
  return null;
}

/**
 * Clear current session ID
 */
export function clearCurrentSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
}

/**
 * Save chat config to local storage
 */
export function saveChatConfig(config: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CHAT_CONFIG, JSON.stringify(config));
  }
}

/**
 * Get chat config from local storage
 */
export function getChatConfig(): any | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_CONFIG);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse chat config:', e);
        return null;
      }
    }
  }
  return null;
}
