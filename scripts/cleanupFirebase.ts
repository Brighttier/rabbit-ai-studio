/**
 * Firebase Cleanup Script
 * Removes all data from Firestore and Storage
 *
 * WARNING: This will delete ALL data in your Firebase project!
 * Use with caution!
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || 'tanzen-186b4',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'tanzen-186b4.firebasestorage.app',
});

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

/**
 * Delete all documents in a collection
 */
async function deleteCollection(collectionName: string): Promise<number> {
  const collectionRef = db.collection(collectionName);
  const batchSize = 100;
  let deletedCount = 0;

  console.log(`\n🗑️  Deleting collection: ${collectionName}...`);

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();
    console.log(`   Deleted ${deletedCount} documents...`);
  }

  console.log(`✅ Deleted ${deletedCount} documents from ${collectionName}`);
  return deletedCount;
}

/**
 * Delete all files in Storage
 */
async function deleteAllStorageFiles(): Promise<number> {
  console.log('\n🗑️  Deleting all files from Storage...');

  const bucket = storage.bucket();
  const [files] = await bucket.getFiles();
  let deletedCount = 0;

  if (files.length === 0) {
    console.log('   No files to delete');
    return 0;
  }

  for (const file of files) {
    await file.delete();
    deletedCount++;
    console.log(`   Deleted: ${file.name}`);
  }

  console.log(`✅ Deleted ${deletedCount} files from Storage`);
  return deletedCount;
}

/**
 * List all users (without deleting)
 */
async function listUsers(): Promise<number> {
  console.log('\n👥 Listing users...');

  let userCount = 0;
  const listAllUsers = async (nextPageToken?: string) => {
    const listUsersResult = await auth.listUsers(100, nextPageToken);

    listUsersResult.users.forEach((userRecord) => {
      userCount++;
      console.log(`   ${userRecord.email || userRecord.uid} (${userRecord.uid})`);
    });

    if (listUsersResult.pageToken) {
      await listAllUsers(listUsersResult.pageToken);
    }
  };

  await listAllUsers();
  console.log(`📊 Total users: ${userCount}`);
  return userCount;
}

/**
 * Delete all users
 */
async function deleteAllUsers(): Promise<number> {
  console.log('\n🗑️  Deleting all users...');

  let deletedCount = 0;
  const listAllUsers = async (nextPageToken?: string) => {
    const listUsersResult = await auth.listUsers(100, nextPageToken);

    for (const userRecord of listUsersResult.users) {
      await auth.deleteUser(userRecord.uid);
      deletedCount++;
      console.log(`   Deleted: ${userRecord.email || userRecord.uid}`);
    }

    if (listUsersResult.pageToken) {
      await listAllUsers(listUsersResult.pageToken);
    }
  };

  await listAllUsers();
  console.log(`✅ Deleted ${deletedCount} users`);
  return deletedCount;
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('\n🚨 FIREBASE CLEANUP SCRIPT 🚨');
  console.log('================================');
  console.log(`Project: ${process.env.FIREBASE_PROJECT_ID || 'tanzen-186b4'}`);
  console.log('================================\n');

  // Prompt for confirmation
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');
  const deleteUsers = args.includes('--delete-users');

  if (!confirmed) {
    console.log('⚠️  WARNING: This will delete ALL data in your Firebase project!');
    console.log('\nTo proceed, run:');
    console.log('  npm run cleanup:firebase -- --confirm');
    console.log('\nTo also delete users:');
    console.log('  npm run cleanup:firebase -- --confirm --delete-users');
    console.log('\n');
    process.exit(0);
  }

  console.log('⚠️  CLEANUP STARTED - This will delete all data!\n');

  try {
    // Common Firestore collections
    const collections = [
      'users',
      'models',
      'sessions',
      'messages',
      'images',
      'logs',
      'analytics',
      'settings',
    ];

    let totalDocuments = 0;

    // Delete all collections
    for (const collection of collections) {
      try {
        const count = await deleteCollection(collection);
        totalDocuments += count;
      } catch (error: any) {
        console.log(`⚠️  Collection ${collection} not found or error: ${error.message}`);
      }
    }

    // Delete all storage files
    const totalFiles = await deleteAllStorageFiles();

    // List users (always show)
    const totalUsers = await listUsers();

    // Delete users (only if flag is set)
    let deletedUsers = 0;
    if (deleteUsers) {
      deletedUsers = await deleteAllUsers();
    } else {
      console.log('\n💡 To delete users, add --delete-users flag');
    }

    // Summary
    console.log('\n\n================================');
    console.log('✅ CLEANUP COMPLETE');
    console.log('================================');
    console.log(`📄 Documents deleted: ${totalDocuments}`);
    console.log(`🗂️  Files deleted: ${totalFiles}`);
    console.log(`👥 Users found: ${totalUsers}`);
    if (deleteUsers) {
      console.log(`👥 Users deleted: ${deletedUsers}`);
    }
    console.log('================================\n');

    console.log('✨ Your Firebase project is now clean!');
    console.log('\nNext steps:');
    console.log('  1. npm run seed:models     # Seed the models');
    console.log('  2. npm run dev             # Start the app');
    console.log('  3. Sign up for a new admin account\n');
  } catch (error: any) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run cleanup
cleanup();
