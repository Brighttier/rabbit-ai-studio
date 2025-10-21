/**
 * Automatic1111 Provider
 * Provides access to self-hosted Stable Diffusion via Automatic1111 WebUI
 * https://github.com/AUTOMATIC1111/stable-diffusion-webui
 */

import { BaseProvider, ProviderError } from './base';
import { ImageGenerationRequest, ImageGenerationResponse } from '../types';

export class Automatic1111Provider extends BaseProvider {
  name = 'automatic1111';
  type = 'image' as const;
  private baseURL: string;

  constructor() {
    const baseURL = process.env.AUTOMATIC1111_BASE_URL || 'http://localhost:7860';
    super({ apiUrl: baseURL });
    this.baseURL = baseURL;
  }

  /**
   * Generate image using Automatic1111's API
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const {
      prompt,
      modelId,
      negativePrompt = '',
      width = 512,
      height = 512,
      numImages = 1,
      guidanceScale = 7.5,
      steps = 20,
      seed,
    } = request;

    try {
      // Switch to the requested model if modelId is provided
      if (modelId) {
        await this.switchModel(modelId);
      }

      const response = await this.fetchWithRetry(`${this.baseURL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          width,
          height,
          n_iter: numImages,
          steps,
          cfg_scale: guidanceScale,
          seed: seed || -1, // -1 means random
          sampler_name: 'DPM++ 2M Karras',
          save_images: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(
          `Automatic1111 API error: ${response.status} - ${errorText}`,
          this.name,
          response.status
        );
      }

      const data = await response.json();

      // Convert base64 images to data URLs
      const images = data.images.map((img: string) => `data:image/png;base64,${img}`);

      return {
        images,
        modelId: request.modelId,
        metadata: {
          width,
          height,
          steps,
          seed: data.info?.seed,
          guidanceScale,
          stylePreset: request.stylePreset,
        },
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Automatic1111 request failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Health check for Automatic1111 server
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/sdapi/v1/sd-models`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Automatic1111 health check failed:', error);
      return false;
    }
  }

  /**
   * List available models from Automatic1111
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/sdapi/v1/sd-models`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new ProviderError(
          'Failed to list models',
          this.name,
          response.status
        );
      }

      const data = await response.json();
      return data.map((model: any) => model.model_name || model.title);
    } catch (error: any) {
      throw new ProviderError(
        `Failed to list models: ${error.message}`,
        this.name,
        500
      );
    }
  }

  /**
   * Get current Automatic1111 options
   */
  async getOptions(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/sdapi/v1/options`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new ProviderError(
          'Failed to get options',
          this.name,
          response.status
        );
      }

      return await response.json();
    } catch (error: any) {
      throw new ProviderError(
        `Failed to get options: ${error.message}`,
        this.name,
        500
      );
    }
  }

  /**
   * Set Automatic1111 options (e.g., switch model)
   */
  async setOptions(options: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/sdapi/v1/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new ProviderError(
          'Failed to set options',
          this.name,
          response.status
        );
      }
    } catch (error: any) {
      throw new ProviderError(
        `Failed to set options: ${error.message}`,
        this.name,
        500
      );
    }
  }

  /**
   * Switch to a specific model
   * Model name should match the filename without extension (e.g., "realisticVisionV51_v51VAE" or "v1-5-pruned-emaonly")
   */
  async switchModel(modelName: string): Promise<void> {
    try {
      // Get list of available models to find the exact model name
      const models = await this.listModels();

      // Try to find a matching model (case-insensitive, partial match)
      const matchingModel = models.find(m =>
        m.toLowerCase().includes(modelName.toLowerCase()) ||
        modelName.toLowerCase().includes(m.toLowerCase())
      );

      if (!matchingModel) {
        console.warn(`Model "${modelName}" not found in Automatic1111, using current model`);
        return;
      }

      // Get current options to check if we're already using this model
      const currentOptions = await this.getOptions();
      if (currentOptions.sd_model_checkpoint === matchingModel) {
        console.log(`Already using model: ${matchingModel}`);
        return;
      }

      // Switch to the model
      console.log(`Switching Automatic1111 to model: ${matchingModel}`);
      await this.setOptions({ sd_model_checkpoint: matchingModel });

      // Wait a bit for the model to load
      await this.sleep(2000);
    } catch (error: any) {
      console.error(`Failed to switch model: ${error.message}`);
      // Don't throw - just use whatever model is currently loaded
    }
  }
}
