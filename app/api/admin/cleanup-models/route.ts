import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/adminApp';
import { withErrorHandling } from '@/lib/middleware/errorHandler';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE /api/admin/cleanup-models
 * Delete ALL models from the database
 * Use query parameter ?all=true to delete everything
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const db = getAdminFirestore();

  // Check if we should delete all models
  const url = new URL(request.url);
  const deleteAll = url.searchParams.get('all') === 'true';

  // Get all models
  const modelsSnapshot = await db.collection('models').get();

  const deletedModels: string[] = [];
  const batch = db.batch();
  let deleteCount = 0;

  // Delete models based on criteria
  for (const doc of modelsSnapshot.docs) {
    const model = doc.data();

    let shouldDelete = false;

    if (deleteAll) {
      // Delete all models
      shouldDelete = true;
    } else {
      // Delete only old/duplicate models
      // - provider is lmstudio (old text models)
      // - provider is huggingface AND type is image (old image models)
      shouldDelete =
        model.provider === 'lmstudio' ||
        (model.provider === 'huggingface' && model.type === 'image');
    }

    if (shouldDelete) {
      batch.delete(doc.ref);
      deletedModels.push(model.displayName || model.name);
      deleteCount++;
    }
  }

  await batch.commit();

  return NextResponse.json({
    success: true,
    message: `Deleted ${deleteCount} models`,
    deletedModels,
  });
});

/**
 * GET /api/admin/cleanup-models
 * Preview what models would be deleted
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const db = getAdminFirestore();

  const modelsSnapshot = await db.collection('models').get();

  const toDelete: any[] = [];
  const toKeep: any[] = [];

  for (const doc of modelsSnapshot.docs) {
    const model = doc.data();

    const shouldDelete =
      model.provider === 'lmstudio' ||
      (model.provider === 'huggingface' && model.type === 'image');

    if (shouldDelete) {
      toDelete.push({
        id: doc.id,
        name: model.displayName || model.name,
        provider: model.provider,
        type: model.type,
      });
    } else {
      toKeep.push({
        id: doc.id,
        name: model.displayName || model.name,
        provider: model.provider,
        type: model.type,
      });
    }
  }

  return NextResponse.json({
    toDelete,
    toKeep,
    summary: {
      totalModels: modelsSnapshot.size,
      willDelete: toDelete.length,
      willKeep: toKeep.length,
    },
  });
});
