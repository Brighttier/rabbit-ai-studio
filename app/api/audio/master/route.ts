import { NextRequest, NextResponse } from 'next/server';
import { MatcheringProvider } from '@/lib/providers/matchering';
import { AudioMasteringRequest, ApiResponse, AudioMasteringResponse } from '@/lib/types';
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
 * POST /api/audio/master
 * Master audio using Matchering
 *
 * Form Data:
 * - target: Target audio file to master (required)
 * - reference: Reference audio file to match (required)
 * - outputFormat: Output format (wav, mp3, flac)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth(request);

  // Check rate limit (very strict for audio processing)
  if (!checkRateLimit(user.uid, 15, 3600000)) { // 15 requests per hour
    const limitStatus = getRateLimitStatus(user.uid);
    throw createRateLimitError(limitStatus.resetAt || undefined);
  }

  try {
    // Parse form data
    const formData = await request.formData();
    const targetFile = formData.get('target') as File | null;
    const referenceFile = formData.get('reference') as File | null;
    const outputFormat = formData.get('outputFormat') as string || 'wav';

    // Validate files
    if (!targetFile) {
      throw createValidationError('Target audio file is required');
    }

    if (!referenceFile) {
      throw createValidationError('Reference audio file is required');
    }

    // Validate file sizes (max 100MB each)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (targetFile.size > MAX_FILE_SIZE) {
      throw createValidationError(`Target file size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (referenceFile.size > MAX_FILE_SIZE) {
      throw createValidationError(`Reference file size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate file types
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/x-m4a'];
    if (!validTypes.includes(targetFile.type) && !targetFile.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
      throw createValidationError('Invalid target file type. Supported: MP3, WAV, FLAC, M4A');
    }

    if (!validTypes.includes(referenceFile.type) && !referenceFile.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
      throw createValidationError('Invalid reference file type. Supported: MP3, WAV, FLAC, M4A');
    }

    // Validate output format (Matchering works best with WAV, MP3, FLAC)
    const validFormats = ['wav', 'mp3', 'flac'];
    if (!validFormats.includes(outputFormat.toLowerCase())) {
      throw createValidationError(`Invalid output format. Supported: ${validFormats.join(', ')}`);
    }

    // Prepare mastering request
    const masteringRequest: AudioMasteringRequest = {
      targetFile,
      referenceFile,
      outputFormat: outputFormat.toLowerCase() as any,
    };

    // Initialize provider and master audio
    const provider = new MatcheringProvider();
    const response = await provider.masterAudio(masteringRequest);

    const apiResponse: ApiResponse<AudioMasteringResponse> = {
      success: true,
      data: response,
    };

    return NextResponse.json(apiResponse);
  } catch (error: any) {
    console.error('Audio mastering error:', error);
    throw error;
  }
});

/**
 * GET /api/audio/master
 * Get API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/audio/master',
    method: 'POST',
    description: 'Master audio using Matchering',
    authentication: 'Required (Bearer token)',
    rateLimit: '15 requests per hour',
    formData: {
      target: 'Target audio file to master (required, max 100MB)',
      reference: 'Reference audio file to match (required, max 100MB)',
      outputFormat: 'Output format: wav, mp3, flac (optional, default: wav)',
    },
    example: {
      target: 'my_song.wav',
      reference: 'reference_track.wav',
      outputFormat: 'wav',
    },
    notes: [
      'The target audio will be mastered to match the reference track\'s sonic characteristics',
      'Processing typically takes 10-30 seconds depending on file length',
      'Best results with high-quality WAV or FLAC files',
    ],
  });
}

/**
 * OPTIONS /api/audio/master
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
