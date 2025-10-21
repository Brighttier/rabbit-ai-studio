# 🧹 Firebase Cleanup Guide

This guide will help you clean up old data from your Firebase project before setting up Rabbit AI Studio.

---

## ⚠️ Important Warning

**This will delete ALL data from your Firebase project:**
- All Firestore documents (users, models, sessions, messages, images, etc.)
- All Storage files (images, uploads, etc.)
- Optionally: All Authentication users

**Make sure you have backups if you need any of the old data!**

---

## 🚀 Quick Cleanup (3 Steps)

### **Step 1: Set Up Admin Credentials**

You need Firebase Admin SDK credentials to run the cleanup script.

1. Go to: [Firebase Console - Service Accounts](https://console.firebase.google.com/project/tanzen-186b4/settings/serviceaccounts/adminsdk)
2. Click **"Generate New Private Key"**
3. Download the JSON file
4. Open the JSON file and copy the values

5. Add these to your `.env.local` file:

```env
FIREBASE_PROJECT_ID=tanzen-186b4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tanzen-186b4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=tanzen-186b4.firebasestorage.app
```

**Important:** The private key must keep the `\n` characters. Don't remove them!

### **Step 2: Preview What Will Be Deleted**

Run the cleanup script without confirmation to see what will be deleted:

```bash
npm run cleanup:firebase
```

This will show you:
- Which collections exist
- How many documents are in each collection
- How many files are in Storage
- How many users exist

**Nothing will be deleted yet!**

### **Step 3: Run the Cleanup**

Once you're ready to delete everything:

```bash
# Delete all Firestore documents and Storage files
npm run cleanup:firebase -- --confirm

# To also delete all users:
npm run cleanup:firebase -- --confirm --delete-users
```

---

## 📋 What Gets Deleted

### **Firestore Collections:**
- ✅ `users` - All user documents
- ✅ `models` - All AI model configurations
- ✅ `sessions` - All chat sessions
- ✅ `messages` - All chat messages
- ✅ `images` - All image metadata
- ✅ `logs` - All system logs
- ✅ `analytics` - All analytics data
- ✅ `settings` - All settings

### **Storage:**
- ✅ All uploaded files
- ✅ All generated images
- ✅ All user uploads

### **Authentication (Optional):**
- ⚠️ All user accounts (only if you use `--delete-users` flag)

---

## 🎯 After Cleanup

Once cleanup is complete, you'll have a fresh Firebase project ready for Rabbit AI Studio!

### **Next Steps:**

1. **Seed the Models:**
   ```bash
   npm run seed:models
   ```

2. **Start the App:**
   ```bash
   npm run dev
   ```

3. **Create Admin Account:**
   - Sign up at: http://localhost:3000/auth/signup
   - Go to Firestore Console
   - Set your user's `role` field to `"admin"`

---

## 🔧 Manual Cleanup (Alternative)

If you prefer to clean up manually through the Firebase Console:

### **Firestore:**
1. Go to: [Firestore Console](https://console.firebase.google.com/project/tanzen-186b4/firestore)
2. Delete each collection one by one
3. Click the three dots next to the collection name → Delete collection

### **Storage:**
1. Go to: [Storage Console](https://console.firebase.google.com/project/tanzen-186b4/storage)
2. Select all files
3. Click Delete

### **Authentication:**
1. Go to: [Authentication Console](https://console.firebase.google.com/project/tanzen-186b4/authentication/users)
2. Select users to delete
3. Click Delete

---

## 🛠️ Troubleshooting

### **"Missing credentials" error**

Make sure you've added all three Firebase Admin credentials to `.env.local`:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### **"Permission denied" error**

Make sure the service account has the correct permissions:
- Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=tanzen-186b4)
- Find your service account
- Make sure it has "Firebase Admin SDK Administrator Service Agent" role

### **"Module not found" error**

Make sure you've installed dependencies:
```bash
npm install
```

---

## 📊 Cleanup Script Options

```bash
# Preview only (no deletion)
npm run cleanup:firebase

# Delete Firestore + Storage (keep users)
npm run cleanup:firebase -- --confirm

# Delete everything including users
npm run cleanup:firebase -- --confirm --delete-users
```

---

## ✅ Safety Features

The cleanup script has built-in safety features:

1. **Confirmation Required:** Must use `--confirm` flag
2. **Preview Mode:** Shows what will be deleted first
3. **Batch Processing:** Deletes in batches to avoid timeouts
4. **Error Handling:** Continues if a collection doesn't exist
5. **Summary Report:** Shows exactly what was deleted

---

## 🎉 Clean Start!

After cleanup, your Firebase project will be:
- ✅ Empty and ready for fresh data
- ✅ All old data removed
- ✅ Ready for Rabbit AI Studio setup

Follow the [QUICKSTART.md](./QUICKSTART.md) guide to set up Rabbit from scratch!

---

**Need help?** Check the error messages or review your Firebase Admin credentials in `.env.local`.
