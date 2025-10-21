# Deployment Guide - Rabbit AI Studio

This guide walks you through deploying Rabbit AI Studio to Firebase App Hosting (production).

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase project created
- [ ] Firebase billing enabled (required for Cloud Functions)
- [ ] All environment variables configured
- [ ] Local testing completed
- [ ] Models seeded in Firestore
- [ ] Admin user created

---

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Select the following features:
# ✓ Firestore
# ✓ Functions
# ✓ Hosting
# ✓ Storage
# ✓ Emulators
```

### 1.2 Enable Required Services

In Firebase Console (https://console.firebase.google.com):

1. **Authentication**
   - Enable Email/Password
   - Enable Google Sign-In
   - Add authorized domains

2. **Firestore Database**
   - Create database in production mode
   - Deploy security rules (done automatically)

3. **Storage**
   - Create default bucket
   - Deploy security rules (done automatically)

4. **Firebase App Hosting**
   - Enable App Hosting
   - Link to GitHub repository (optional)

---

## Step 2: Environment Configuration

### 2.1 Set Firebase Environment Variables

```bash
# Set environment variables for Firebase Functions
firebase functions:config:set \
  lmstudio.url="YOUR_LM_STUDIO_URL" \
  lmstudio.api_key="YOUR_API_KEY" \
  huggingface.api_key="YOUR_HF_API_KEY" \
  openrouter.api_key="YOUR_OPENROUTER_KEY" \
  app.url="https://your-app.web.app"

# View current config
firebase functions:config:get
```

### 2.2 Update .env.production

Create `.env.production` with production values:

```env
# Firebase Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI Provider URLs (Production)
LM_STUDIO_BASE_URL=https://your-lm-studio-server.com
HUGGINGFACE_API_KEY=your_hf_api_key
OPENROUTER_API_KEY=your_openrouter_key
OLLAMA_BASE_URL=https://your-ollama-server.com

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.web.app
NODE_ENV=production
```

---

## Step 3: Build and Deploy

### 3.1 Build Next.js Application

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test the production build locally
npm start
```

### 3.2 Deploy Firestore Rules and Indexes

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Storage rules
firebase deploy --only storage:rules
```

### 3.3 Deploy Firebase Functions

```bash
# Build and deploy functions
cd functions
npm install
npm run build
cd ..

firebase deploy --only functions
```

### 3.4 Deploy to Firebase App Hosting

```bash
# Deploy hosting with functions
firebase deploy --only hosting

# Or deploy everything at once
firebase deploy
```

---

## Step 4: Post-Deployment Setup

### 4.1 Create Admin User

```bash
# Use Firebase Console or admin script
# Navigate to Firestore > users > [user-id]
# Set role: "admin"
```

### 4.2 Seed Models

```bash
# Run seed script (requires admin access)
npm run seed:models
```

### 4.3 Test Production Deployment

1. Visit your production URL
2. Sign in with admin account
3. Test text generation
4. Test image generation
5. Check admin dashboard
6. Verify model management

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Custom Domain

```bash
# In Firebase Console:
# Hosting > Add custom domain
# Follow verification steps
```

### 5.2 Update Environment Variables

```bash
# Update app URL
firebase functions:config:set app.url="https://yourdomain.com"

# Redeploy functions
firebase deploy --only functions
```

---

## Step 6: Monitoring and Maintenance

### 6.1 Enable Monitoring

```bash
# Firebase Console > Functions > Logs
# Set up alerts for errors
# Configure budget alerts
```

### 6.2 Regular Maintenance

```bash
# Update dependencies
npm update
cd functions && npm update && cd ..

# Rebuild and redeploy
npm run build
firebase deploy
```

---

## Continuous Deployment (CI/CD)

### Option 1: GitHub Actions

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

### Option 2: Firebase App Hosting Auto Deploy

```bash
# Connect GitHub repository in Firebase Console
# App Hosting > Link repository
# Configure build settings
# Enable automatic deploys on push
```

---

## Security Checklist

Before going live, ensure:

- [ ] All environment variables are secure
- [ ] Firebase security rules are properly configured
- [ ] API keys are restricted to your domains
- [ ] HTTPS is enforced
- [ ] Authentication is required for all protected routes
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive info
- [ ] CORS is properly configured
- [ ] Admin routes are protected
- [ ] User data is encrypted

---

## Performance Optimization

### Enable Caching

```bash
# Already configured in firebase.deploy.json
# Static assets: 1 year cache
# API routes: no cache
```

### Configure CDN

Firebase Hosting automatically uses Google's global CDN.

### Monitor Performance

```bash
# Firebase Console > Performance
# Set up performance monitoring
# Track Core Web Vitals
```

---

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules functions/lib
npm install
npm run build
```

### Function Deployment Issues

```bash
# Check function logs
firebase functions:log

# Deploy specific function
firebase deploy --only functions:generateText
```

### Hosting Issues

```bash
# Check hosting logs
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

---

## Scaling Considerations

### Cloud Functions

```javascript
// functions/src/index.ts
export const generateText = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB',
    maxInstances: 10, // Auto-scale up to 10 instances
  })
  .https.onRequest(app);
```

### Firestore

- Use composite indexes for complex queries
- Implement pagination for large collections
- Cache frequently accessed data
- Use Firestore bundles for initial data loading

### Storage

- Implement image compression
- Use Firebase CDN for serving images
- Set up lifecycle rules for old images
- Consider Cloud Storage triggers for processing

---

## Costs and Limits

### Free Tier Limits (Spark Plan)

- Functions: 125K invocations/month
- Firestore: 50K reads, 20K writes/day
- Storage: 5GB total, 1GB downloads/day
- Hosting: 10GB storage, 360MB/day

### Paid Tier (Blaze Plan)

- Pay-as-you-go pricing
- Set budget alerts
- Monitor usage in Firebase Console
- Optimize to reduce costs

---

## Backup and Recovery

### Firestore Backups

```bash
# Enable automated backups in Firebase Console
# Firestore > Backups > Schedule backup
```

### Manual Backup

```bash
# Export Firestore data
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

### Restore from Backup

```bash
# Import Firestore data
gcloud firestore import gs://your-bucket/backup-20241016
```

---

## Support and Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Firebase CLI Reference:** https://firebase.google.com/docs/cli
- **GitHub Issues:** https://github.com/your-repo/issues

---

## Deployment Checklist

Final checklist before going live:

- [ ] All tests passing
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Firebase services enabled
- [ ] Security rules deployed
- [ ] Functions deployed and working
- [ ] Hosting deployed successfully
- [ ] Custom domain configured (if applicable)
- [ ] Admin user created
- [ ] Models seeded
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Budget alerts configured
- [ ] Documentation updated
- [ ] Team notified

---

**Deployment Complete!** Your Rabbit AI Studio is now live in production.

For ongoing maintenance and updates, refer to the [MAINTENANCE.md](./MAINTENANCE.md) guide.
