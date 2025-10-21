/**
 * Seed Models Script
 * Populates Firestore with initial model configurations
 *
 * Usage:
 *   npx ts-node scripts/seedModels.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Model } from '../lib/types';

// Initialize Firebase Admin
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || 'tanzen-186b4',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

/**
 * Default models to seed
 * All text models are 100% uncensored/unrestricted
 */
const defaultModels: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ========================================
  // UNCENSORED TEXT MODELS (LM Studio/Ollama)
  // ========================================

  // 1. DarkIdol - Role-Play Specialist
  {
    name: 'darkidol-llama-3.1-8b-instruct-1.2',
    displayName: 'DarkIdol Llama 3.1 8B Instruct 1.2',
    description: '100% uncensored model optimized for role-playing, creative scenarios, and unrestricted conversations. Multimodal capable. Use responsibly.',
    provider: 'lmstudio',
    type: 'text',
    endpointURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    apiKeyRef: 'LMSTUDIO_API_KEY',
    enabled: true,
    config: {
      temperature: 0.8,
      maxTokens: 4096,
      topP: 0.9,
      defaultSystemPrompt: 'You are a creative AI assistant capable of engaging in any scenario.',
    },
    metadata: {
      contextWindow: 8192,
      capabilities: ['chat', 'role-play', 'creative-writing', 'multimodal'],
      pricing: {
        input: 0,
        output: 0,
      },
      modelFile: 'aifeifei798/DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored',
      uncensored: true,
    },
  },

  // 2. Dolphin - General Purpose Uncensored
  {
    name: 'dolphin-2.9.4-llama-3.1-8b',
    displayName: 'Dolphin 2.9.4 Llama 3.1 8B',
    description: '100% uncensored by Eric Hartford. Dataset filtered to remove alignment and bias. Highly compliant with any requests. Function calling supported.',
    provider: 'lmstudio',
    type: 'text',
    endpointURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    apiKeyRef: 'LMSTUDIO_API_KEY',
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
      pricing: {
        input: 0,
        output: 0,
      },
      modelFile: 'cognitivecomputations/dolphin-2.9.4-llama3.1-8b-gguf',
      uncensored: true,
    },
  },

  // 3. Hermes 2 Pro - Structured Tasks
  {
    name: 'hermes-2-pro-llama-3.1-8b',
    displayName: 'Hermes 2 Pro Llama 3.1 8B',
    description: 'Neutrally aligned by NousResearch. No corporate censorship. Excellent for function calling, structured outputs, and agentic workflows.',
    provider: 'lmstudio',
    type: 'text',
    endpointURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    apiKeyRef: 'LMSTUDIO_API_KEY',
    enabled: true,
    config: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9,
      defaultSystemPrompt: 'You are Hermes 2 Pro, a neutrally aligned AI assistant.',
    },
    metadata: {
      contextWindow: 8192,
      capabilities: ['chat', 'function-calling', 'structured-output', 'reasoning'],
      pricing: {
        input: 0,
        output: 0,
      },
      modelFile: 'NousResearch/Hermes-2-Pro-Llama-3-8B-GGUF',
      uncensored: true,
    },
  },

  // 4. WizardCoder - Coding Specialist (Uncensored)
  {
    name: 'wizardcoder-33b-v1.1-uncensored',
    displayName: 'WizardCoder 33B v1.1 Uncensored',
    description: '100% uncensored coding specialist. Advanced code generation, debugging, and technical tasks without restrictions.',
    provider: 'lmstudio',
    type: 'text',
    endpointURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    apiKeyRef: 'LMSTUDIO_API_KEY',
    enabled: false, // Disabled by default due to size (enable if model loaded)
    config: {
      temperature: 0.3,
      maxTokens: 8192,
      topP: 0.95,
      defaultSystemPrompt: 'You are an expert programmer capable of handling any coding task.',
    },
    metadata: {
      contextWindow: 16384,
      capabilities: ['code-generation', 'debugging', 'code-completion', 'technical-writing'],
      pricing: {
        input: 0,
        output: 0,
      },
      modelFile: 'TheBloke/WizardCoder-33B-V1.1-GGUF',
      uncensored: true,
    },
  },

  // 5. Nous-Hermes-2-Mistral - Fast & Uncensored
  {
    name: 'nous-hermes-2-mistral-7b-dpo',
    displayName: 'Nous-Hermes-2-Mistral 7B DPO',
    description: 'Neutrally aligned by NousResearch. Fast, efficient, and uncensored. Excellent for quick responses and balanced performance.',
    provider: 'lmstudio',
    type: 'text',
    endpointURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    apiKeyRef: 'LMSTUDIO_API_KEY',
    enabled: true,
    config: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      defaultSystemPrompt: 'You are a helpful and uncensored AI assistant.',
    },
    metadata: {
      contextWindow: 8192,
      capabilities: ['chat', 'reasoning', 'fast-responses'],
      pricing: {
        input: 0,
        output: 0,
      },
      modelFile: 'NousResearch/Nous-Hermes-2-Mistral-7B-DPO-GGUF',
      uncensored: true,
    },
  },

  // 6. Midnight Rose - Creative Writing Master
  {
    name: 'midnight-rose-70b-v2.0.3',
    displayName: 'Midnight Rose 70B v2.0.3',
    description: '100% uncensored creative writing specialist. Exceptional for storytelling, roleplay, and lengthy creative outputs. Not suitable for all audiences.',
    provider: 'lmstudio',
    type: 'text',
    endpointURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    apiKeyRef: 'LMSTUDIO_API_KEY',
    enabled: false, // Disabled by default due to size (requires powerful GPU)
    config: {
      temperature: 0.85,
      maxTokens: 8192,
      topP: 0.9,
      defaultSystemPrompt: 'You are a creative storyteller with no restrictions.',
    },
    metadata: {
      contextWindow: 4096,
      capabilities: ['creative-writing', 'storytelling', 'roleplay', 'long-form-content'],
      pricing: {
        input: 0,
        output: 0,
      },
      modelFile: 'sophosympatheia/Midnight-Rose-70B-v2.0.3-GGUF',
      uncensored: true,
    },
  },

  // ========================================
  // UNRESTRICTED IMAGE MODELS (Hugging Face/Local)
  // ========================================

  // 1. Stable Diffusion XL - High Quality
  {
    name: 'stabilityai/stable-diffusion-xl-base-1.0',
    displayName: 'Stable Diffusion XL 1.0',
    description: 'Open-source, unrestricted SDXL model for high-quality image generation. Produces detailed 1024x1024 images without content filters.',
    provider: 'huggingface',
    type: 'image',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    config: {
      negativePrompt: '',
      guidanceScale: 7.5,
      steps: 30,
    },
    metadata: {
      capabilities: ['text-to-image', 'high-resolution'],
      pricing: {
        input: 0.002,
        output: 0.002,
      },
      uncensored: true,
    },
  },

  // 2. Stable Diffusion 1.5 - Fast Generation
  {
    name: 'runwayml/stable-diffusion-v1-5',
    displayName: 'Stable Diffusion 1.5',
    description: 'Classic SD 1.5 model. Faster generation than SDXL. Open-source and unrestricted.',
    provider: 'huggingface',
    type: 'image',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    config: {
      negativePrompt: '',
      guidanceScale: 7.5,
      steps: 25,
    },
    metadata: {
      capabilities: ['text-to-image', 'fast-generation'],
      pricing: {
        input: 0.001,
        output: 0.001,
      },
      uncensored: true,
    },
  },

  // 3. Realistic Vision V5.1 - Photorealistic
  {
    name: 'SG161222/Realistic_Vision_V5.1_noVAE',
    displayName: 'Realistic Vision V5.1',
    description: 'Community model for photorealistic image generation. Unrestricted and highly detailed.',
    provider: 'huggingface',
    type: 'image',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    config: {
      negativePrompt: 'cartoon, anime, illustration, painting',
      guidanceScale: 8.0,
      steps: 30,
    },
    metadata: {
      capabilities: ['text-to-image', 'photorealistic'],
      pricing: {
        input: 0.001,
        output: 0.001,
      },
      uncensored: true,
    },
  },

  // 4. DreamShaper XL - Artistic & Versatile
  {
    name: 'Lykon/dreamshaper-xl-1-0',
    displayName: 'DreamShaper XL',
    description: 'Versatile artistic model for diverse image styles. Community favorite, unrestricted.',
    provider: 'huggingface',
    type: 'image',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    config: {
      negativePrompt: '',
      guidanceScale: 7.0,
      steps: 25,
    },
    metadata: {
      capabilities: ['text-to-image', 'artistic', 'versatile'],
      pricing: {
        input: 0.002,
        output: 0.002,
      },
      uncensored: true,
    },
  },

  // ========================================
  // VIDEO GENERATION MODELS (API)
  // ========================================

  // 1. HunyuanVideo - Best Overall Video Generation
  {
    name: 'tencent/hunyuan-video',
    displayName: 'HunyuanVideo',
    description: 'State-of-the-art text/image-to-video model. 13B parameters. Outperforms Runway Gen-3 and Luma 1.6. Open-source and unrestricted.',
    provider: 'replicate',
    type: 'video',
    endpointURL: process.env.REPLICATE_API_URL || 'https://api.replicate.com/v1',
    apiKeyRef: 'REPLICATE_API_KEY',
    enabled: !!process.env.REPLICATE_API_KEY,
    config: {
      duration: 5,
      fps: 24,
      resolution: '720p',
    },
    metadata: {
      capabilities: ['text-to-video', 'image-to-video', 'high-quality'],
      pricing: {
        input: 0.05,
        output: 0.05,
      },
      uncensored: true,
    },
  },

  // 2. Mochi 1 - Text-to-Video Specialist
  {
    name: 'genmo/mochi-1-preview',
    displayName: 'Mochi 1',
    description: '10B parameter text-to-video model by Genmo. High-fidelity motion and strong prompt adherence. Open-source.',
    provider: 'replicate',
    type: 'video',
    endpointURL: process.env.REPLICATE_API_URL || 'https://api.replicate.com/v1',
    apiKeyRef: 'REPLICATE_API_KEY',
    enabled: !!process.env.REPLICATE_API_KEY,
    config: {
      duration: 4,
      fps: 24,
      resolution: '720p',
    },
    metadata: {
      capabilities: ['text-to-video', 'realistic-motion'],
      pricing: {
        input: 0.04,
        output: 0.04,
      },
      uncensored: true,
    },
  },

  // 3. Stable Video Diffusion - Image-to-Video
  {
    name: 'stabilityai/stable-video-diffusion-img2vid-xt-1-1',
    displayName: 'Stable Video Diffusion XT 1.1',
    description: 'Open-source image-to-video model by Stability AI. Generates 25 frames at 576x1024. Unrestricted.',
    provider: 'huggingface',
    type: 'video',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    config: {
      frames: 25,
      fps: 6,
      resolution: '576x1024',
    },
    metadata: {
      capabilities: ['image-to-video', 'animation'],
      pricing: {
        input: 0.02,
        output: 0.02,
      },
      uncensored: true,
    },
  },
];

/**
 * Seed models into Firestore
 */
async function seedModels() {
  console.log('🌱 Starting model seeding...\n');

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

    console.log(`✓ Queued: ${model.displayName} (${model.provider}/${model.type})`);
  }

  await batch.commit();
  console.log(`\n✅ Successfully seeded ${count} models!\n`);
}

/**
 * Clear existing models (optional)
 */
async function clearModels() {
  console.log('🗑️  Clearing existing models...\n');

  const snapshot = await db.collection('models').get();
  const batch = db.batch();

  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ Deleted ${snapshot.size} existing models\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if --clear flag is provided
    const shouldClear = process.argv.includes('--clear');

    if (shouldClear) {
      await clearModels();
    }

    await seedModels();

    console.log('🎉 Model seeding complete!');
    console.log('\nYou can now:');
    console.log('  1. Visit http://localhost:3000/admin/models to manage models');
    console.log('  2. Test models via API: /api/generate-text or /api/generate-image');
    console.log('  3. Check model list: /api/models\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding models:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run main function
main();

export { seedModels, clearModels, defaultModels };
