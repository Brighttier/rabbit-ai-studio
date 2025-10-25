import {
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
} from '@/lib/types';

/**
 * Base Provider Interface
 * All AI model providers must implement this interface
 */
export interface AIProvider {
  name: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'multimodal';

  // Text generation
  generateText?(
    request: TextGenerationRequest
  ): Promise<TextGenerationResponse>;

  // Streaming text generation
  generateTextStream?(
    request: TextGenerationRequest
  ): AsyncGenerator<string, void, unknown>;

  // Image generation
  generateImage?(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse>;

  // Video generation
  generateVideo?(
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResponse>;

  // Health check
  healthCheck(): Promise<boolean>;
}

/**
 * Provider Configuration
 */
export interface ProviderConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Base Provider Error
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends ProviderError {
  constructor(provider: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${provider}`,
      provider,
      429,
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ProviderError {
  constructor(provider: string) {
    super(
      `Authentication failed for ${provider}`,
      provider,
      401
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Base Provider Class
 * Provides common functionality for all providers
 */
export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  abstract type: 'text' | 'image' | 'video' | 'audio' | 'multimodal';

  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      timeout: 60000, // 60 seconds default
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = this.config.maxRetries || 3
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;

          if (i < retries - 1) {
            await this.sleep(waitTime);
            continue;
          }

          throw new RateLimitError(this.name, parseInt(retryAfter || '0'));
        }

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(this.name);
        }

        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          if (i < retries - 1) {
            await this.sleep(Math.pow(2, i) * 1000);
            continue;
          }
          throw new ProviderError(
            `Request timeout for ${this.name}`,
            this.name,
            408
          );
        }

        if (i === retries - 1) {
          throw error;
        }

        await this.sleep(Math.pow(2, i) * 1000);
      }
    }

    throw new ProviderError(
      `Failed after ${retries} retries`,
      this.name
    );
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check - must be implemented by subclass
   */
  abstract healthCheck(): Promise<boolean>;
}
