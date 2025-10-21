import { NextResponse } from 'next/server';
import { getModelRouter } from '@/lib/modelRouter';
import { ApiResponse } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health
 * Health check endpoint for the API and AI providers
 */
export async function GET() {
  const router = getModelRouter();

  try {
    // Check all providers
    const providerHealth = await router.checkAllProvidersHealth();

    // Calculate overall health
    const healthyProviders = Object.values(providerHealth).filter(Boolean).length;
    const totalProviders = Object.keys(providerHealth).length;
    const allHealthy = healthyProviders === totalProviders;

    const response: ApiResponse<{
      status: string;
      timestamp: string;
      api: {
        status: string;
        uptime: number;
      };
      providers: Record<string, boolean>;
      summary: {
        healthy: number;
        total: number;
        percentage: number;
      };
    }> = {
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        api: {
          status: 'operational',
          uptime: process.uptime(),
        },
        providers: providerHealth,
        summary: {
          healthy: healthyProviders,
          total: totalProviders,
          percentage: totalProviders > 0 ? Math.round((healthyProviders / totalProviders) * 100) : 0,
        },
      },
    };

    const statusCode = allHealthy ? 200 : 503;
    return NextResponse.json(response, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
