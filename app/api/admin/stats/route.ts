import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/adminApp';
import { requireAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/errorHandler';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 * Requires admin authentication
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const user = await requireAuth(request);

  // Initialize Firestore
  const db = getFirestore(getAdminApp());

  // Fetch stats in parallel
  const [
    usersSnap,
    sessionsSnap,
    imagesSnap,
    messagesSnap,
    modelsSnap
  ] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('sessions').count().get(),
    db.collection('images').count().get(),
    db.collection('messages').count().get(),
    db.collection('models').where('enabled', '==', true).count().get(),
  ]);

  // Get API health by attempting to fetch models
  const modelResponse = await fetch(`${request.nextUrl.origin}/api/models`, {
    headers: { 
      'Authorization': request.headers.get('Authorization') || ''
    }
  });
  const textResponse = await fetch(`${request.nextUrl.origin}/api/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': request.headers.get('Authorization') || ''
    },
    body: JSON.stringify({ prompt: 'test', modelId: 'test' })
  });
  const imageResponse = await fetch(`${request.nextUrl.origin}/api/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': request.headers.get('Authorization') || ''
    },
    body: JSON.stringify({ prompt: 'test', modelId: 'test' })
  });

  // Calculate usage stats from the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentMessagesSnap = await db.collection('messages')
    .where('createdAt', '>=', weekAgo)
    .count()
    .get();

  const recentImagesSnap = await db.collection('images')
    .where('createdAt', '>=', weekAgo)
    .count()
    .get();

  // Return stats
  return NextResponse.json({
    success: true,
    data: {
      systemStats: {
        totalUsers: usersSnap.data().count,
        totalSessions: sessionsSnap.data().count,
        totalImages: imagesSnap.data().count,
        totalMessages: messagesSnap.data().count,
        activeModels: modelsSnap.data().count,
        apiHealth: {
          text: textResponse.ok,
          image: imageResponse.ok,
          models: modelResponse.ok,
        },
      },
      usageStats: {
        textGenerations: recentMessagesSnap.data().count,
        imageGenerations: recentImagesSnap.data().count,
        totalTokens: 0, // TODO: Implement token counting
        averageResponseTime: 0, // TODO: Implement response time tracking
      }
    }
  });
});