/**
 * AI Provider Exports
 * Central export file for all AI provider implementations
 */

// Base provider interface and utilities
export { ProviderError, RateLimitError, AuthenticationError, BaseProvider } from './base';
export type { AIProvider, ProviderConfig } from './base';

// LM Studio provider
export {
  LMStudioProvider,
  createLMStudioProvider,
} from './lmstudio';

// Hugging Face provider
export {
  HuggingFaceProvider,
  createHuggingFaceProvider,
} from './huggingface';

// OpenRouter provider
export { OpenRouterProvider } from './openrouter';

// Ollama provider
export { OllamaProvider } from './ollama';

// Future providers can be added here:
// export { VertexAIProvider, createVertexAIProvider } from './vertexai';
