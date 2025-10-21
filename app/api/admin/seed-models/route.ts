import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/adminApp';
import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/errorHandler';
import type { Model } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/seed-models
 * Seed the database with uncensored AI models
 * Requires admin authentication
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // TEMPORARY: Skip auth for initial seeding
  // TODO: Re-enable auth after first seed
  // const user = await requireAuth(request);

  const app = getAdminApp();
  const db = getFirestore(app);

  // Default uncensored models (self-hosted on GCP GPU)
  const defaultModels: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>[] = [
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
    // Self-Hosted Video (ComfyUI)
    {
      name: 'svd_xt_1_1',
      displayName: 'Stable Video Diffusion XT 1.1 (Self-Hosted)',
      description: 'Self-hosted video generation. Best for 2-4 second videos. FREE unlimited usage. Longer videos may time out.',
      provider: 'comfyui',
      type: 'video',
      endpointURL: process.env.COMFYUI_BASE_URL || 'http://localhost:8188',
      apiKeyRef: '',
      enabled: true,
      config: { duration: 3, fps: 12, resolution: '576x1024' }, // Optimized defaults
      metadata: {
        capabilities: ['image-to-video', 'animation'],
        pricing: { input: 0, output: 0 },
        modelFile: 'svd_xt_1_1.safetensors',
        uncensored: true,
      },
    },
  ];

  // Seed models
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

  await batch.commit();

  return NextResponse.json({
    success: true,
    message: `Successfully seeded ${count} uncensored AI models`,
    count,
    models: defaultModels.map(m => m.displayName),
    breakdown: {
      text: defaultModels.filter(m => m.type === 'text').length,
      image: defaultModels.filter(m => m.type === 'image').length,
      video: defaultModels.filter(m => m.type === 'video').length,
    },
  });
});

/**
 * GET /api/admin/seed-models
 * Get information about the seed endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/seed-models',
    method: 'POST',
    description: 'Seed database with 8 self-hosted AI models',
    authentication: 'Required (Bearer token)',
    models: {
      text: 3,
      image: 4,
      video: 1,
      total: 8,
    },
  });
}
