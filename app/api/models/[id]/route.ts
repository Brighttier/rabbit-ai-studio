import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Model } from '@/lib/types';
import { requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getAdminFirestore } from '@/lib/firebase/adminApp';
import { getModelRouter } from '@/lib/modelRouter';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/models/[id]
 * Get a single model by ID
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const modelId = params.id;

  const db = getAdminFirestore();
  const modelDoc = await db.collection('models').doc(modelId).get();

  if (!modelDoc.exists) {
    throw createValidationError(`Model not found: ${modelId}`, { modelId });
  }

  const model = {
    id: modelDoc.id,
    ...modelDoc.data(),
  } as Model;

  const response: ApiResponse<Model> = {
    success: true,
    data: model,
  };

  return NextResponse.json(response);
});

/**
 * PUT /api/models/[id]
 * Update a model (admin only)
 */
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Require admin role
  await requireAdmin(request);

  const modelId = params.id;
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
    id: modelId,
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
 * DELETE /api/models/[id]
 * Delete a model (admin only)
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Require admin role
  await requireAdmin(request);

  const modelId = params.id;

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
 * OPTIONS /api/models/[id]
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
