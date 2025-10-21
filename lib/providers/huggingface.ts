import {
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from '@/lib/types';
import { BaseProvider, ProviderConfig, ProviderError } from './base';

/**
 * Hugging Face Provider
 * Integrates with Hugging Face Inference API
 * Supports: Text generation and Image generation
 */
export class HuggingFaceProvider extends BaseProvider {
  name = 'huggingface';
  type = 'multimodal' as const;

  constructor(config?: Partial<ProviderConfig>) {
    const apiUrl = config?.apiUrl || process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models';
    const apiKey = config?.apiKey || process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      throw new ProviderError(
        'Hugging Face API key is required',
        'huggingface',
        401
      );
    }

    super({
      apiUrl,
      apiKey,
      timeout: config?.timeout || 180000, // 3 minutes for image generation
      maxRetries: config?.maxRetries || 3,
    });
  }

  /**
   * Generate text
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const modelId = request.modelId || 'mistralai/Mistral-7B-Instruct-v0.2';
    const url = `${this.config.apiUrl}/${modelId}`;

    // Format prompt with system message if provided
    let fullPrompt = request.prompt;
    if (request.systemPrompt) {
      fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`;
    }

    const body = {
      inputs: fullPrompt,
      parameters: {
        temperature: request.temperature ?? 0.7,
        max_new_tokens: request.maxTokens ?? 1024,
        return_full_text: false,
      },
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
          `Hugging Face API error: ${errorText}`,
          this.name,
          response.status,
          { errorText }
        );
      }

      const data = await response.json();

      // Handle array response (some models return array)
      const result = Array.isArray(data) ? data[0] : data;
      const content = result.generated_text || result[0]?.generated_text || '';

      return {
        content,
        modelId,
        usage: {
          promptTokens: 0, // HF doesn't provide token counts
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: 'stop',
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Hugging Face text generation failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Generate image
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const modelId = request.modelId || 'stabilityai/stable-diffusion-xl-base-1.0';
    const url = `${this.config.apiUrl}/${modelId}`;

    const body = {
      inputs: request.prompt,
      parameters: {
        negative_prompt: request.negativePrompt,
        guidance_scale: request.guidanceScale ?? 7.5,
        num_inference_steps: request.steps ?? 50,
        width: request.width ?? 512,
        height: request.height ?? 512,
      },
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
          `Hugging Face image generation error: ${errorText}`,
          this.name,
          response.status,
          { errorText }
        );
      }

      // Response is a blob (image data)
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${blob.type};base64,${base64}`;

      return {
        images: [dataUrl],
        modelId,
        metadata: {
          width: request.width ?? 512,
          height: request.height ?? 512,
        },
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Hugging Face image generation failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Generate text with streaming (if supported by model)
   */
  async *generateTextStream(request: TextGenerationRequest): AsyncGenerator<string, void, unknown> {
    // Hugging Face Inference API doesn't support streaming by default
    // We'll simulate it by generating the full response and yielding it in chunks
    const response = await this.generateText(request);

    const words = response.content.split(' ');
    for (const word of words) {
      yield word + ' ';
      await this.sleep(50); // Simulate streaming delay
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple model query
      const url = `${this.config.apiUrl}/gpt2`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          inputs: 'test',
          parameters: { max_new_tokens: 5 },
        }),
      });

      return response.ok || response.status === 503; // 503 = model loading
    } catch (error) {
      console.error('Hugging Face health check failed:', error);
      return false;
    }
  }

  /**
   * Wait for model to load (if it's sleeping)
   */
  async waitForModel(modelId: string, maxWaitTime = 60000): Promise<boolean> {
    const startTime = Date.now();
    const url = `${this.config.apiUrl}/${modelId}`;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            inputs: 'test',
          }),
        });

        if (response.ok) {
          return true;
        }

        // Check if model is loading
        const data = await response.json().catch(() => ({}));
        if (data.error && data.error.includes('loading')) {
          const estimatedTime = data.estimated_time || 20;
          await this.sleep(Math.min(estimatedTime * 1000, 5000));
          continue;
        }

        return false;
      } catch (error) {
        await this.sleep(2000);
      }
    }

    return false;
  }
}

/**
 * Factory function to create Hugging Face provider instance
 */
export function createHuggingFaceProvider(config?: Partial<ProviderConfig>): HuggingFaceProvider {
  return new HuggingFaceProvider(config);
}
