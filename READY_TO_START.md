# 🎉 Ready to Start - Rabbit AI Studio

All Firebase credentials are configured! You're ready to launch Rabbit.

---

## ✅ Configuration Complete

### **Firebase Credentials** ✅
- [x] Project ID: `tanzen-186b4`
- [x] Client credentials configured
- [x] Admin SDK credentials configured
- [x] Storage bucket configured
- [x] All environment variables set

### **Files Ready** ✅
- [x] `.env.local` - All credentials configured
- [x] `.firebaserc` - Project reference set
- [x] Security rules ready to deploy

---

## 🚀 Launch Rabbit in 5 Steps

### **Step 1: Install Dependencies** (2 minutes)

```bash
cd "/Users/khare/Documents/Projects /Rabbit"
npm install
```

This installs all required packages.

---

### **Step 2: Enable Firebase Services** (5 minutes)

Go to your [Firebase Console](https://console.firebase.google.com/project/tanzen-186b4) and enable:

#### **A. Authentication**
URL: https://console.firebase.google.com/project/tanzen-186b4/authentication/providers

1. Click "Get started"
2. Enable **Email/Password**
   - Click on "Email/Password"
   - Toggle "Enable"
   - Save
3. Enable **Google**
   - Click on "Google"
   - Toggle "Enable"
   - Save

#### **B. Firestore Database**
URL: https://console.firebase.google.com/project/tanzen-186b4/firestore

1. Click "Create database"
2. Select "Start in production mode"
3. Choose location: **us-central1** (recommended)
4. Click "Enable"

#### **C. Storage**
URL: https://console.firebase.google.com/project/tanzen-186b4/storage

1. Click "Get started"
2. Select "Start in production mode"
3. Click "Done"

---

### **Step 3: Deploy Security Rules** (1 minute)

```bash
# Login to Firebase (if not already logged in)
firebase login

# Deploy Firestore and Storage security rules
firebase deploy --only firestore:rules,storage:rules
```

You should see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/tanzen-186b4/overview
```

---

### **Step 4: Seed AI Models** (30 seconds)

```bash
npm run seed:models
```

This creates 9 AI models in your Firestore database:
- Llama 3.1 8B Instruct
- Llama 3.1 70B Instruct
- Mistral 7B Instruct
- Mixtral 8x7B Instruct
- CodeLlama 34B Instruct
- Qwen 2.5 Coder 32B Instruct
- Stable Diffusion 1.5
- Stable Diffusion XL
- Stable Diffusion XL Turbo

---

### **Step 5: Start Rabbit** (30 seconds)

```bash
npm run dev
```

Open in your browser:
```
http://localhost:3000
```

---

## 🎯 First-Time User Setup

### **1. Create Your Account**

1. Go to: http://localhost:3000/auth/signup
2. Enter your details:
   - Display name (e.g., "Admin User")
   - Email
   - Password (min 6 characters)
3. Click "Create Account"

### **2. Set Admin Role**

1. Go to [Firestore Console](https://console.firebase.google.com/project/tanzen-186b4/firestore/data)
2. Navigate to: `users` collection
3. Find your user document (by email)
4. Click on the document
5. Find the `role` field
6. Click the edit icon
7. Change value to: `admin`
8. Save

### **3. Start Using Rabbit!**

You now have admin access! Visit:

- **💬 Text Generation:** http://localhost:3000/chat
- **🎨 Image Generation:** http://localhost:3000/image
- **📊 Admin Dashboard:** http://localhost:3000/admin
- **🤖 Model Management:** http://localhost:3000/admin/models

---

## 🎨 Using Rabbit

### **Text Generation (Chat)**

1. Go to `/chat`
2. Select a model (e.g., "Llama 3.1 8B Instruct")
3. Optionally configure:
   - Temperature (0.0-2.0)
   - Max tokens (128-8192)
   - System prompt
   - Streaming on/off
4. Type your message and press Enter
5. Watch the response stream in real-time!

**Features:**
- Real-time streaming responses
- Conversation history
- Configurable parameters
- Stop generation button
- New chat / Clear chat

### **Image Generation**

1. Go to `/image`
2. Select an image model (e.g., "Stable Diffusion XL")
3. Enter your image description
4. Choose style preset (optional)
5. Select resolution
6. Configure advanced settings (optional):
   - Negative prompt
   - Inference steps
   - Guidance scale
   - Random seed
7. Click "Generate Image"
8. Download or reuse prompts

**Features:**
- 9 style presets
- 7 resolution options
- Batch generation (1-4 images)
- Image gallery with search
- Download functionality

### **Admin Dashboard**

1. Go to `/admin`
2. View system statistics:
   - Total users
   - Active sessions
   - Generated images
   - Active models
3. Monitor API health
4. Check usage statistics
5. Access quick actions

---

## 🔧 Optional: Configure AI Providers

### **LM Studio (Local LLMs)**

1. Download: https://lmstudio.ai
2. Install and open LM Studio
3. Download a model (e.g., "Llama 3.1 8B Instruct")
4. Click "Local Server" tab
5. Click "Start Server"
6. Server runs on: http://localhost:1234
7. Already configured in `.env.local`!

### **Hugging Face (Cloud Models)**

1. Create account: https://huggingface.co
2. Get API key: https://huggingface.co/settings/tokens
3. Add to `.env.local`:
   ```env
   HUGGINGFACE_API_KEY=hf_your_key_here
   ```
4. Restart dev server

### **OpenRouter (Premium Models)**

1. Create account: https://openrouter.ai
2. Get API key: https://openrouter.ai/keys
3. Add to `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-your_key_here
   ```
4. Restart dev server

### **Ollama (Local Optimized Models)**

1. Download: https://ollama.ai
2. Install Ollama
3. Run: `ollama serve`
4. Pull a model: `ollama pull llama2`
5. Already configured in `.env.local`!

---

## ✅ Setup Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Firebase Authentication enabled
- [ ] Firebase Firestore created
- [ ] Firebase Storage enabled
- [ ] Security rules deployed
- [ ] Models seeded (`npm run seed:models`)
- [ ] Dev server started (`npm run dev`)
- [ ] Account created at `/auth/signup`
- [ ] Role set to "admin" in Firestore
- [ ] Tested chat at `/chat`
- [ ] Tested image generation at `/image`

---

## 🎉 You're All Set!

**Rabbit AI Studio is now running!**

Your platform includes:
- ✅ Text generation with streaming
- ✅ Image generation with advanced controls
- ✅ 9 pre-configured AI models
- ✅ Admin dashboard
- ✅ Model management
- ✅ Authentication & authorization
- ✅ All 8 phases complete

**Start creating with AI!** 🐰🚀

---

## 📚 Documentation

- **This Guide:** [READY_TO_START.md](./READY_TO_START.md)
- **Quick Reference:** [QUICKSTART.md](./QUICKSTART.md)
- **Complete Guide:** [PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🆘 Troubleshooting

### **Port 3000 already in use**
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### **"Firebase app not initialized"**
- Check `.env.local` exists
- Restart dev server
- Clear browser cache

### **"Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **"Permission denied" in Firestore**
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check user has "admin" role in Firestore

---

## 🎯 Next Steps

1. **Test all features**
   - Chat with different models
   - Generate images with various styles
   - Explore the admin dashboard

2. **Configure AI providers**
   - Set up LM Studio for local models
   - Add Hugging Face API key
   - Optional: Add OpenRouter key

3. **Customize**
   - Add your own models
   - Adjust settings
   - Explore the code

4. **Deploy to production** (optional)
   - Review [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Deploy to Firebase Hosting

---

**Enjoy building with Rabbit AI Studio!** 🐰✨
