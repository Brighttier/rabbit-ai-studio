import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { createApiKey, listApiKeys, deleteApiKey, toggleApiKey } from '@/lib/apiKeys';
import { ApiResponse, ApiKey } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/api-keys
 * List all API keys for the authenticated user
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin auth
  const user = await requireAdmin(request);

  try {
    // For now, admins can see all their own keys
    // In the future, super-admins could see all keys
    const apiKeys = await listApiKeys(user.uid);

    const response: ApiResponse<ApiKey[]> = {
      success: true,
      data: apiKeys,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to list API keys:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FAILED_TO_LIST_API_KEYS',
          message: error.message || 'Failed to list API keys',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/api-keys
 * Create a new API key
 *
 * Body:
 * - name: string (required) - Descriptive name for the key
 * - expiresInDays?: number - Optional expiration in days (0 = never expires)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin auth
  const user = await requireAdmin(request);

  const body = await request.json();
  const { name, expiresInDays } = body;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createValidationError('Name is required and must be a non-empty string');
  }

  if (name.trim().length > 100) {
    throw createValidationError('Name must be 100 characters or less');
  }

  // Validate expiration
  let expiresAt: Date | undefined;
  if (expiresInDays !== undefined && expiresInDays !== null) {
    if (typeof expiresInDays !== 'number' || expiresInDays < 0) {
      throw createValidationError('expiresInDays must be a positive number or 0 (never expires)');
    }

    if (expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }
  }

  try {
    // Create API key
    const { apiKey, rawKey } = await createApiKey(user.uid, name.trim(), expiresAt);

    const response: ApiResponse<{ apiKey: ApiKey; rawKey: string }> = {
      success: true,
      data: {
        apiKey,
        rawKey, // This is the only time we return the raw key!
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FAILED_TO_CREATE_API_KEY',
          message: error.message || 'Failed to create API key',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/api-keys?id=<keyId>
 * Delete an API key
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  // Require admin auth
  const user = await requireAdmin(request);

  // Get key ID from query params
  const url = new URL(request.url);
  const keyId = url.searchParams.get('id');

  if (!keyId) {
    throw createValidationError('API key ID is required');
  }

  try {
    const success = await deleteApiKey(keyId, user.uid);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'API_KEY_NOT_FOUND',
            message: 'API key not found or you do not have permission to delete it',
          },
        },
        { status: 404 }
      );
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FAILED_TO_DELETE_API_KEY',
          message: error.message || 'Failed to delete API key',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/api-keys?id=<keyId>
 * Enable/disable an API key
 *
 * Body:
 * - enabled: boolean (required)
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  // Require admin auth
  const user = await requireAdmin(request);

  // Get key ID from query params
  const url = new URL(request.url);
  const keyId = url.searchParams.get('id');

  if (!keyId) {
    throw createValidationError('API key ID is required');
  }

  const body = await request.json();
  const { enabled } = body;

  if (typeof enabled !== 'boolean') {
    throw createValidationError('enabled must be a boolean');
  }

  try {
    const success = await toggleApiKey(keyId, user.uid, enabled);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'API_KEY_NOT_FOUND',
            message: 'API key not found or you do not have permission to modify it',
          },
        },
        { status: 404 }
      );
    }

    const response: ApiResponse<{ enabled: boolean }> = {
      success: true,
      data: { enabled },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to toggle API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FAILED_TO_TOGGLE_API_KEY',
          message: error.message || 'Failed to toggle API key',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS /api/admin/api-keys
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
