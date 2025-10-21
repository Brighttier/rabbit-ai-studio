import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '../firebase/adminApp';
import { User, UserRole } from '../types';

/**
 * Authentication Error
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extract Firebase Auth token from request
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer TOKEN" and "TOKEN" formats
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : authHeader;
}

/**
 * Verify Firebase Auth token
 */
export async function verifyAuthToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    throw new AuthError(`Invalid authentication token: ${error.message}`);
  }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(uid: string): Promise<User | null> {
  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      uid,
      ...userDoc.data(),
    } as User;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: User, requiredRole: UserRole | UserRole[]): boolean {
  const roles: UserRole[] = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

/**
 * Authenticate request and return user
 */
export async function authenticateRequest(request: NextRequest): Promise<User> {
  // Extract token
  const token = getAuthToken(request);

  if (!token) {
    throw new AuthError('Missing authentication token');
  }

  // Verify token
  const decodedToken = await verifyAuthToken(token);

  // Get user data
  const user = await getUserData(decodedToken.uid);

  if (!user) {
    throw new AuthError('User not found', 404);
  }

  return user;
}

/**
 * Require authentication middleware
 * Returns user if authenticated, throws AuthError otherwise
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  return authenticateRequest(request);
}

/**
 * Require specific role middleware
 */
export async function requireRole(
  request: NextRequest,
  role: UserRole | UserRole[]
): Promise<User> {
  const user = await authenticateRequest(request);

  if (!hasRole(user, role)) {
    throw new AuthError(
      `Insufficient permissions. Required role: ${Array.isArray(role) ? role.join(' or ') : role}`,
      403
    );
  }

  return user;
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(request: NextRequest): Promise<User> {
  return requireRole(request, 'admin');
}

/**
 * Optional authentication
 * Returns user if token is provided and valid, otherwise returns null
 */
export async function optionalAuth(request: NextRequest): Promise<User | null> {
  try {
    return await authenticateRequest(request);
  } catch (error) {
    // Silently fail for optional auth
    return null;
  }
}

/**
 * Rate limiting by user
 * Simple in-memory rate limiter (use Redis for production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  // Clean up expired entries
  if (userLimit && now > userLimit.resetAt) {
    rateLimitStore.delete(userId);
  }

  // Check current limit
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Clear rate limit for a user (admin function)
 */
export function clearRateLimit(userId: string) {
  rateLimitStore.delete(userId);
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(userId: string) {
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit) {
    return {
      count: 0,
      remaining: 100,
      resetAt: null,
    };
  }

  const remaining = Math.max(0, 100 - userLimit.count);

  return {
    count: userLimit.count,
    remaining,
    resetAt: new Date(userLimit.resetAt),
  };
}
