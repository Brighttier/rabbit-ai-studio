/**
 * Update Models Script
 * Updates Firestore with HuggingFace model configurations
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
 * HuggingFace models to add
 */
const hfModels: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Mistral 7B - Fast and Efficient
  {
    name: 'mistralai/Mistral-7B-v0.1',
    displayName: 'Mistral 7B',
    description: 'State-of-the-art 7B parameter model. Excellent performance and speed.',
    provider: 'huggingface',
    type: 'text',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: true,
    config: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      defaultSystemPrompt: 'You are a helpful AI assistant.',
    },
    metadata: {
      contextWindow: 8192,
      capabilities: ['chat', 'instruction-following', 'coding'],
      pricing: {
        input: 0.0001,
        output: 0.0001,
      },
    },
  },

  // Falcon 7B - General Purpose
  {
    name: 'tiiuae/falcon-7b-instruct',
    displayName: 'Falcon 7B Instruct',
    description: 'Instruction-tuned Falcon model. Great for general-purpose use.',
    provider: 'huggingface',
    type: 'text',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: true,
    config: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      defaultSystemPrompt: 'You are a helpful AI assistant.',
    },
    metadata: {
      contextWindow: 4096,
      capabilities: ['chat', 'instruction-following', 'creative-writing'],
      pricing: {
        input: 0.0001,
        output: 0.0001,
      },
    },
  },

  // LLAMA-2 7B - Balanced Performance
  {
    name: 'meta-llama/Llama-2-7b-chat-hf',
    displayName: 'LLAMA-2 7B Chat',
    description: 'Meta\'s LLAMA-2 optimized for chat. Good balance of performance and speed.',
    provider: 'huggingface',
    type: 'text',
    endpointURL: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models',
    apiKeyRef: 'HUGGINGFACE_API_KEY',
    enabled: true,
    config: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      defaultSystemPrompt: 'You are a helpful AI assistant.',
    },
    metadata: {
      contextWindow: 4096,
      capabilities: ['chat', 'instruction-following', 'analysis'],
      pricing: {
        input: 0.0001,
        output: 0.0001,
      },
    },
  },
];

/**
 * Add models to Firestore
 */
async function seedHFModels() {
  console.log('Adding HuggingFace models to Firestore...');

  for (const model of hfModels) {
    const modelRef = db.collection('models').doc(model.name);
    
    try {
      await modelRef.set({
        ...model,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✓ Added model: ${model.displayName}`);
    } catch (error) {
      console.error(`✗ Failed to add model ${model.displayName}:`, error);
    }
  }

  console.log('Done!');
  process.exit(0);
}

// Run the seed script
seedHFModels().catch(error => {
  console.error('Failed to seed models:', error);
  process.exit(1);
});