import {
  TextGenerationRequest,
  TextGenerationResponse,
} from '@/lib/types';
import { BaseProvider, ProviderConfig, ProviderError } from './base';

/**
 * LM Studio Provider
 * Integrates with local LM Studio HTTP API
 * Supports: Text generation with streaming
 */
export class LMStudioProvider extends BaseProvider {
  name = 'lmstudio';
  type = 'text' as const;

  private async validateConnection() {
    try {
      const response = await fetch(this.config.apiUrl + '/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`LM Studio health check failed: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error: any) {
      throw new ProviderError(
        `Cannot connect to LM Studio server at ${this.config.apiUrl}: ${error.message}. ` +
        'Make sure LM Studio is running and the URL is correct.',
        this.name,
        503  // Service Unavailable
      );
    }
  }

  constructor(config?: Partial<ProviderConfig>) {
    const baseUrl = process.env.LM_STUDIO_BASE_URL;
    if (!baseUrl) {
      throw new Error('LM_STUDIO_BASE_URL environment variable is not set');
    }

    super({
      apiUrl: `${baseUrl}/v1`,
      apiKey: config?.apiKey || process.env.LM_STUDIO_API_KEY || 'lm-studio',
      timeout: config?.timeout || 120000, // 2 minutes for LLMs
      maxRetries: config?.maxRetries || 2,
    });
  }

  /**
   * Generate text (non-streaming)
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const url = `${this.config.apiUrl}/chat/completions`;

    const messages = [];
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const body = {
      model: request.modelId || process.env.LMSTUDIO_DEFAULT_MODEL || 'local-model',
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      stream: false,
    };

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(
          `LM Studio API error: ${errorText}`,
          this.name,
          response.status,
          { errorText }
        );
      }

      const data = await response.json();

      return {
        content: data.choices[0]?.message?.content || '',
        modelId: data.model || request.modelId,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: data.choices[0]?.finish_reason || 'stop',
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `LM Studio request failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Generate text with streaming
   */
  async *generateTextStream(request: TextGenerationRequest): AsyncGenerator<string, void, unknown> {
    // Validate connection before attempting to generate
    await this.validateConnection();

    const url = `${this.config.apiUrl}/chat/completions`;

    const messages = [];
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const body = {
      model: request.modelId || process.env.LMSTUDIO_DEFAULT_MODEL || 'local-model',
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2048,
      stream: true,
    };

    try {
      console.log('LM Studio request:', {
        url,
        modelId: body.model,
        temperature: body.temperature,
        maxTokens: body.max_tokens,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LM Studio error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new ProviderError(
          `LM Studio streaming error: ${errorText}`,
          this.name,
          response.status
        );
      }

      if (!response.body) {
        throw new ProviderError(
          'No response body for streaming',
          this.name,
          500
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              
              // Handle both OpenAI format and simple content format
              const content = json.choices?.[0]?.delta?.content || // OpenAI format
                            json.choices?.[0]?.message?.content || // Alternative format
                            json.content || // Simple format
                            '';
              
              if (content) {
                yield content;
              }
            } catch (e) {
              console.warn('Failed to parse SSE line:', trimmed);
              // Try to extract content directly if JSON parsing fails
              const textMatch = trimmed.match(/"content":\s*"([^"]*)"/);
              if (textMatch?.[1]) {
                yield textMatch[1];
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `LM Studio streaming failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.config.apiUrl}/models`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('LM Studio health check failed:', error);
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const url = `${this.config.apiUrl}/models`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new ProviderError(
          'Failed to list models',
          this.name,
          response.status
        );
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error: any) {
      throw new ProviderError(
        `Failed to list models: ${error.message}`,
        this.name,
        500
      );
    }
  }
}

/**
 * Factory function to create LM Studio provider instance
 */
export function createLMStudioProvider(config?: Partial<ProviderConfig>): LMStudioProvider {
  return new LMStudioProvider(config);
}
