import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/adminApp';
import { withErrorHandling, createValidationError } from '@/lib/middleware/errorHandler';
import { getAuthToken, verifyAuthToken } from '@/lib/middleware/auth';
import type { User } from '@/lib/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/sync-user
 * Create or update user document in Firestore after Firebase Auth login
 * This ensures the user document exists before accessing protected endpoints
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Extract and verify token
  const token = getAuthToken(request);

  if (!token) {
    throw createValidationError('Missing authentication token');
  }

  const decodedToken = await verifyAuthToken(token);
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  // Get user from Firebase Auth
  const authUser = await auth.getUser(decodedToken.uid);

  // Check if user document exists
  const userRef = db.collection('users').doc(authUser.uid);
  const userDoc = await userRef.get();

  const now = new Date();

  if (!userDoc.exists) {
    // Create new user document
    const newUser: User = {
      uid: authUser.uid,
      email: authUser.email || '',
      displayName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
      photoURL: authUser.photoURL || null,
      role: 'user', // Default role, can be upgraded to admin manually
      createdAt: now,
      updatedAt: now,
    };

    await userRef.set(newUser);

    console.log(`Created new user document for ${authUser.uid}`);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } else {
    // Update existing user document with latest auth data
    const updateData = {
      email: authUser.email || userDoc.data()?.email,
      displayName: authUser.displayName || userDoc.data()?.displayName,
      photoURL: authUser.photoURL || userDoc.data()?.photoURL,
      updatedAt: now,
    };

    await userRef.update(updateData);

    const userData = {
      ...userDoc.data(),
      ...updateData,
    } as User;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: userData,
    });
  }
});
