# ✅ Firebase Configuration Updated - Rabbit AI Studio

Your Rabbit AI Studio project has been configured with the new Firebase project!

---

## 🎯 What's Configured

### **Firebase Project**
- **Project ID:** `tanzen-186b4`
- **Auth Domain:** `tanzen-186b4.firebaseapp.com`
- **Storage Bucket:** `tanzen-186b4.firebasestorage.app`

### **Files Updated**
✅ `.env.local` - Environment variables with new credentials
✅ `.firebaserc` - Firebase project reference
✅ `QUICKSTART.md` - All links updated
✅ `CLEANUP_GUIDE.md` - All links updated
✅ `scripts/cleanupFirebase.ts` - Project ID updated

---

## 🚀 Next Steps (Choose Your Path)

### **Option 1: Fresh Start (Recommended)**

Start fresh with a clean Firebase project:

```bash
# 1. Install dependencies
npm install

# 2. Get Firebase Admin credentials
# Go to: https://console.firebase.google.com/project/tanzen-186b4/settings/serviceaccounts/adminsdk
# Click "Generate New Private Key" and add to .env.local

# 3. Enable Firebase services in console
# - Authentication (Email + Google)
# - Firestore Database
# - Storage

# 4. Deploy security rules
firebase login
firebase deploy --only firestore:rules,storage:rules

# 5. Seed models
npm run seed:models

# 6. Start Rabbit
npm run dev
```

### **Option 2: Clean Up Old Data First**

If there's old data in this Firebase project, clean it up first:

```bash
# 1. Get Firebase Admin credentials first (see above)

# 2. Clean up old data
npm run cleanup:firebase -- --confirm

# 3. Then follow steps 5-6 from Option 1
```

---

## 📋 Current Status

### ✅ Completed
- [x] Firebase project credentials configured
- [x] Environment variables set
- [x] Project reference updated
- [x] Documentation updated
- [x] Cleanup script ready

### ⏳ To Do
- [ ] Get Firebase Admin credentials
- [ ] Enable Firebase services
- [ ] Deploy security rules
- [ ] Seed models
- [ ] Create admin account

---

## 🔑 Getting Firebase Admin Credentials

You need these for seeding models and cleanup:

1. **Go to Service Accounts:**
   https://console.firebase.google.com/project/tanzen-186b4/settings/serviceaccounts/adminsdk

2. **Generate Private Key:**
   - Click "Generate New Private Key"
   - Download the JSON file

3. **Extract Values:**
   Open the downloaded JSON and find:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

4. **Add to `.env.local`:**
   ```env
   FIREBASE_PROJECT_ID=tanzen-186b4
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tanzen-186b4.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----\n"
   ```

   **Important:** Keep the `\n` characters in the private key!

---

## 🌐 Enable Firebase Services

### **1. Authentication**
https://console.firebase.google.com/project/tanzen-186b4/authentication/providers

Enable:
- ✅ Email/Password
- ✅ Google

Add authorized domains:
- ✅ `localhost`

### **2. Firestore Database**
https://console.firebase.google.com/project/tanzen-186b4/firestore

- Create database
- Start in **production mode**
- Choose region: **us-central1** (recommended)

### **3. Storage**
https://console.firebase.google.com/project/tanzen-186b4/storage

- Get started
- Start in **production mode**
- Use default bucket

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Deploy security rules (after enabling services)
firebase login
firebase deploy --only firestore:rules,storage:rules

# Seed models (after getting admin credentials)
npm run seed:models

# Start Rabbit
npm run dev

# Open in browser
open http://localhost:3000
```

---

## 🎯 First-Time Setup Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Firebase Admin credentials in `.env.local`
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore created
- [ ] Storage enabled
- [ ] Security rules deployed
- [ ] Models seeded
- [ ] App running (`npm run dev`)
- [ ] Admin account created
- [ ] Role set to "admin" in Firestore

---

## 📚 Documentation

- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Cleanup Guide:** [CLEANUP_GUIDE.md](./CLEANUP_GUIDE.md)
- **Complete Guide:** [PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🆘 Need Help?

### **Common Issues:**

**"Module not found"**
```bash
npm install
```

**"Firebase app not initialized"**
- Check `.env.local` has all variables
- Restart dev server

**"Permission denied"**
- Check Firebase rules are deployed
- Check service account has correct permissions

**"Authentication failed"**
- Enable Email/Password in Firebase Console
- Enable Google Sign-In
- Add `localhost` to authorized domains

---

## 🎉 You're All Set!

Your Rabbit AI Studio is configured and ready to go with:

- ✅ Firebase project: `tanzen-186b4`
- ✅ All credentials configured
- ✅ Documentation updated
- ✅ Ready for setup

**Follow the Quick Start Commands above to get Rabbit running!** 🐰🚀

---

**Questions?** Check the documentation files or review the error messages.
