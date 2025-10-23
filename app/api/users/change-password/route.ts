import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getAdminAuth } from '@/lib/firebase/adminApp';
import { ApiResponse } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/users/change-password
 * Change user's own password
 *
 * Body:
 * - newPassword: string (required)
 * - currentPassword?: string (optional, for validation)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require authentication
  const user = await requireAuth(request);

  const body = await request.json();
  const { newPassword, currentPassword } = body;

  // Validate new password
  if (!newPassword) {
    throw createValidationError('New password is required');
  }

  if (newPassword.length < 8) {
    throw createValidationError('Password must be at least 8 characters');
  }

  // Check password strength
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    throw createValidationError(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    );
  }

  try {
    const auth = getAdminAuth();

    // Update user password
    await auth.updateUser(user.uid, {
      password: newPassword,
    });

    // Get current custom claims
    const userRecord = await auth.getUser(user.uid);
    const currentClaims = userRecord.customClaims || {};

    // Clear mustChangePassword flag if it was set
    if (currentClaims.mustChangePassword) {
      await auth.setCustomUserClaims(user.uid, {
        ...currentClaims,
        mustChangePassword: false,
      });
    }

    const response: ApiResponse<{ success: boolean; message: string }> = {
      success: true,
      data: {
        success: true,
        message: 'Password changed successfully',
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to change password:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to change password',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS /api/users/change-password
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
