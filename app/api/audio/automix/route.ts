import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fxnormProvider } from '@/lib/providers/fxnorm';
import { rateLimit } from '@/lib/rateLimit';

/**
 * POST /api/audio/automix
 * Automatically mix stems using FxNorm-automix
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting: 15 requests per hour
    const rateLimitResult = await rateLimit(session.user.id, 15, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();

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
      return NextResponse.json(
        { error: 'All stems required: vocals, drums, bass, other' },
        { status: 400 }
      );
    }

    // Validate file sizes (100MB max per stem)
    const maxSize = 100 * 1024 * 1024; // 100MB
    const stems = [vocals, drums, bass, other];
    for (const stem of stems) {
      if (stem.size > maxSize) {
        return NextResponse.json(
          { error: `Stem file too large: ${stem.name}. Max 100MB per file.` },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: `Invalid file type: ${stem.name}. Supported: WAV, MP3, FLAC, M4A` },
          { status: 400 }
        );
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
  } catch (error) {
    console.error('Auto-mix error:', error);
    return NextResponse.json(
      {
        error: 'Auto-mix failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audio/automix/health
 * Check if FxNorm-automix service is available
 */
export async function GET() {
  try {
    const health = await fxnormProvider.healthCheck();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { available: false, error: 'Health check failed' },
      { status: 503 }
    );
  }
}
