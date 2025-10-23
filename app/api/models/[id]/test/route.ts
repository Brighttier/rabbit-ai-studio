import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getModelRouter } from '@/lib/modelRouter';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/models/[id]/test
 * Test a model with a sample prompt
 *
 * Body:
 * - prompt?: string (optional, uses default test prompt if not provided)
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Require authentication
  await requireAuth(request);

  const modelId = params.id;
  const body = await request.json().catch(() => ({}));
  const prompt = body.prompt || 'Hello! Please respond with a brief greeting to confirm you are working.';

  const router = getModelRouter();

  try {
    // Get model to determine its type
    const model = await router.getModel(modelId);

    let testResult: any;
    let error: string | null = null;
    let success = false;

    // Test based on model type
    if (model.type === 'text' || model.type === 'multimodal') {
      try {
        const response = await router.generateText({
          prompt,
          modelId,
          temperature: 0.7,
          maxTokens: 100,
          stream: false,
        });

        testResult = {
          type: 'text',
          content: response.content,
          usage: response.usage,
          finishReason: response.finishReason,
        };
        success = true;
      } catch (err: any) {
        error = err.message || 'Text generation failed';
        testResult = {
          type: 'text',
          error,
        };
      }
    } else if (model.type === 'image') {
      try {
        const response = await router.generateImage({
          prompt,
          modelId,
          width: 512,
          height: 512,
          numImages: 1,
          guidanceScale: 7.5,
          steps: 20, // Fewer steps for testing
        });

        testResult = {
          type: 'image',
          images: response.images,
          metadata: response.metadata,
        };
        success = true;
      } catch (err: any) {
        error = err.message || 'Image generation failed';
        testResult = {
          type: 'image',
          error,
        };
      }
    } else if (model.type === 'video') {
      try {
        const response = await router.generateVideo({
          prompt,
          modelId,
          duration: 3, // Short duration for testing
          fps: 12,
          resolution: '720p',
        });

        testResult = {
          type: 'video',
          videoUrl: response.videoUrl,
          metadata: response.metadata,
        };
        success = true;
      } catch (err: any) {
        error = err.message || 'Video generation failed';
        testResult = {
          type: 'video',
          error,
        };
      }
    } else {
      throw createValidationError(`Unsupported model type: ${model.type}`);
    }

    const response: ApiResponse<any> = {
      success,
      data: {
        modelId,
        modelName: model.displayName,
        modelType: model.type,
        provider: model.provider,
        testResult,
        ...(error && { error }),
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    // Model not found or other error
    const response: ApiResponse<any> = {
      success: false,
      error: {
        code: 'MODEL_TEST_FAILED',
        message: err.message || 'Model test failed',
      },
    };

    return NextResponse.json(response, { status: err.statusCode || 500 });
  }
});

/**
 * OPTIONS /api/models/[id]/test
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
