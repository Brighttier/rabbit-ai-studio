import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/adminApp';
import { ApiResponse, User, UserRole } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/users/[uid]
 * Get a single user (admin only)
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { uid: string } }
) => {
  // Require admin auth
  await requireAdmin(request);

  const uid = params.uid;

  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
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

    const user: User = {
      uid: userDoc.id,
      ...userDoc.data(),
    } as User;

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to get user:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to get user',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/users/[uid]
 * Update a user (admin only)
 *
 * Body:
 * - displayName?: string
 * - role?: 'admin' | 'user'
 * - disabled?: boolean
 */
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { uid: string } }
) => {
  // Require admin auth
  await requireAdmin(request);

  const uid = params.uid;
  const body = await request.json();
  const { displayName, role, disabled } = body;

  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Check if user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
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

    // Update Firebase Auth user
    const authUpdates: any = {};
    if (displayName !== undefined) authUpdates.displayName = displayName;
    if (disabled !== undefined) authUpdates.disabled = disabled;

    if (Object.keys(authUpdates).length > 0) {
      await auth.updateUser(uid, authUpdates);
    }

    // Update custom claims if role changed
    if (role !== undefined) {
      if (role !== 'admin' && role !== 'user') {
        throw createValidationError('Role must be either "admin" or "user"');
      }

      const currentUser = await auth.getUser(uid);
      const currentClaims = currentUser.customClaims || {};

      await auth.setCustomUserClaims(uid, {
        ...currentClaims,
        role,
      });
    }

    // Update Firestore document
    const firestoreUpdates: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) firestoreUpdates.displayName = displayName;
    if (role !== undefined) firestoreUpdates.role = role as UserRole;

    await db.collection('users').doc(uid).update(firestoreUpdates);

    // Get updated user
    const updatedUserDoc = await db.collection('users').doc(uid).get();
    const updatedUser: User = {
      uid: updatedUserDoc.id,
      ...updatedUserDoc.data(),
    } as User;

    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update user',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/users/[uid]
 * Delete a user (admin only)
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { uid: string } }
) => {
  // Require admin auth
  const currentUser = await requireAdmin(request);

  const uid = params.uid;

  // Prevent self-deletion
  if (currentUser.uid === uid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'You cannot delete your own account',
        },
      },
      { status: 400 }
    );
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to delete user:', error);

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
          message: error.message || 'Failed to delete user',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS /api/admin/users/[uid]
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
