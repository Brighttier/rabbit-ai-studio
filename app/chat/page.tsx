'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, Model } from '@/lib/types';
import { ChatMessage, StreamingMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ChatSettings, ChatConfig } from '@/components/ChatSettings';
import { Button } from '@/components/ui/button';
import {
  createSession,
  generateSessionTitle,
  saveCurrentSessionId,
  getCurrentSessionId,
  saveChatConfig,
  getChatConfig,
} from '@/lib/sessions';

import { useAuth } from '@/lib/firebase/auth';

export default function ChatPage() {
  const { user, token, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Chat configuration
  const [config, setConfig] = useState<ChatConfig>({
    modelId: '',
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 2048,
    stream: true,
  });

  // Initialize
  useEffect(() => {
    if (!user) {
      setError('Please sign in to use the chat.');
      return;
    }

    // Load saved config
    const savedConfig = getChatConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }

    // Load or create session
    const currentSessionId = getCurrentSessionId();
    if (currentSessionId) {
      setSessionId(currentSessionId);
      // TODO: Load messages from Firestore
    }
  }, []);

  // Save config when it changes
  useEffect(() => {
    if (config.modelId) {
      saveChatConfig(config);
    }
  }, [config]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSendMessage(content: string) {
    if (!token || !config.modelId) {
      setError('Please select a model first');
      return;
    }

    // Create session if needed
    let currentSessionId = sessionId;
    if (!currentSessionId && config.model) {
      try {
        const session = await createSession(
          'mock-user-id',
          config.modelId,
          config.model.displayName,
          token
        );
        currentSessionId = session.id;
        setSessionId(session.id);
        saveCurrentSessionId(session.id);
      } catch (err: any) {
        setError(`Failed to create session: ${err.message}`);
        return;
      }
    }

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sessionId: currentSessionId || 'temp',
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setError(null);

    // Generate response
    if (config.stream) {
      await handleStreamingResponse(content);
    } else {
      await handleNonStreamingResponse(content);
    }
  }

  async function handleStreamingResponse(userPrompt: string) {
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    // Add an initial message showing we're connecting
    const pendingMessage: Message = {
      id: `msg-${Date.now()}`,
      sessionId: sessionId || 'temp',
      role: 'assistant',
      content: 'Connecting to AI model...',
      timestamp: new Date(),
      metadata: {
        model: config.model?.displayName || config.modelId,
        finishReason: 'connecting'
      },
    };
    setMessages(prev => [...prev, pendingMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: userPrompt,
          modelId: config.modelId,
          systemPrompt: config.systemPrompt || undefined,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || 
          `HTTP error! status: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // Add an initial empty assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        sessionId: sessionId || 'temp',
        role: 'assistant',
        content: '...',  // Show initial state
        timestamp: new Date(),
        metadata: {
          model: config.model?.displayName || config.modelId,
          finishReason: 'streaming'
        },
      };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              console.log('Received SSE data:', json);

              // Handle both content and error messages
              if (json.error) {
                throw new Error(json.error);
              }

              // Extract content from various possible formats
              const content = json.content ?? 
                            json.choices?.[0]?.delta?.content ??
                            json.choices?.[0]?.message?.content ?? '';
              
              if (content !== undefined) {
                fullContent += content;
                console.log('Updated content:', fullContent);
                
                // Update both streaming content and message
                setStreamingContent(fullContent);
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    return [...prev.slice(0, -1), {
                      ...lastMessage,
                      content: fullContent || '...',  // Show placeholder if empty
                      metadata: {
                        ...lastMessage.metadata,
                        finishReason: fullContent ? undefined : 'streaming'
                      }
                    }];
                  }
                  return prev;
                });
              }
            } catch (e) {
              console.error('Failed to parse or handle SSE:', e);
            }
          }
        }
      }

      // Final message content already updated via streaming
      setStreamingContent('');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted');
        setError('Generation stopped by user');
      } else {
        const errorMessage = err.message || 'An unknown error occurred';
        console.error('Streaming error:', err);
        
        // Show a more user-friendly error message
        let userError = errorMessage;
        if (errorMessage.includes('Cannot connect to LM Studio')) {
          userError = 'Unable to connect to the AI model. Please make sure LM Studio is running and try again.';
        } else if (errorMessage.includes('fetch failed')) {
          userError = 'Connection to the AI model failed. Please check if LM Studio is running and accessible.';
        }
        
        setError(userError);
      }
      
      // Update the message to show the error state
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant') {
          return [...prev.slice(0, -1), {
            ...lastMessage,
            content: 'Failed to generate response',
            metadata: {
              ...lastMessage.metadata,
              finishReason: 'error'
            }
          }];
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  async function handleNonStreamingResponse(userPrompt: string) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: userPrompt,
          modelId: config.modelId,
          systemPrompt: config.systemPrompt || undefined,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || 
          `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Generation failed');
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        sessionId: sessionId || 'temp',
        role: 'assistant',
        content: result.data.content,
        timestamp: new Date(),
        metadata: {
          model: config.model?.displayName,
          tokens: result.data.usage?.totalTokens,
          finishReason: result.data.finishReason,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(`Generation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleStopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  function handleNewChat() {
    setMessages([]);
    setStreamingContent('');
    setSessionId(null);
    saveCurrentSessionId('');
    setError(null);
  }

  function handleClearChat() {
    if (confirm('Are you sure you want to clear this chat?')) {
      setMessages([]);
      setStreamingContent('');
      setError(null);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Chat</h1>
            <p className="text-sm text-muted-foreground">
              {messages.length > 0
                ? generateSessionTitle(messages)
                : 'Start a new conversation'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              New Chat
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearChat}>
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/image'}>
              Images
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/video'}>
              Video
            </Button>
            {userRole === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/models'}>
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <ChatSettings
        config={config}
        onChange={setConfig}
        token={token || undefined}
        disabled={isLoading || isStreaming}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to Rabbit AI Studio
              </h2>
              <p className="text-muted-foreground max-w-md">
                Select a model above and start chatting with uncensored AI models.
              </p>
            </div>
          )}

          {/* Message List */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Streaming Message */}
          {isStreaming && streamingContent && (
            <StreamingMessage content={streamingContent} />
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Generating response...</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-4 my-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading || isStreaming || !config.modelId}
        placeholder={
          !config.modelId
            ? 'Please select a model first...'
            : isStreaming
            ? 'Generating response...'
            : 'Type your message...'
        }
      />

      {/* Stop Button (shown during streaming) */}
      {isStreaming && (
        <div className="border-t border-border bg-card p-2">
          <div className="max-w-4xl mx-auto text-center">
            <Button variant="destructive" size="sm" onClick={handleStopGeneration}>
              Stop Generating
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
