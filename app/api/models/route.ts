import { NextRequest, NextResponse } from 'next/server';
import { getModelRouter } from '@/lib/modelRouter';
import { ApiResponse, Model } from '@/lib/types';
import { requireAuth, requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getAdminFirestore } from '@/lib/firebase/adminApp';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/models
 * List all available models (public endpoint)
 *
 * Query Parameters:
 * - type?: 'text' | 'image' | 'multimodal' | 'video'
 * - provider?: string
 * - enabled?: boolean
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // No authentication required for listing models

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'text' | 'image' | 'video' | 'multimodal' | null;
  const provider = searchParams.get('provider');
  const enabledParam = searchParams.get('enabled');

  // Build filter
  const filter: any = {};

  if (type) {
    if (!['text', 'image', 'video', 'multimodal'].includes(type)) {
      throw createValidationError('Type must be one of: text, image, video, multimodal');
    }
    filter.type = type;
  }

  if (provider) {
    filter.provider = provider;
  }

  if (enabledParam !== null) {
    filter.enabled = enabledParam === 'true';
  }

  // Get models from router
  const router = getModelRouter();
  const models = await router.listModels(filter);

  const response: ApiResponse<Model[]> = {
    success: true,
    data: models,
  };

  return NextResponse.json(response);
});

/**
 * POST /api/models
 * Create a new model (admin only)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin role
  await requireAdmin(request);

  // Parse request body
  const body = await request.json();

  // Validate required fields
  const requiredFields = ['name', 'displayName', 'provider', 'type', 'endpointURL'];
  for (const field of requiredFields) {
    if (!body[field]) {
      throw createValidationError(`Missing required field: ${field}`);
    }
  }

  // Create model document
  const db = getAdminFirestore();
  const modelRef = db.collection('models').doc();

  const now = new Date();
  const modelData: Partial<Model> = {
    id: modelRef.id,
    name: body.name,
    displayName: body.displayName,
    description: body.description,
    provider: body.provider,
    type: body.type,
    endpointURL: body.endpointURL,
    apiKeyRef: body.apiKeyRef,
    enabled: body.enabled ?? true,
    config: body.config || {},
    metadata: body.metadata || {},
    createdAt: now,
    updatedAt: now,
  };

  await modelRef.set(modelData);

  // Clear model cache
  const router = getModelRouter();
  router.clearCache();

  const response: ApiResponse<Model> = {
    success: true,
    data: modelData as Model,
  };

  return NextResponse.json(response, { status: 201 });
});

/**
 * PUT /api/models/:id
 * Update a model (admin only)
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  // Require admin role
  await requireAdmin(request);

  // Get model ID from URL
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get('id');

  if (!modelId) {
    throw createValidationError('Model ID is required');
  }

  // Parse request body
  const body = await request.json();

  // Update model document
  const db = getAdminFirestore();
  const modelRef = db.collection('models').doc(modelId);
  const modelDoc = await modelRef.get();

  if (!modelDoc.exists) {
    throw createValidationError(`Model not found: ${modelId}`, { modelId });
  }

  const updateData: any = {
    ...body,
    updatedAt: new Date(),
  };

  // Don't allow changing ID or creation date
  delete updateData.id;
  delete updateData.createdAt;

  await modelRef.update(updateData);

  // Clear model cache
  const router = getModelRouter();
  router.clearCache();

  const updatedModel = {
    ...modelDoc.data(),
    ...updateData,
  };

  const response: ApiResponse<Model> = {
    success: true,
    data: updatedModel as Model,
  };

  return NextResponse.json(response);
});

/**
 * DELETE /api/models/:id
 * Delete a model (admin only)
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  // Require admin role
  await requireAdmin(request);

  // Get model ID from URL
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get('id');

  if (!modelId) {
    throw createValidationError('Model ID is required');
  }

  // Delete model document
  const db = getAdminFirestore();
  const modelRef = db.collection('models').doc(modelId);
  const modelDoc = await modelRef.get();

  if (!modelDoc.exists) {
    throw createValidationError(`Model not found: ${modelId}`, { modelId });
  }

  await modelRef.delete();

  // Clear model cache
  const router = getModelRouter();
  router.clearCache();

  const response: ApiResponse<{ deleted: boolean }> = {
    success: true,
    data: { deleted: true },
  };

  return NextResponse.json(response);
});

/**
 * OPTIONS /api/models
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
