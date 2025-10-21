/**
 * OpenRouter Provider
 * Provides access to multiple AI models through OpenRouter's API
 * https://openrouter.ai/
 */

import { BaseProvider, ProviderConfig } from './base';
import { TextGenerationRequest, TextGenerationResponse } from '../types';

export class OpenRouterProvider extends BaseProvider {
  name = 'openrouter';
  type = 'text' as const;
  private apiKey: string;
  private baseURL: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    const config: ProviderConfig = {
      apiUrl: 'https://openrouter.ai/api/v1',
      apiKey,
    };
    super(config);
    this.apiKey = apiKey;
    this.baseURL = config.apiUrl;

    if (!this.apiKey) {
      console.warn('OPENROUTER_API_KEY not set in environment variables');
    }
  }

  /**
   * Generate text using OpenRouter's API
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const { prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 } = request;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.fetchWithRetry(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Rabbit AI Studio',
      },
      body: JSON.stringify({
        model: request.modelId || 'openai/gpt-3.5-turbo',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      modelId: request.modelId,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Generate text with streaming support
   */
  async *generateTextStream(request: TextGenerationRequest): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const { prompt, systemPrompt, temperature = 0.7, maxTokens = 2048 } = request;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.fetchWithRetry(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Rabbit AI Studio',
      },
      body: JSON.stringify({
        model: request.modelId || 'openai/gpt-3.5-turbo',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
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
              const content = json.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Health check for OpenRouter API
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('OpenRouter health check failed:', error);
      return false;
    }
  }

  /**
   * List available models from OpenRouter
   */
  async listModels(): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to list OpenRouter models:', error);
      return [];
    }
  }
}
