/**
 * Models Utility Library
 * Client-side utilities for working with AI models
 */

import { Model, ModelProvider, ModelType } from './types';

/**
 * Fetch all models from API
 */
export async function fetchModels(params?: {
  type?: ModelType;
  provider?: ModelProvider;
  enabled?: boolean;
  token?: string;
}): Promise<Model[]> {
  const queryParams = new URLSearchParams();

  if (params?.type) queryParams.append('type', params.type);
  if (params?.provider) queryParams.append('provider', params.provider);
  if (params?.enabled !== undefined) queryParams.append('enabled', params.enabled.toString());

  const url = `/api/models${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (params?.token) {
    headers['Authorization'] = `Bearer ${params.token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Create a new model (admin only)
 */
export async function createModel(
  model: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>,
  token: string
): Promise<Model> {
  const response = await fetch('/api/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(model),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create model');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update an existing model (admin only)
 */
export async function updateModel(
  modelId: string,
  updates: Partial<Model>,
  token: string
): Promise<Model> {
  const response = await fetch(`/api/models?id=${modelId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update model');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Delete a model (admin only)
 */
export async function deleteModel(modelId: string, token: string): Promise<void> {
  const response = await fetch(`/api/models?id=${modelId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete model');
  }
}

/**
 * Toggle model enabled status
 */
export async function toggleModelEnabled(
  modelId: string,
  enabled: boolean,
  token: string
): Promise<Model> {
  return updateModel(modelId, { enabled }, token);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: ModelProvider): string {
  const names: Record<ModelProvider, string> = {
    lmstudio: 'LM Studio',
    huggingface: 'Hugging Face',
    openrouter: 'OpenRouter',
    ollama: 'Ollama',
    vertexai: 'Vertex AI',
    custom: 'Custom',
    replicate: 'Replicate',
    automatic1111: 'Automatic1111',
    comfyui: 'ComfyUI',
  };
  return names[provider] || provider;
}

/**
 * Get provider color for badges
 */
export function getProviderColor(provider: ModelProvider): string {
  const colors: Record<ModelProvider, string> = {
    lmstudio: 'bg-blue-500',
    huggingface: 'bg-yellow-500',
    openrouter: 'bg-purple-500',
    ollama: 'bg-green-500',
    vertexai: 'bg-red-500',
    custom: 'bg-gray-500',
    replicate: 'bg-pink-500',
    automatic1111: 'bg-red-600',
    comfyui: 'bg-indigo-500'
  };
  return colors[provider] || 'bg-gray-500';
}

/**
 * Get type display name
 */
export function getTypeDisplayName(type: ModelType): string {
  const names: Record<ModelType, string> = {
    text: 'Text',
    image: 'Image',
    multimodal: 'Multimodal',
    video: 'Video'
  };
  return names[type];
}

/**
 * Get type icon
 */
export function getTypeIcon(type: ModelType): string {
  const icons: Record<ModelType, string> = {
    text: '💬',
    image: '🎨',
    multimodal: '🔀',
    video: '🎬'
  };
  return icons[type];
}

/**
 * Filter models by search query
 */
export function filterModels(models: Model[], query: string): Model[] {
  if (!query.trim()) return models;

  const lowerQuery = query.toLowerCase();

  return models.filter(
    model =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.displayName.toLowerCase().includes(lowerQuery) ||
      model.description?.toLowerCase().includes(lowerQuery) ||
      model.provider.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Group models by provider
 */
export function groupModelsByProvider(models: Model[]): Record<ModelProvider, Model[]> {
  return models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<ModelProvider, Model[]>);
}

/**
 * Group models by type
 */
export function groupModelsByType(models: Model[]): Record<ModelType, Model[]> {
  return models.reduce((acc, model) => {
    if (!acc[model.type]) {
      acc[model.type] = [];
    }
    acc[model.type].push(model);
    return acc;
  }, {} as Record<ModelType, Model[]>);
}

/**
 * Sort models
 */
export function sortModels(
  models: Model[],
  sortBy: 'name' | 'provider' | 'type' | 'createdAt' = 'name',
  order: 'asc' | 'desc' = 'asc'
): Model[] {
  const sorted = [...models].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case 'name':
        aVal = a.displayName.toLowerCase();
        bVal = b.displayName.toLowerCase();
        break;
      case 'provider':
        aVal = a.provider;
        bVal = b.provider;
        break;
      case 'type':
        aVal = a.type;
        bVal = b.type;
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      default:
        aVal = a.displayName;
        bVal = b.displayName;
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Get model capabilities as array
 */
export function getModelCapabilities(model: Model): string[] {
  return model.metadata?.capabilities || [];
}

/**
 * Format model context window
 */
export function formatContextWindow(tokens: number | undefined): string {
  if (!tokens) return 'Unknown';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M tokens`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K tokens`;
  return `${tokens} tokens`;
}

/**
 * Format model pricing
 */
export function formatPricing(pricing: { input: number; output: number } | undefined): string {
  if (!pricing) return 'Free';
  if (pricing.input === 0 && pricing.output === 0) return 'Free';

  const inputPrice = pricing.input.toFixed(4);
  const outputPrice = pricing.output.toFixed(4);

  return `$${inputPrice} / $${outputPrice} per 1K tokens`;
}

/**
 * Validate model configuration
 */
export function validateModel(model: Partial<Model>): string[] {
  const errors: string[] = [];

  if (!model.name?.trim()) {
    errors.push('Model name is required');
  }

  if (!model.displayName?.trim()) {
    errors.push('Display name is required');
  }

  if (!model.provider) {
    errors.push('Provider is required');
  }

  if (!model.type) {
    errors.push('Type is required');
  }

  if (!model.endpointURL?.trim()) {
    errors.push('Endpoint URL is required');
  }

  if (model.endpointURL && !isValidUrl(model.endpointURL)) {
    errors.push('Endpoint URL must be a valid URL');
  }

  if (model.config?.temperature !== undefined) {
    if (model.config.temperature < 0 || model.config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }
  }

  if (model.config?.maxTokens !== undefined) {
    if (model.config.maxTokens < 1) {
      errors.push('Max tokens must be greater than 0');
    }
  }

  return errors;
}

/**
 * Check if URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get default model config by type
 */
export function getDefaultModelConfig(type: ModelType): Model['config'] {
  if (type === 'text') {
    return {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      defaultSystemPrompt: 'You are a helpful AI assistant.',
    };
  }

  return {};
}
