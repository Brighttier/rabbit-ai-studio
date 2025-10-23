/**
 * API Key Utilities
 * Functions for generating, validating, and managing API keys
 */

import { createHash, randomBytes } from 'crypto';
import { ApiKey } from './types';
import { getAdminFirestore } from './firebase/adminApp';

/**
 * Generate a new API key
 * Format: rabbit_sk_<base64RandomString>
 * Returns the raw key (only shown once) and its hash for storage
 */
export function generateApiKey(): { key: string; keyHash: string; prefix: string } {
  // Generate 32 random bytes (256 bits of entropy)
  const randomString = randomBytes(32).toString('base64url');

  // Create API key with prefix
  const key = `rabbit_sk_${randomString}`;

  // Hash the key for storage (SHA-256)
  const keyHash = hashApiKey(key);

  // Extract prefix for display (first 16 chars: "rabbit_sk_XXXXXX")
  const prefix = key.substring(0, 16);

  return { key, keyHash, prefix };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Must start with rabbit_sk_ and have at least 40 characters total
  return /^rabbit_sk_[A-Za-z0-9_-]{32,}$/.test(key);
}

/**
 * Verify an API key against stored hash
 */
export async function verifyApiKey(key: string): Promise<ApiKey | null> {
  // Validate format first
  if (!isValidApiKeyFormat(key)) {
    return null;
  }

  try {
    const db = getAdminFirestore();
    const keyHash = hashApiKey(key);

    // Query Firestore for matching key hash
    const snapshot = await db
      .collection('apiKeys')
      .where('keyHash', '==', keyHash)
      .where('enabled', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check if key is expired
    if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
      return null;
    }

    // Convert Firestore Timestamps to Dates
    const apiKey: ApiKey = {
      id: doc.id,
      keyHash: data.keyHash,
      userId: data.userId,
      name: data.name,
      prefix: data.prefix,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      lastUsedAt: data.lastUsedAt?.toDate?.() || data.lastUsedAt,
      expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
      enabled: data.enabled,
    };

    // Update last used timestamp (fire and forget, don't block)
    updateLastUsed(doc.id).catch(console.error);

    return apiKey;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}

/**
 * Update the lastUsedAt timestamp for an API key
 */
async function updateLastUsed(apiKeyId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    await db.collection('apiKeys').doc(apiKeyId).update({
      lastUsedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating API key last used:', error);
  }
}

/**
 * Create a new API key in Firestore
 */
export async function createApiKey(
  userId: string,
  name: string,
  expiresAt?: Date
): Promise<{ apiKey: ApiKey; rawKey: string }> {
  const db = getAdminFirestore();

  // Generate new key
  const { key, keyHash, prefix } = generateApiKey();

  // Create API key document
  const now = new Date();
  const apiKeyData = {
    keyHash,
    userId,
    name,
    prefix,
    createdAt: now,
    lastUsedAt: null,
    expiresAt: expiresAt || null,
    enabled: true,
  };

  // Add to Firestore
  const docRef = await db.collection('apiKeys').add(apiKeyData);

  const apiKey: ApiKey = {
    id: docRef.id,
    ...apiKeyData,
  };

  return { apiKey, rawKey: key };
}

/**
 * List API keys for a user
 */
export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection('apiKeys')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const apiKeys: ApiKey[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        keyHash: data.keyHash,
        userId: data.userId,
        name: data.name,
        prefix: data.prefix,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        lastUsedAt: data.lastUsedAt?.toDate?.() || data.lastUsedAt,
        expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
        enabled: data.enabled,
      };
    });

    return apiKeys;
  } catch (error) {
    console.error('Error listing API keys:', error);
    return [];
  }
}

/**
 * Delete an API key
 */
export async function deleteApiKey(apiKeyId: string, userId: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();

    // Verify ownership
    const doc = await db.collection('apiKeys').doc(apiKeyId).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      return false;
    }

    await db.collection('apiKeys').doc(apiKeyId).delete();
    return true;
  } catch (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
}

/**
 * Enable/disable an API key
 */
export async function toggleApiKey(
  apiKeyId: string,
  userId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    const db = getAdminFirestore();

    // Verify ownership
    const doc = await db.collection('apiKeys').doc(apiKeyId).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      return false;
    }

    await db.collection('apiKeys').doc(apiKeyId).update({ enabled });
    return true;
  } catch (error) {
    console.error('Error toggling API key:', error);
    return false;
  }
}
