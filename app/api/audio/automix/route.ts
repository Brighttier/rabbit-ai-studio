import { NextRequest, NextResponse } from 'next/server';
import { fxnormProvider } from '@/lib/providers/fxnorm';
import { requireAuth, checkRateLimit, getRateLimitStatus } from '@/lib/middleware/auth';
import {
  withErrorHandling,
  createRateLimitError,
  createValidationError,
} from '@/lib/middleware/errorHandler';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/audio/automix
 * Automatically mix stems using FxNorm-automix
 *
 * Form Data:
 * - vocals, drums, bass, other: Individual stem files (optional)
 * - job_id: Job ID from previous separation (optional)
 * - output_format: Output format (wav, mp3, flac)
 * - model: FxNorm model to use (optional)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth(request);

  // Check rate limit (15 requests per hour for mixing)
  if (!checkRateLimit(user.uid, 15, 3600000)) {
    const limitStatus = getRateLimitStatus(user.uid);
    throw createRateLimitError(limitStatus.resetAt || undefined);
  }

  // Parse multipart form data
  const formData = await request.formData();

  // Check if using previous separation job
  const jobId = formData.get('job_id') as string | null;

  if (jobId) {
    // Mix stems from previous separation job
    const outputFormat = (formData.get('output_format') as string) || 'wav';
    const model = formData.get('model') as string | undefined;

    const result = await fxnormProvider.autoMix({
      job_id: jobId,
      outputFormat: outputFormat as any,
      model: model as any,
    });

    return NextResponse.json(result);
  }

  // Individual stem upload mode
  const vocals = formData.get('vocals') as File | null;
  const drums = formData.get('drums') as File | null;
  const bass = formData.get('bass') as File | null;
  const other = formData.get('other') as File | null;

  // Validate all stems are present
  if (!vocals || !drums || !bass || !other) {
    throw createValidationError('All stems required: vocals, drums, bass, other');
  }

  // Validate file sizes (100MB max per stem)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const stems = [vocals, drums, bass, other];
  for (const stem of stems) {
    if (stem.size > MAX_FILE_SIZE) {
      throw createValidationError(`Stem file too large: ${stem.name}. Max ${MAX_FILE_SIZE / 1024 / 1024}MB per file.`);
    }
  }

  // Validate audio file types
  const validTypes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/flac',
    'audio/x-flac',
    'audio/mp4',
    'audio/x-m4a',
  ];

  for (const stem of stems) {
    if (!validTypes.includes(stem.type) && !stem.name.match(/\.(wav|mp3|flac|m4a)$/i)) {
      throw createValidationError(`Invalid file type: ${stem.name}. Supported: WAV, MP3, FLAC, M4A`);
    }
  }

  // Get optional parameters
  const outputFormat = (formData.get('output_format') as string) || 'wav';
  const model = formData.get('model') as string | undefined;

  // Process auto-mix
  const result = await fxnormProvider.autoMix({
    vocals,
    drums,
    bass,
    other,
    outputFormat: outputFormat as any,
    model: model as any,
  });

  return NextResponse.json(result);
});

/**
 * GET /api/audio/automix
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/audio/automix',
    method: 'POST',
    description: 'Automatically mix stems using FxNorm-automix',
    authentication: 'Required (Bearer token)',
    rateLimit: '15 requests per hour',
    formData: {
      mode1: {
        job_id: 'Job ID from previous separation (required for mode 1)',
        output_format: 'Output format: wav, mp3, flac (optional, default: wav)',
        model: 'FxNorm model (optional)',
      },
      mode2: {
        vocals: 'Vocals stem file (required for mode 2, max 100MB)',
        drums: 'Drums stem file (required for mode 2, max 100MB)',
        bass: 'Bass stem file (required for mode 2, max 100MB)',
        other: 'Other stem file (required for mode 2, max 100MB)',
        output_format: 'Output format: wav, mp3, flac (optional, default: wav)',
        model: 'FxNorm model (optional)',
      },
    },
    notes: [
      'Two modes: provide job_id from separation OR upload individual stems',
      'Processing typically takes 30-60 seconds',
      'Uses intelligent loudness normalization for professional mixing',
    ],
  });
}

/**
 * OPTIONS /api/audio/automix
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
