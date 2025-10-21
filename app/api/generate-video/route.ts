import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationRequest, ApiResponse, VideoGenerationResponse } from '@/lib/types';
import { requireAuth, checkRateLimit, getRateLimitStatus } from '@/lib/middleware/auth';
import {
  withErrorHandling,
  validateRequest,
  createRateLimitError,
  createValidationError,
} from '@/lib/middleware/errorHandler';
import { getModelRouter } from '@/lib/modelRouter';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/generate-video
 * Generate videos using configured AI models (Replicate/Hugging Face)
 *
 * Body:
 * - prompt: string (required)
 * - modelId: string (required)
 * - inputImage?: string (for image-to-video models)
 * - duration?: number (in seconds, 1-10)
 * - fps?: number (frames per second, 6-30)
 * - resolution?: string ('720p', '1080p', '576x1024')
 * - seed?: number
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth(request);

  // Check rate limit (very strict for video generation due to cost)
  if (!checkRateLimit(user.uid, 5, 60000)) { // 5 requests per minute
    const limitStatus = getRateLimitStatus(user.uid);
    throw createRateLimitError(limitStatus.resetAt || undefined);
  }

  // Parse and validate request body
  const body = await request.json();
  const {
    prompt,
    modelId,
    inputImage,
    duration,
    fps,
    resolution,
    seed,
  } = validateRequest<{
    prompt: string;
    modelId: string;
    inputImage?: string;
    duration?: number;
    fps?: number;
    resolution?: string;
    seed?: number;
  }>(body, ['prompt', 'modelId']);

  // Validate inputs
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw createValidationError('Prompt must be a non-empty string');
  }

  if (typeof modelId !== 'string' || modelId.trim().length === 0) {
    throw createValidationError('Model ID must be a non-empty string');
  }

  // Validate duration
  if (duration !== undefined && (duration < 1 || duration > 10)) {
    throw createValidationError('Duration must be between 1 and 10 seconds');
  }

  // Validate FPS
  if (fps !== undefined && (fps < 6 || fps > 30)) {
    throw createValidationError('FPS must be between 6 and 30');
  }

  // Validate resolution
  const validResolutions = ['720p', '1080p', '576x1024'];
  if (resolution !== undefined && !validResolutions.includes(resolution)) {
    throw createValidationError(`Resolution must be one of: ${validResolutions.join(', ')}`);
  }

  // Prepare generation request
  const generationRequest: VideoGenerationRequest = {
    prompt: prompt.trim(),
    modelId: modelId.trim(),
    inputImage: inputImage?.trim(),
    duration: duration || 5,
    fps: fps || 24,
    resolution: resolution || '720p',
    seed,
  };

  // Use ModelRouter to generate video
  const router = getModelRouter();
  const videoResponse = await router.generateVideo(generationRequest);

  const apiResponse: ApiResponse<VideoGenerationResponse> = {
    success: true,
    data: videoResponse,
  };

  return NextResponse.json(apiResponse);
});

/**
 * Generate video using Replicate API
 */
async function generateVideoReplicate(
  request: VideoGenerationRequest,
  model: any
): Promise<VideoGenerationResponse> {
  const replicateApiKey = process.env.REPLICATE_API_KEY;

  if (!replicateApiKey) {
    throw createValidationError('Replicate API key not configured');
  }

  // Replicate API call
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${replicateApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: model.name, // Model name contains the version
      input: {
        prompt: request.prompt,
        ...(request.inputImage && { image: request.inputImage }),
        ...(request.duration && { duration: request.duration }),
        ...(request.fps && { fps: request.fps }),
        ...(request.seed && { seed: request.seed }),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${error}`);
  }

  const prediction = await response.json();

  // Poll for completion
  let videoUrl = prediction.output;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (!videoUrl && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResponse = await fetch(prediction.urls.get, {
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
      },
    });

    const status = await statusResponse.json();

    if (status.status === 'succeeded') {
      videoUrl = Array.isArray(status.output) ? status.output[0] : status.output;
      break;
    } else if (status.status === 'failed') {
      throw new Error(`Video generation failed: ${status.error}`);
    }

    attempts++;
  }

  if (!videoUrl) {
    throw new Error('Video generation timed out');
  }

  return {
    videoUrl,
    modelId: request.modelId,
    metadata: {
      duration: request.duration || 5,
      fps: request.fps || 24,
      resolution: request.resolution || '720p',
      seed: request.seed,
    },
  };
}

/**
 * Generate video using Hugging Face API
 */
async function generateVideoHuggingFace(
  request: VideoGenerationRequest,
  model: any
): Promise<VideoGenerationResponse> {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!hfApiKey) {
    throw createValidationError('Hugging Face API key not configured');
  }

  const modelUrl = `https://api-inference.huggingface.co/models/${model.name}`;

  const response = await fetch(modelUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: request.prompt,
      ...(request.inputImage && { image: request.inputImage }),
      parameters: {
        ...(request.duration && { num_frames: request.duration * (request.fps || 6) }),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  // HF returns video as blob
  const blob = await response.blob();
  const videoUrl = URL.createObjectURL(blob);

  // Note: In production, you'd want to upload this to Firebase Storage
  // For now, returning the blob URL

  return {
    videoUrl,
    modelId: request.modelId,
    metadata: {
      duration: request.duration || 4,
      fps: request.fps || 6,
      resolution: request.resolution || '576x1024',
      seed: request.seed,
    },
  };
}

/**
 * GET /api/generate-video
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/generate-video',
    method: 'POST',
    description: 'Generate videos using AI models (HunyuanVideo, Mochi, SVD)',
    authentication: 'Required (Bearer token)',
    rateLimit: '5 requests per minute',
    body: {
      prompt: 'string (required) - Description of the video to generate',
      modelId: 'string (required) - ID of the video model to use',
      inputImage: 'string (optional) - Base64 or URL for image-to-video models',
      duration: 'number 1-10 (optional, default: 5) - Video duration in seconds',
      fps: 'number 6-30 (optional, default: 24) - Frames per second',
      resolution: 'string ["720p", "1080p", "576x1024"] (optional, default: "720p")',
      seed: 'number (optional) - Random seed for reproducibility',
    },
    models: {
      textToVideo: ['HunyuanVideo', 'Mochi 1'],
      imageToVideo: ['Stable Video Diffusion XT', 'HunyuanVideo'],
    },
    example: {
      prompt: 'A rabbit hopping through a meadow at sunset, cinematic',
      modelId: 'hunyuan-video-model-id',
      duration: 5,
      fps: 24,
      resolution: '720p',
    },
  });
}

/**
 * OPTIONS /api/generate-video
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
