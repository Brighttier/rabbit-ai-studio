import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/errorHandler';
import { getAdminFirestore } from '@/lib/firebase/adminApp';
import { ApiResponse } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface DuplicateGroup {
  name: string;
  displayName: string;
  count: number;
  instances: {
    id: string;
    createdAt: Date;
    provider: string;
    type: string;
  }[];
}

/**
 * GET /api/admin/remove-duplicates
 * Preview duplicate models that would be removed
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const db = getAdminFirestore();
  const modelsSnapshot = await db.collection('models').orderBy('createdAt', 'asc').get();

  // Group models by name
  const modelGroups = new Map<string, any[]>();

  for (const doc of modelsSnapshot.docs) {
    const data = doc.data();
    const key = data.name; // Group by model name

    if (!modelGroups.has(key)) {
      modelGroups.set(key, []);
    }

    modelGroups.get(key)!.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    });
  }

  // Find duplicates (groups with more than 1 model)
  const duplicates: DuplicateGroup[] = [];
  const unique: any[] = [];

  for (const [name, models] of modelGroups.entries()) {
    if (models.length > 1) {
      // This is a duplicate group
      duplicates.push({
        name,
        displayName: models[0].displayName || name,
        count: models.length,
        instances: models.map(m => ({
          id: m.id,
          createdAt: m.createdAt,
          provider: m.provider,
          type: m.type,
        })),
      });
    } else {
      unique.push({
        id: models[0].id,
        name: models[0].name,
        displayName: models[0].displayName,
      });
    }
  }

  const response: ApiResponse<{
    duplicates: DuplicateGroup[];
    unique: any[];
    summary: {
      totalModels: number;
      uniqueModels: number;
      duplicateGroups: number;
      modelsToDelete: number;
    };
  }> = {
    success: true,
    data: {
      duplicates,
      unique,
      summary: {
        totalModels: modelsSnapshot.size,
        uniqueModels: unique.length,
        duplicateGroups: duplicates.length,
        modelsToDelete: duplicates.reduce((sum, d) => sum + (d.count - 1), 0),
      },
    },
  };

  return NextResponse.json(response);
});

/**
 * DELETE /api/admin/remove-duplicates
 * Remove duplicate models (keeps the oldest instance of each)
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  const db = getAdminFirestore();
  const modelsSnapshot = await db.collection('models').orderBy('createdAt', 'asc').get();

  // Group models by name
  const modelGroups = new Map<string, any[]>();

  for (const doc of modelsSnapshot.docs) {
    const data = doc.data();
    const key = data.name;

    if (!modelGroups.has(key)) {
      modelGroups.set(key, []);
    }

    modelGroups.get(key)!.push({
      id: doc.id,
      ref: doc.ref,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    });
  }

  // Delete duplicates (keep oldest)
  const batch = db.batch();
  const deletedModels: any[] = [];
  let deleteCount = 0;

  for (const [name, models] of modelGroups.entries()) {
    if (models.length > 1) {
      // Sort by creation date (oldest first)
      models.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Keep the first (oldest), delete the rest
      for (let i = 1; i < models.length; i++) {
        batch.delete(models[i].ref);
        deletedModels.push({
          id: models[i].id,
          name: models[i].name,
          displayName: models[i].displayName,
          createdAt: models[i].createdAt,
        });
        deleteCount++;
      }
    }
  }

  // Commit the batch delete
  await batch.commit();

  const response: ApiResponse<{
    deletedCount: number;
    deletedModels: any[];
    message: string;
  }> = {
    success: true,
    data: {
      deletedCount: deleteCount,
      deletedModels,
      message: `Successfully removed ${deleteCount} duplicate models`,
    },
  };

  return NextResponse.json(response);
});

/**
 * OPTIONS /api/admin/remove-duplicates
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
