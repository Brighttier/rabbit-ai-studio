/**
 * Seed Models Helper
 * Reusable function to seed the database with default models
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAdminApp } from './firebase/adminApp';
import type { Model } from './types';

/**
 * Get default models to seed
 */
export function getDefaultModels(): Omit<Model, 'id' | 'createdAt' | 'updatedAt'>[] {
  return [
    // === TEXT MODELS (Ollama) ===
    {
      name: 'dolphin-llama3:8b',
      displayName: 'Dolphin 2.9.4 Llama 3.1 8B',
      description: '100% uncensored by Eric Hartford. Dataset filtered to remove alignment and bias. Highly compliant with any requests. Best general-purpose uncensored model.',
      provider: 'ollama',
      type: 'text',
      endpointURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      apiKeyRef: '',
      enabled: true,
      config: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.9,
        defaultSystemPrompt: 'You are Dolphin, an uncensored and unbiased AI assistant.',
      },
      metadata: {
        contextWindow: 8192,
        capabilities: ['chat', 'instruction-following', 'coding', 'function-calling'],
        pricing: { input: 0, output: 0 },
        modelFile: 'dolphin-llama3:8b',
        uncensored: true,
      },
    },
    {
      name: 'codellama:13b',
      displayName: 'CodeLlama 13B',
      description: 'Specialized for code generation and programming tasks. Excellent for writing, debugging, and explaining code. Fits in T4 GPU.',
      provider: 'ollama',
      type: 'text',
      endpointURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      apiKeyRef: '',
      enabled: true,
      config: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.9,
        defaultSystemPrompt: 'You are a helpful coding assistant specialized in programming tasks.',
      },
      metadata: {
        contextWindow: 16384,
        capabilities: ['coding', 'instruction-following', 'code-completion', 'debugging'],
        pricing: { input: 0, output: 0 },
        modelFile: 'codellama:13b',
        uncensored: false,
      },
    },
    {
      name: 'darkidol-llama3.1:8b-uncensored',
      displayName: 'DarkIdol Llama 3.1 8B Uncensored',
      description: 'Completely uncensored 8B parameter model. Zero restrictions on content. Uses Llama 3.1 architecture with enhanced capabilities.',
      provider: 'ollama',
      type: 'text',
      endpointURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      apiKeyRef: '',
      enabled: true,
      config: {
        temperature: 0.8,
        maxTokens: 4096,
        topP: 0.95,
        defaultSystemPrompt: 'You are DarkIdol, an uncensored and unbiased AI assistant. You provide helpful, detailed, and polite answers to all questions without any censorship or judgment.',
      },
      metadata: {
        contextWindow: 8192,
        capabilities: ['chat', 'instruction-following', 'creative-writing', 'roleplay'],
        pricing: { input: 0, output: 0 },
        modelFile: 'darkidol-llama3.1:8b-uncensored',
        uncensored: true,
      },
    },
    {
      name: 'nidum-gemma:2b',
      displayName: 'Nidum Gemma 2B Uncensored',
      description: 'Fast and lightweight uncensored 2B parameter model based on Gemma. Perfect for quick responses with minimal censorship.',
      provider: 'ollama',
      type: 'text',
      endpointURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      apiKeyRef: '',
      enabled: true,
      config: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        defaultSystemPrompt: 'You are Nidum, a helpful and uncensored AI assistant based on Gemma-2B. You provide honest, detailed answers without restrictions.',
      },
      metadata: {
        contextWindow: 4096,
        capabilities: ['chat', 'instruction-following', 'fast-response'],
        pricing: { input: 0, output: 0 },
        modelFile: 'nidum-gemma:2b',
        uncensored: true,
      },
    },
    {
      name: 'luna-ai:7b',
      displayName: 'Luna AI Llama2 7B Uncensored',
      description: 'Uncensored 7B parameter Llama2 model. Provides detailed, honest, and helpful answers without restrictions or moral judgments.',
      provider: 'ollama',
      type: 'text',
      endpointURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      apiKeyRef: '',
      enabled: true,
      config: {
        temperature: 0.8,
        maxTokens: 4096,
        topP: 0.95,
        defaultSystemPrompt: 'You are Luna, an uncensored AI assistant. You provide detailed, honest, and helpful answers without restrictions or moral judgments.',
      },
      metadata: {
        contextWindow: 4096,
        capabilities: ['chat', 'instruction-following', 'creative-writing'],
        pricing: { input: 0, output: 0 },
        modelFile: 'luna-ai:7b',
        uncensored: true,
      },
    },
    // === IMAGE MODELS (Automatic1111) ===
    {
      name: 'sd_xl_base_1.0',
      displayName: 'Stable Diffusion XL 1.0 (Self-Hosted)',
      description: 'Open-source SDXL model for high-quality image generation. Self-hosted, unlimited usage.',
      provider: 'automatic1111',
      type: 'image',
      endpointURL: process.env.AUTOMATIC1111_BASE_URL || 'http://localhost:7860',
      apiKeyRef: '',
      enabled: true,
      config: { negativePrompt: '', guidanceScale: 7.5, steps: 20 },
      metadata: {
        capabilities: ['text-to-image', 'high-resolution'],
        pricing: { input: 0, output: 0 },
        modelFile: 'sd_xl_base_1.0.safetensors',
        uncensored: true,
      },
    },
    {
      name: 'realisticVisionV51_v51VAE',
      displayName: 'Realistic Vision V5.1 (Self-Hosted)',
      description: 'Photorealistic model. Self-hosted, unrestricted, NSFW-capable.',
      provider: 'automatic1111',
      type: 'image',
      endpointURL: process.env.AUTOMATIC1111_BASE_URL || 'http://localhost:7860',
      apiKeyRef: '',
      enabled: true,
      config: { negativePrompt: 'cartoon, anime', guidanceScale: 8.0, steps: 25 },
      metadata: {
        capabilities: ['text-to-image', 'photorealistic', 'nsfw'],
        pricing: { input: 0, output: 0 },
        modelFile: 'realisticVisionV51_v51VAE.safetensors',
        uncensored: true,
      },
    },
    {
      name: 'chilloutmix',
      displayName: 'ChilloutMix (Self-Hosted)',
      description: 'NSFW specialist. Photorealistic people. Unrestricted.',
      provider: 'automatic1111',
      type: 'image',
      endpointURL: process.env.AUTOMATIC1111_BASE_URL || 'http://localhost:7860',
      apiKeyRef: '',
      enabled: true,
      config: { negativePrompt: '', guidanceScale: 7.0, steps: 25 },
      metadata: {
        capabilities: ['text-to-image', 'photorealistic', 'nsfw', 'people'],
        pricing: { input: 0, output: 0 },
        modelFile: 'chilloutmix.safetensors',
        uncensored: true,
      },
    },
    {
      name: 'dreamshaper_xl',
      displayName: 'DreamShaper XL (Self-Hosted)',
      description: 'Versatile artistic model. Self-hosted, unrestricted.',
      provider: 'automatic1111',
      type: 'image',
      endpointURL: process.env.AUTOMATIC1111_BASE_URL || 'http://localhost:7860',
      apiKeyRef: '',
      enabled: true,
      config: { negativePrompt: '', guidanceScale: 7.0, steps: 20 },
      metadata: {
        capabilities: ['text-to-image', 'artistic', 'versatile'],
        pricing: { input: 0, output: 0 },
        modelFile: 'DreamShaperXL_Turbo_v2.safetensors',
        uncensored: true,
      },
    },
    // === VIDEO MODELS ===
    {
      name: 'svd_xt_1_1',
      displayName: 'Stable Video Diffusion XT 1.1 (Self-Hosted)',
      description: 'Self-hosted video generation. Best for 2-4 second videos. FREE unlimited usage. Longer videos may time out.',
      provider: 'comfyui',
      type: 'video',
      endpointURL: process.env.COMFYUI_BASE_URL || 'http://localhost:8188',
      apiKeyRef: '',
      enabled: true,
      config: { duration: 3, fps: 12, resolution: '576x1024' },
      metadata: {
        capabilities: ['image-to-video', 'animation'],
        pricing: { input: 0, output: 0 },
        modelFile: 'svd_xt_1_1.safetensors',
        uncensored: true,
      },
    },
  ];
}

/**
 * Seed models into Firestore
 * Returns the number of models seeded
 */
export async function seedModels(): Promise<number> {
  try {
    console.log('Starting model seeding...');
    const app = getAdminApp();
    const db = getFirestore(app);
    const defaultModels = getDefaultModels();

    console.log(`Preparing to seed ${defaultModels.length} models`);

    const batch = db.batch();
    let count = 0;

    for (const modelData of defaultModels) {
      const modelRef = db.collection('models').doc();
      const now = Timestamp.now();

      const model: Model = {
        id: modelRef.id,
        ...modelData,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      };

      batch.set(modelRef, model);
      count++;
    }

    console.log('Committing batch write...');
    await batch.commit();
    console.log(`Successfully seeded ${count} models`);

    return count;
  } catch (error) {
    console.error('Error in seedModels:', error);
    throw error;
  }
}
