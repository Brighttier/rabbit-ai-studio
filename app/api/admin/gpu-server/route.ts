import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/errorHandler';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GPU_SERVER_INSTANCE = 'rabbit-ai-gpu';
const GPU_SERVER_ZONE = 'us-west1-b';
const GCP_PROJECT_ID = 'tanzen-186b4';

/**
 * GET /api/admin/gpu-server
 * Get GPU server status
 * Note: Changed to requireAuth (from requireAdmin) so all authenticated users can check status
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require authentication (any authenticated user can check status)
  await requireAuth(request);

  try {
    const { execSync } = require('child_process');

    // Get instance status
    const cmd = `/usr/local/bin/gcloud compute instances describe ${GPU_SERVER_INSTANCE} --zone=${GPU_SERVER_ZONE} --project=${GCP_PROJECT_ID} --format=json`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const instance = JSON.parse(output);

    const status = instance.status; // RUNNING, TERMINATED, etc.
    const externalIP = instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || 'N/A';
    const internalIP = instance.networkInterfaces?.[0]?.networkIP || 'N/A';

    // Check if services are responsive (if running)
    let services = {
      ollama: false,
      automatic1111: false,
      comfyui: false,
    };

    if (status === 'RUNNING' && externalIP !== 'N/A') {
      // Check Ollama
      try {
        const ollamaResponse = await fetch(`http://${externalIP}:11434/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        services.ollama = ollamaResponse.ok;
      } catch (e) {
        services.ollama = false;
      }

      // Check Automatic1111
      try {
        const a1111Response = await fetch(`http://${externalIP}:7860/sdapi/v1/sd-models`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        services.automatic1111 = a1111Response.ok;
      } catch (e) {
        services.automatic1111 = false;
      }

      // Check ComfyUI
      try {
        const comfyResponse = await fetch(`http://${externalIP}:8188/system_stats`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        services.comfyui = comfyResponse.ok;
      } catch (e) {
        services.comfyui = false;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        externalIP,
        internalIP,
        services,
        instance: GPU_SERVER_INSTANCE,
        zone: GPU_SERVER_ZONE,
      },
    });
  } catch (error: any) {
    console.error('Failed to get GPU server status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to get GPU server status',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/gpu-server
 * Start or stop the GPU server
 * Body: { action: 'start' | 'stop' }
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin auth
  await requireAdmin(request);

  const body = await request.json();
  const { action } = body;

  if (!action || !['start', 'stop'].includes(action)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid action. Must be "start" or "stop"',
        },
      },
      { status: 400 }
    );
  }

  try {
    const { execSync } = require('child_process');

    const cmd = `/usr/local/bin/gcloud compute instances ${action} ${GPU_SERVER_INSTANCE} --zone=${GPU_SERVER_ZONE} --project=${GCP_PROJECT_ID}`;

    execSync(cmd, { encoding: 'utf-8' });

    return NextResponse.json({
      success: true,
      data: {
        action,
        instance: GPU_SERVER_INSTANCE,
        message: `Successfully ${action === 'start' ? 'started' : 'stopped'} GPU server`,
      },
    });
  } catch (error: any) {
    console.error(`Failed to ${action} GPU server:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || `Failed to ${action} GPU server`,
        },
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS /api/admin/gpu-server
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
