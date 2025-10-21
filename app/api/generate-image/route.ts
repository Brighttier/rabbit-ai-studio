import { NextRequest, NextResponse } from 'next/server';
import { getModelRouter } from '@/lib/modelRouter';
import { ImageGenerationRequest, ApiResponse, ImageGenerationResponse } from '@/lib/types';
import { requireAuth, checkRateLimit, getRateLimitStatus } from '@/lib/middleware/auth';
import {
  withErrorHandling,
  validateRequest,
  createRateLimitError,
  createValidationError,
} from '@/lib/middleware/errorHandler';
import { getAdminStorage } from '@/lib/firebase/adminApp';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/generate-image
 * Generate images using configured AI models
 *
 * Body:
 * - prompt: string (required)
 * - modelId: string (required)
 * - negativePrompt?: string
 * - width?: number
 * - height?: number
 * - numImages?: number
 * - guidanceScale?: number
 * - steps?: number
 * - seed?: number
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth(request);

  // Check rate limit (stricter for image generation)
  if (!checkRateLimit(user.uid, 20, 60000)) { // 20 requests per minute
    const limitStatus = getRateLimitStatus(user.uid);
    throw createRateLimitError(limitStatus.resetAt || undefined);
  }

  // Parse and validate request body
  const body = await request.json();
  const {
    prompt,
    modelId,
    negativePrompt,
    width,
    height,
    numImages,
    guidanceScale,
    steps,
    seed,
  } = validateRequest<{
    prompt: string;
    modelId: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    numImages?: number;
    guidanceScale?: number;
    steps?: number;
    seed?: number;
  }>(body, ['prompt', 'modelId']);

  // Validate inputs
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw createValidationError('Prompt must be a non-empty string');
  }

  if (typeof modelId !== 'string' || modelId.trim().length === 0) {
    throw createValidationError('Model ID must be a non-empty string');
  }

  // Validate dimensions
  const validDimensions = [256, 512, 768, 1024];
  if (width !== undefined && !validDimensions.includes(width)) {
    throw createValidationError(`Width must be one of: ${validDimensions.join(', ')}`);
  }

  if (height !== undefined && !validDimensions.includes(height)) {
    throw createValidationError(`Height must be one of: ${validDimensions.join(', ')}`);
  }

  if (numImages !== undefined && (numImages < 1 || numImages > 4)) {
    throw createValidationError('Number of images must be between 1 and 4');
  }

  if (guidanceScale !== undefined && (guidanceScale < 1 || guidanceScale > 20)) {
    throw createValidationError('Guidance scale must be between 1 and 20');
  }

  if (steps !== undefined && (steps < 1 || steps > 100)) {
    throw createValidationError('Steps must be between 1 and 100');
  }

  // Prepare generation request
  const generationRequest: ImageGenerationRequest = {
    prompt: prompt.trim(),
    modelId: modelId.trim(),
    negativePrompt: negativePrompt?.trim(),
    width: width || 512,
    height: height || 512,
    numImages: numImages || 1,
    guidanceScale: guidanceScale || 7.5,
    steps: steps || 50,
    seed,
  };

  const router = getModelRouter();

  // Generate image
  const response = await router.generateImage(generationRequest);

  // Optional: Upload images to Firebase Storage
  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      const uploadedUrls = await uploadImagesToStorage(
        response.images,
        user.uid,
        modelId
      );
      response.images = uploadedUrls;
    } catch (error) {
      console.error('Failed to upload images to storage:', error);
      // Continue with base64 images if upload fails
    }
  }

  const apiResponse: ApiResponse<ImageGenerationResponse> = {
    success: true,
    data: response,
  };

  return NextResponse.json(apiResponse);
});

/**
 * Upload images to Firebase Storage
 */
async function uploadImagesToStorage(
  images: string[],
  userId: string,
  modelId: string
): Promise<string[]> {
  const storage = getAdminStorage();
  const bucket = storage.bucket();
  const urls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Extract base64 data
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If not base64, assume it's already a URL
      urls.push(image);
      continue;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename
    const timestamp = Date.now();
    const filename = `generated/${userId}/${modelId}/${timestamp}-${i}.png`;

    // Upload to storage
    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          userId,
          modelId,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible (adjust based on your security requirements)
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    urls.push(publicUrl);
  }

  return urls;
}

/**
 * GET /api/generate-image
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/generate-image',
    method: 'POST',
    description: 'Generate images using AI models',
    authentication: 'Required (Bearer token)',
    body: {
      prompt: 'string (required)',
      modelId: 'string (required)',
      negativePrompt: 'string (optional)',
      width: 'number [256, 512, 768, 1024] (optional, default: 512)',
      height: 'number [256, 512, 768, 1024] (optional, default: 512)',
      numImages: 'number 1-4 (optional, default: 1)',
      guidanceScale: 'number 1-20 (optional, default: 7.5)',
      steps: 'number 1-100 (optional, default: 50)',
      seed: 'number (optional)',
    },
    example: {
      prompt: 'A cute rabbit in a meadow, digital art',
      modelId: 'huggingface-sdxl',
      negativePrompt: 'blurry, low quality',
      width: 512,
      height: 512,
      guidanceScale: 7.5,
      steps: 50,
    },
  });
}

/**
 * OPTIONS /api/generate-image
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
