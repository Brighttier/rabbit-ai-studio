import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/adminApp';
import { ApiResponse, User, UserRole } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin auth
  await requireAdmin(request);

  try {
    const db = getAdminFirestore();
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();

    const users: User[] = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as User));

    const response: ApiResponse<User[]> = {
      success: true,
      data: users,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Failed to list users:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to list users',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 *
 * Body:
 * - email: string (required)
 * - password: string (required)
 * - displayName: string (required)
 * - role: 'admin' | 'user' (required)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin auth
  await requireAdmin(request);

  const body = await request.json();
  const { email, password, displayName, role } = body;

  // Validate required fields
  if (!email || !password || !displayName || !role) {
    throw createValidationError('Missing required fields: email, password, displayName, role');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError('Invalid email format');
  }

  // Validate password strength
  if (password.length < 6) {
    throw createValidationError('Password must be at least 6 characters');
  }

  // Validate role
  if (role !== 'admin' && role !== 'user') {
    throw createValidationError('Role must be either "admin" or "user"');
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    // Set custom claims for forced password change
    await auth.setCustomUserClaims(userRecord.uid, {
      mustChangePassword: true,
      role,
    });

    // Create user document in Firestore
    const now = new Date();
    const userData: User = {
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: role as UserRole,
      createdAt: now,
      updatedAt: now,
      photoURL: userRecord.photoURL,
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    const response: ApiResponse<User> = {
      success: true,
      data: userData,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create user:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'A user with this email already exists',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to create user',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * OPTIONS /api/admin/users
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
