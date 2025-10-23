import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getAdminAuth } from '@/lib/firebase/adminApp';
import { ApiResponse } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/users/[uid]/reset-password
 * Reset user password (admin only)
 *
 * Body:
 * - newPassword: string (required)
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { uid: string } }
) => {
  // Require admin auth
  await requireAdmin(request);

  const uid = params.uid;
  const body = await request.json();
  const { newPassword } = body;

  // Validate password
  if (!newPassword) {
    throw createValidationError('New password is required');
  }

  if (newPassword.length < 6) {
    throw createValidationError('Password must be at least 6 characters');
  }

  try {
    const auth = getAdminAuth();

    // Update user password
    await auth.updateUser(uid, {
      password: newPassword,
    });

    // Get current custom claims
    const userRecord = await auth.getUser(uid);
    const currentClaims = userRecord.customClaims || {};

    // Set custom claim to force password change on next login
    await auth.setCustomUserClaims(uid, {
      ...currentClaims,
      mustChangePassword: true,
    });

    const response: ApiResponse<{ success: boolean; message: string }> = {
      success: true,
      data: {
        success: true,
        message: 'Password reset successfully. User will be required to change password on next login.',
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to reset password:', error);

    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to reset password',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS /api/admin/users/[uid]/reset-password
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
