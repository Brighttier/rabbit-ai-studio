import { NextRequest, NextResponse } from 'next/server';
import { DemucsProvider } from '@/lib/providers/demucs';
import { AudioSeparationRequest, ApiResponse, AudioSeparationResponse, StemType } from '@/lib/types';
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
 * POST /api/audio/separate
 * Separate audio into stems using Demucs
 *
 * Form Data:
 * - file: Audio file (required)
 * - modelId: Demucs model ID (default: htdemucs)
 * - stems: Comma-separated stem names (vocals,drums,bass,other)
 * - outputFormat: Output format (wav, mp3, flac, m4a)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth(request);

  // Check rate limit (very strict for audio processing)
  if (!checkRateLimit(user.uid, 10, 3600000)) { // 10 requests per hour
    const limitStatus = getRateLimitStatus(user.uid);
    throw createRateLimitError(limitStatus.resetAt || undefined);
  }

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const modelId = formData.get('modelId') as string || 'htdemucs';
    const stemsParam = formData.get('stems') as string | null;
    const outputFormat = formData.get('outputFormat') as string || 'wav';

    // Validate file
    if (!file) {
      throw createValidationError('Audio file is required');
    }

    // Validate file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw createValidationError(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/x-m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
      throw createValidationError('Invalid audio file type. Supported: MP3, WAV, FLAC, M4A');
    }

    // Parse stems
    let stems: StemType[] | undefined;
    if (stemsParam) {
      const stemList = stemsParam.split(',').map(s => s.trim() as StemType);
      const validStems: StemType[] = ['vocals', 'drums', 'bass', 'other'];
      const invalidStems = stemList.filter(s => !validStems.includes(s));
      if (invalidStems.length > 0) {
        throw createValidationError(`Invalid stems: ${invalidStems.join(', ')}. Valid: ${validStems.join(', ')}`);
      }
      stems = stemList;
    }

    // Validate output format
    const validFormats = ['wav', 'mp3', 'flac', 'm4a'];
    if (!validFormats.includes(outputFormat.toLowerCase())) {
      throw createValidationError(`Invalid output format. Supported: ${validFormats.join(', ')}`);
    }

    // Prepare separation request
    const separationRequest: AudioSeparationRequest = {
      audioFile: file,
      modelId,
      stems,
      outputFormat: outputFormat.toLowerCase() as any,
    };

    // Initialize provider and separate audio
    const provider = new DemucsProvider();
    const response = await provider.separateAudio(separationRequest);

    const apiResponse: ApiResponse<AudioSeparationResponse> = {
      success: true,
      data: response,
    };

    return NextResponse.json(apiResponse);
  } catch (error: any) {
    console.error('Audio separation error:', error);
    throw error;
  }
});

/**
 * GET /api/audio/separate
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/audio/separate',
    method: 'POST',
    description: 'Separate audio into stems using Demucs',
    authentication: 'Required (Bearer token)',
    rateLimit: '10 requests per hour',
    formData: {
      file: 'Audio file (required, max 100MB)',
      modelId: 'Demucs model ID (optional, default: htdemucs)',
      stems: 'Comma-separated stems to extract (optional, default: all)',
      outputFormat: 'Output format: wav, mp3, flac, m4a (optional, default: wav)',
    },
    validStems: ['vocals', 'drums', 'bass', 'other'],
    example: {
      file: 'song.mp3',
      modelId: 'htdemucs',
      stems: 'vocals,drums',
      outputFormat: 'wav',
    },
  });
}

/**
 * OPTIONS /api/audio/separate
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
