# 🚀 Quick Start Guide - Rabbit AI Studio

Your Firebase project is configured! Here's how to get Rabbit running.

---

## ✅ What's Already Configured

- ✅ Firebase project: `tanzen-186b4`
- ✅ Environment variables in `.env.local`
- ✅ Firebase project reference in `.firebaserc`

---

## 🏃 Quick Start (5 Steps)

### **Step 1: Install Dependencies**

```bash
cd "/Users/khare/Documents/Projects /Rabbit"
npm install
```

### **Step 2: Enable Firebase Services**

Go to [Firebase Console](https://console.firebase.google.com/project/tanzen-186b4) and enable:

1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google"
   - Add `localhost` to authorized domains

2. **Firestore Database**
   - Go to Firestore Database
   - Click "Create Database"
   - Start in **production mode**
   - Choose location (us-central1 recommended)

3. **Storage**
   - Go to Storage
   - Click "Get Started"
   - Start in **production mode**
   - Use default bucket

### **Step 3: Deploy Security Rules**

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore and Storage rules
firebase deploy --only firestore:rules,storage:rules
```

### **Step 4: Get Firebase Admin Credentials**

1. Go to [Firebase Console > Project Settings > Service Accounts](https://console.firebase.google.com/project/tanzen-186b4/settings/serviceaccounts/adminsdk)
2. Click "Generate New Private Key"
3. Save the JSON file
4. Extract the values and add to `.env.local`:

```env
FIREBASE_PROJECT_ID=tanzen-186b4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tanzen-186b4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

### **Step 5: Start Development Server**

```bash
npm run dev
```

Then open: http://localhost:3000

---

## 🎯 Next Steps

### **1. Seed Models**

```bash
npm run seed:models
```

This will create 9 default AI models in Firestore.

### **2. Create Admin User**

1. Sign up at: http://localhost:3000/auth/signup
2. Go to [Firestore Console](https://console.firebase.google.com/project/tanzen-186b4/firestore)
3. Navigate to: `users` > `[your-user-id]`
4. Set `role` field to: `"admin"`

### **3. Configure AI Providers** (Optional)

**LM Studio (Local Uncensored LLMs):**
1. Download from https://lmstudio.ai
2. Download a model (e.g., Llama 3.1 8B Instruct)
3. Start the server (default: http://localhost:1234)
4. Already configured in `.env.local`

**Hugging Face (Cloud Models):**
1. Get API key from: https://huggingface.co/settings/tokens
2. Add to `.env.local`:
   ```env
   HUGGINGFACE_API_KEY=hf_your_key_here
   ```

**OpenRouter (Premium Models):**
1. Get API key from: https://openrouter.ai/keys
2. Add to `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-your_key_here
   ```

**Ollama (Local Optimized Models):**
1. Download from https://ollama.ai
2. Install and run: `ollama serve`
3. Pull a model: `ollama pull llama2`
4. Already configured in `.env.local`

---

## 🎨 Using the Platform

### **Text Generation**

1. Go to: http://localhost:3000/chat
2. Select a model from the dropdown
3. Configure settings (temperature, tokens, etc.)
4. Start chatting!

**Features:**
- Real-time streaming responses
- Adjustable temperature (0.0-2.0)
- Custom system prompts
- Save chat history

### **Image Generation**

1. Go to: http://localhost:3000/image
2. Select an image model (e.g., Stable Diffusion XL)
3. Enter your prompt
4. Choose style preset and resolution
5. Click "Generate Image"

**Features:**
- 9 style presets
- 7 resolution options
- Negative prompts
- Advanced settings (steps, guidance, seed)
- Image gallery with download

### **Admin Dashboard**

1. Go to: http://localhost:3000/admin
2. View system statistics
3. Manage models at: http://localhost:3000/admin/models

---

## 🔧 Troubleshooting

### **"Firebase app not initialized"**

- Make sure `.env.local` exists with all variables
- Restart the dev server: `npm run dev`

### **"Authentication failed"**

- Check that Email/Password is enabled in Firebase Console
- Check that Google Sign-In is enabled
- Verify `localhost` is in authorized domains

### **"No models found"**

- Run: `npm run seed:models`
- Check Firestore Console for `models` collection
- Verify Firestore rules are deployed

### **"LM Studio connection failed"**

- Make sure LM Studio is running
- Check that the server is on http://localhost:1234
- Try loading a model in LM Studio first

---

## 📚 Documentation

- **Full Documentation:** [CLAUDE.md](./CLAUDE.md)
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Project Summary:** [PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)
- **Phase Docs:** PHASE2-8_COMPLETE.md files

---

## 🎉 You're All Set!

Your Tanzen AI platform is now configured with:

- ✅ Firebase project: `tanzen-186b4`
- ✅ Environment variables configured
- ✅ Authentication ready
- ✅ Database ready
- ✅ Storage ready
- ✅ All features implemented

**Just run `npm run dev` and start using your AI platform!** 🚀

---

## 💰 Cost Estimate

**Development (Free Tier):**
- Firestore: 50K reads/day (free)
- Functions: Not deployed yet (free)
- Hosting: Not deployed yet (free)
- Storage: 5GB (free)
- **Cost: $0/month**

**Production (after deployment):**
- Estimated: $35-100/month depending on usage
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for cost optimization

---

## 🆘 Need Help?

If you run into issues:

1. Check the logs: `npm run dev` shows errors
2. Check Firebase Console for service status
3. Review the documentation files
4. Check `.env.local` for correct values

---

**Happy building with Rabbit AI Studio! 🐰🚀**
