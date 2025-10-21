# Setup Guide - Rabbit AI Studio

This guide will walk you through setting up Rabbit AI Studio from scratch.

---

## Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

---

## Step 2: Setup Firebase Project

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "rabbit-ai-studio")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Firebase Services

**Firestore:**
1. Go to Firestore Database
2. Click "Create database"
3. Start in **Production mode**
4. Choose location (e.g., us-central1)

**Authentication:**
1. Go to Authentication
2. Click "Get started"
3. Enable **Email/Password** provider
4. Enable **Google** provider (optional)

**Storage:**
1. Go to Storage
2. Click "Get started"
3. Start in **Production mode**
4. Choose same location as Firestore

**Functions:**
1. Go to Functions
2. Click "Get started"
3. Upgrade to **Blaze (pay-as-you-go)** plan if needed

---

## Step 3: Get Firebase Credentials

### Frontend Credentials (Public)

1. Go to Project Settings (⚙️ icon)
2. Scroll to "Your apps"
3. Click "Add app" → Web (</> icon)
4. Register app with nickname "Rabbit AI Studio Web"
5. Copy the Firebase config object

### Backend Credentials (Private)

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Keep this file secure!

---

## Step 4: Configure Environment Variables

### Copy templates

```bash
cp .env.local.example .env.local
cp .firebaserc.example .firebaserc
```

### Edit .env.local

Open `.env.local` and fill in the values:

```bash
# From Firebase Web App config
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# From Service Account JSON
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"

# LM Studio (leave as-is for local development)
LMSTUDIO_API_URL=http://localhost:1234/v1
LMSTUDIO_API_KEY=lm-studio
LMSTUDIO_DEFAULT_MODEL=llama-3.1-8b-instruct
```

### Edit .firebaserc

Open `.firebaserc` and add your project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## Step 5: Initialize Firebase CLI

```bash
# Login to Firebase
firebase login

# List projects to verify
firebase projects:list

# Set project (should match .firebaserc)
firebase use your-project-id
```

---

## Step 6: Deploy Firebase Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

---

## Step 7: Create First Admin User

### Option A: Firebase Console

1. Go to Authentication → Users
2. Click "Add user"
3. Enter email and password
4. Copy the UID

### Option B: Using emulators

```bash
# Start emulators
npm run firebase:emulators

# Go to http://localhost:4000
# Add user via Auth emulator UI
```

### Set admin role in Firestore

1. Go to Firestore Database
2. Start collection: `users`
3. Document ID: (paste the UID from above)
4. Add fields:
   - `uid`: string, (same UID)
   - `email`: string, user@example.com
   - `role`: string, **admin**
   - `createdAt`: timestamp, (now)
   - `updatedAt`: timestamp, (now)
5. Save

---

## Step 8: Setup LM Studio (Optional)

If you want to test text generation:

1. Download [LM Studio](https://lmstudio.ai/)
2. Install and open LM Studio
3. Download a model (e.g., "llama-3.1-8b-instruct")
4. Go to Server tab
5. Click "Start Server"
6. Verify it's running on `http://localhost:1234`

---

## Step 9: Run Development Server

```bash
# Start Next.js dev server
npm run dev

# Open browser
open http://localhost:3000
```

You should see the Rabbit AI Studio homepage!

---

## Step 10: Test Firebase Emulators (Optional)

```bash
# In a separate terminal
npm run firebase:emulators

# Access Emulator Suite UI
open http://localhost:4000

# Your Next.js app will automatically connect to emulators
```

---

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase authentication issues
- Check that `.env.local` has correct values
- Verify Firebase project is active: `firebase use`
- Check Firebase Console → Authentication is enabled

### LM Studio connection refused
- Make sure LM Studio server is running
- Check the port (default: 1234)
- Update `LMSTUDIO_API_URL` in `.env.local` if needed

### Firestore permission denied
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check that user has proper role in `/users/{uid}` document

---

## Next Steps

Once setup is complete, you're ready for **Phase 2: Backend Proxy & API Routing**!

See [CLAUDE.md](./CLAUDE.md) for the complete development roadmap.

---

## Useful Commands

```bash
# Development
npm run dev                         # Start dev server
npm run build                       # Build for production

# Firebase
firebase emulators:start            # Start all emulators
firebase deploy                     # Deploy everything
firebase deploy --only hosting      # Deploy hosting only
firebase deploy --only functions    # Deploy functions only

# Logs
firebase functions:log              # View function logs
firebase functions:log --only helloWorld  # View specific function logs

# Database
firebase firestore:delete --all-collections  # Clear all data (emulator only!)
```

---

**Setup complete! You're ready to build. 🚀**
