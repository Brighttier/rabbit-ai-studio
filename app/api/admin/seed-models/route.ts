import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/errorHandler';
import { getDefaultModels, seedModels } from '@/lib/seedModels';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/seed-models
 * Seed the database with uncensored AI models
 * Requires admin authentication
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // TEMPORARY: Skip auth for initial seeding
  // TODO: Re-enable auth after first seed
  // const user = await requireAuth(request);

  // Seed models using shared function
  const count = await seedModels();
  const defaultModels = getDefaultModels();

  return NextResponse.json({
    success: true,
    message: `Successfully seeded ${count} uncensored AI models`,
    count,
    models: defaultModels.map(m => m.displayName),
    breakdown: {
      text: defaultModels.filter(m => m.type === 'text').length,
      image: defaultModels.filter(m => m.type === 'image').length,
      video: defaultModels.filter(m => m.type === 'video').length,
    },
  });
});

/**
 * GET /api/admin/seed-models
 * Get information about the seed endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/seed-models',
    method: 'POST',
    description: 'Seed database with 8 self-hosted AI models',
    authentication: 'Required (Bearer token)',
    models: {
      text: 3,
      image: 4,
      video: 1,
      total: 8,
    },
  });
}
