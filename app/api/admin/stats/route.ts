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
    modelsSnap
  ] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('sessions').count().get(),
    db.collection('models').where('enabled', '==', true).count().get(),
  ]);

  // Messages are in subcollections, we'll need to aggregate differently
  // For now, use session count as a proxy for message activity
  let totalMessages = 0;
  let totalImages = 0;

  try {
    // Try to get a sample of sessions to estimate message count
    const recentSessions = await db.collection('sessions')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();

    // This is an approximation - in production you'd want to aggregate this data
    totalMessages = recentSessions.docs.reduce((sum, doc) => {
      const metadata = doc.data().metadata;
      return sum + (metadata?.messageCount || 0);
    }, 0);
  } catch (error) {
    console.error('Error getting message counts:', error);
    // Continue with 0 if this fails
  }

  try {
    // Try to count images collection if it exists
    const imagesSnap = await db.collection('images').count().get();
    totalImages = imagesSnap.data().count;
  } catch (error) {
    console.error('Error getting image counts:', error);
    // Continue with 0 if collection doesn't exist
  }

  // Get API health by attempting to fetch models
  let apiHealth = {
    text: false,
    image: false,
    models: false,
  };

  try {
    const modelResponse = await fetch(`${request.nextUrl.origin}/api/models`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || ''
      }
    });
    apiHealth.models = modelResponse.ok;
  } catch (error) {
    console.error('Error checking models API health:', error);
  }

  // Don't test text/image generation APIs as they would fail without valid models
  // Just mark them as true if we can reach the models endpoint
  apiHealth.text = apiHealth.models;
  apiHealth.image = apiHealth.models;

  // Calculate usage stats from the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  let recentMessageCount = 0;
  let recentImageCount = 0;

  try {
    // Get recent sessions and sum up their message counts
    const recentSessionsSnap = await db.collection('sessions')
      .where('updatedAt', '>=', weekAgo)
      .get();

    recentMessageCount = recentSessionsSnap.docs.reduce((sum, doc) => {
      const metadata = doc.data().metadata;
      return sum + (metadata?.messageCount || 0);
    }, 0);
  } catch (error) {
    console.error('Error getting recent message counts:', error);
  }

  try {
    // Try to count recent images if collection exists
    const recentImagesSnap = await db.collection('images')
      .where('createdAt', '>=', weekAgo)
      .count()
      .get();
    recentImageCount = recentImagesSnap.data().count;
  } catch (error) {
    console.error('Error getting recent image counts:', error);
  }

  // Return stats
  return NextResponse.json({
    success: true,
    data: {
      systemStats: {
        totalUsers: usersSnap.data().count,
        totalSessions: sessionsSnap.data().count,
        totalImages: totalImages,
        totalMessages: totalMessages,
        activeModels: modelsSnap.data().count,
        apiHealth: apiHealth,
      },
      usageStats: {
        textGenerations: recentMessageCount,
        imageGenerations: recentImageCount,
        totalTokens: 0, // TODO: Implement token counting
        averageResponseTime: 0, // TODO: Implement response time tracking
      }
    }
  });
});