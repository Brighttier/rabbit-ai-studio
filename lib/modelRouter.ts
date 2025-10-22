import {
  Model,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
} from './types';
import { AIProvider, ProviderError } from './providers/base';
import { createHuggingFaceProvider } from './providers/huggingface';
import { OllamaProvider } from './providers/ollama';
import { Automatic1111Provider } from './providers/automatic1111';
import { ComfyUIProvider } from './providers/comfyui';
import { getAdminFirestore } from './firebase/adminApp';

/**
 * Model Router
 * Routes requests to appropriate AI provider based on model configuration
 */
export class ModelRouter {
  private providers: Map<string, AIProvider> = new Map();
  private modelCache: Map<string, Model> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  constructor() {
    // Initialize default providers
    this.initializeProviders();
  }

  /**
   * Initialize provider instances
   */
  private initializeProviders() {
    try {
      // Ollama provider (always initialize - uses localhost by default)
      const ollama = new OllamaProvider();
      this.providers.set('ollama', ollama);

      // Hugging Face provider (if API key is available)
      if (process.env.HUGGINGFACE_API_KEY) {
        const huggingface = createHuggingFaceProvider();
        this.providers.set('huggingface', huggingface);
      }

      // Automatic1111 provider (always initialize for self-hosted images)
      const automatic1111 = new Automatic1111Provider();
      this.providers.set('automatic1111', automatic1111);

      // ComfyUI provider (always initialize for self-hosted videos)
      const comfyui = new ComfyUIProvider();
      this.providers.set('comfyui', comfyui);

      // Add more providers here as needed
      // const openrouter = createOpenRouterProvider();
      // this.providers.set('openrouter', openrouter);
    } catch (error) {
      console.error('Failed to initialize providers:', error);
    }
  }

  /**
   * Get model configuration from Firestore
   */
  async getModel(modelId: string): Promise<Model> {
    // Check cache first
    const now = Date.now();
    if (
      this.modelCache.has(modelId) &&
      now - this.lastCacheUpdate < this.cacheExpiry
    ) {
      return this.modelCache.get(modelId)!;
    }

    try {
      const db = getAdminFirestore();
      const modelDoc = await db.collection('models').doc(modelId).get();

      if (!modelDoc.exists) {
        throw new ProviderError(
          `Model not found: ${modelId}`,
          'model-router',
          404
        );
      }

      const model = {
        id: modelDoc.id,
        ...modelDoc.data(),
      } as Model;

      // Check if model is enabled
      if (!model.enabled) {
        throw new ProviderError(
          `Model is disabled: ${modelId}`,
          'model-router',
          403
        );
      }

      // Update cache
      this.modelCache.set(modelId, model);
      this.lastCacheUpdate = now;

      return model;
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Failed to fetch model: ${error.message}`,
        'model-router',
        500
      );
    }
  }

  /**
   * Get provider for a model
   */
  private getProvider(providerName: string): AIProvider {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new ProviderError(
        `Provider not found: ${providerName}`,
        'model-router',
        404
      );
    }

    return provider;
  }

  /**
   * Generate text
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const model = await this.getModel(request.modelId);
    const provider = this.getProvider(model.provider);

    if (!provider.generateText) {
      throw new ProviderError(
        `Provider ${model.provider} does not support text generation`,
        model.provider,
        400
      );
    }

    // Apply model config defaults and use model.name instead of modelId
    const finalRequest: TextGenerationRequest = {
      ...request,
      modelId: model.name, // Use the actual model name, not Firestore doc ID
      temperature: request.temperature ?? model.config?.temperature,
      maxTokens: request.maxTokens ?? model.config?.maxTokens,
      systemPrompt: request.systemPrompt ?? model.config?.defaultSystemPrompt,
    };

    return provider.generateText(finalRequest);
  }

  /**
   * Generate text with streaming
   */
  async *generateTextStream(
    request: TextGenerationRequest
  ): AsyncGenerator<string, void, unknown> {
    const model = await this.getModel(request.modelId);
    const provider = this.getProvider(model.provider);

    if (!provider.generateTextStream) {
      throw new ProviderError(
        `Provider ${model.provider} does not support text streaming`,
        model.provider,
        400
      );
    }

    // Apply model config defaults and use model.name instead of modelId
    const finalRequest: TextGenerationRequest = {
      ...request,
      modelId: model.name, // Use the actual model name, not Firestore doc ID
      temperature: request.temperature ?? model.config?.temperature,
      maxTokens: request.maxTokens ?? model.config?.maxTokens,
      systemPrompt: request.systemPrompt ?? model.config?.defaultSystemPrompt,
    };

    yield* provider.generateTextStream(finalRequest);
  }

  /**
   * Generate image
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const model = await this.getModel(request.modelId);
    const provider = this.getProvider(model.provider);

    if (!provider.generateImage) {
      throw new ProviderError(
        `Provider ${model.provider} does not support image generation`,
        model.provider,
        400
      );
    }

    // Use model.name instead of modelId for provider compatibility
    const finalRequest: ImageGenerationRequest = {
      ...request,
      modelId: model.name, // Use the actual model name, not Firestore doc ID
    };

    return provider.generateImage(finalRequest);
  }

  /**
   * Generate video
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const model = await this.getModel(request.modelId);
    const provider = this.getProvider(model.provider);

    if (!provider.generateVideo) {
      throw new ProviderError(
        `Provider ${model.provider} does not support video generation`,
        model.provider,
        400
      );
    }

    // Apply model config defaults and use model.name instead of modelId
    const finalRequest: VideoGenerationRequest = {
      ...request,
      modelId: model.name, // Use the actual model name, not Firestore doc ID
      duration: request.duration ?? model.config?.duration,
      fps: request.fps ?? model.config?.fps,
      resolution: request.resolution ?? model.config?.resolution,
    };

    return provider.generateVideo(finalRequest);
  }

  /**
   * List all available models
   */
  async listModels(filter?: {
    type?: 'text' | 'image' | 'multimodal';
    provider?: string;
    enabled?: boolean;
  }): Promise<Model[]> {
    try {
      const db = getAdminFirestore();
      let query = db.collection('models') as any;

      // Apply filters
      if (filter?.type) {
        query = query.where('type', '==', filter.type);
      }
      if (filter?.provider) {
        query = query.where('provider', '==', filter.provider);
      }
      if (filter?.enabled !== undefined) {
        query = query.where('enabled', '==', filter.enabled);
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      } as Model));
    } catch (error: any) {
      throw new ProviderError(
        `Failed to list models: ${error.message}`,
        'model-router',
        500
      );
    }
  }

  /**
   * Health check for a specific provider
   */
  async checkProviderHealth(providerName: string): Promise<boolean> {
    try {
      const provider = this.getProvider(providerName);
      return await provider.healthCheck();
    } catch (error) {
      console.error(`Health check failed for ${providerName}:`, error);
      return false;
    }
  }

  /**
   * Health check for all providers
   */
  async checkAllProvidersHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, provider] of Array.from(this.providers.entries())) {
      try {
        results[name] = await provider.healthCheck();
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        results[name] = false;
      }
    }

    return results;
  }

  /**
   * Clear model cache
   */
  clearCache() {
    this.modelCache.clear();
    this.lastCacheUpdate = 0;
  }
}

/**
 * Singleton instance of ModelRouter
 */
let routerInstance: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!routerInstance) {
    routerInstance = new ModelRouter();
  }
  return routerInstance;
}

/**
 * Reset router instance (useful for testing)
 */
export function resetModelRouter() {
  routerInstance = null;
}
