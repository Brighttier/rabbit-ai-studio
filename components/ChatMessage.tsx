'use client';

import { Message } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={`flex gap-4 p-4 ${
        isUser ? 'bg-accent/50' : isSystem ? 'bg-muted/50' : 'bg-card'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : isSystem
              ? 'bg-muted text-muted-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {isUser ? '👤' : isSystem ? '⚙️' : '🤖'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {isUser ? 'You' : isSystem ? 'System' : 'Assistant'}
            </span>
            {message.metadata?.model && (
              <span className="text-xs text-muted-foreground">
                ({message.metadata.model})
                {message.metadata.finishReason === 'streaming' && (
                  <span className="animate-pulse"> generating...</span>
                )}
                {message.metadata.finishReason === 'connecting' && (
                  <span className="animate-pulse"> connecting...</span>
                )}
                {message.metadata.finishReason === 'error' && (
                  <span className="text-destructive"> failed</span>
                )}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(message.timestamp)}
          </span>
        </div>

        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-foreground">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
            )}
          </div>
        </div>

        {/* Metadata */}
        {message.metadata && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {message.metadata.tokens !== undefined && (
              <span>Tokens: {message.metadata.tokens}</span>
            )}
            {message.metadata.finishReason && (
              <span>Finish: {message.metadata.finishReason}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Streaming message component for real-time updates
 */
interface StreamingMessageProps {
  content: string;
  role?: 'user' | 'assistant' | 'system';
}

export function StreamingMessage({ content, role = 'assistant' }: StreamingMessageProps) {
  return (
    <ChatMessage
      message={{
        id: 'streaming',
        sessionId: 'current',
        role,
        content,
        timestamp: new Date(),
      }}
      isStreaming={true}
    />
  );
}
