import { NextRequest, NextResponse } from 'next/server';
import { getModelRouter } from '@/lib/modelRouter';
import { TextGenerationRequest, ApiResponse, TextGenerationResponse } from '@/lib/types';
import { requireAuth, checkRateLimit, getRateLimitStatus } from '@/lib/middleware/auth';
import {
  withErrorHandling,
  validateRequest,
  createRateLimitError,
  createValidationError,
} from '@/lib/middleware/errorHandler';
import { createStreamingResponse } from '@/lib/streaming';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/generate-text
 * Generate text using configured AI models
 *
 * Body:
 * - prompt: string (required)
 * - modelId: string (required)
 * - systemPrompt?: string
 * - temperature?: number
 * - maxTokens?: number
 * - stream?: boolean
 */
export const POST = withErrorHandling(async (request: NextRequest): Promise<Response> => {
  // Authenticate user
  const user = await requireAuth(request);

  // Check rate limit
  if (!checkRateLimit(user.uid)) {
    const limitStatus = getRateLimitStatus(user.uid);
    throw createRateLimitError(limitStatus.resetAt || undefined);
  }

  // Parse and validate request body
  const body = await request.json();
  const { prompt, modelId, systemPrompt, temperature, maxTokens, stream } = validateRequest<{
    prompt: string;
    modelId: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }>(body, ['prompt', 'modelId']);

  // Validate inputs
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw createValidationError('Prompt must be a non-empty string');
  }

  if (typeof modelId !== 'string' || modelId.trim().length === 0) {
    throw createValidationError('Model ID must be a non-empty string');
  }

  if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
    throw createValidationError('Temperature must be a number between 0 and 2');
  }

  if (maxTokens !== undefined && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 8192)) {
    throw createValidationError('Max tokens must be a number between 1 and 8192');
  }

  // Prepare generation request
  const generationRequest: TextGenerationRequest = {
    prompt: prompt.trim(),
    modelId: modelId.trim(),
    systemPrompt: systemPrompt?.trim(),
    temperature,
    maxTokens,
    stream: stream || false,
  };

  const router = getModelRouter();

  // Handle streaming response
  if (stream) {
    const generator = router.generateTextStream(generationRequest);
    return createStreamingResponse(generator);
  }

  // Handle non-streaming response
  const response = await router.generateText(generationRequest);

  const apiResponse: ApiResponse<TextGenerationResponse> = {
    success: true,
    data: response,
  };

  return NextResponse.json(apiResponse);
});

/**
 * GET /api/generate-text
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/generate-text',
    method: 'POST',
    description: 'Generate text using AI models',
    authentication: 'Required (Bearer token)',
    body: {
      prompt: 'string (required)',
      modelId: 'string (required)',
      systemPrompt: 'string (optional)',
      temperature: 'number 0-2 (optional)',
      maxTokens: 'number 1-8192 (optional)',
      stream: 'boolean (optional, default: false)',
    },
    example: {
      prompt: 'Write a short story about a rabbit',
      modelId: 'lmstudio-llama3',
      temperature: 0.7,
      maxTokens: 1024,
      stream: false,
    },
  });
}

/**
 * OPTIONS /api/generate-text
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
