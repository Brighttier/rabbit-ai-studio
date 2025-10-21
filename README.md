# 🐰 Rabbit AI Studio

A **modular, scalable Next.js application** for multi-model AI generation (text and image), designed for internal use. Built with Firebase App Hosting, Firestore, and integration with LM Studio and other AI providers.

<div align="center">

![Status](https://img.shields.io/badge/Status-Phase%201%20Complete-green)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-10+-orange)

</div>

---

## ⚠️ Important Notice

**This platform uses uncensored AI models for internal research and development purposes only.**

---

## ✨ Features

- 💬 **Text Generation** - Chat with uncensored language models via LM Studio
- 🎨 **Image Generation** - Generate images with Stable Diffusion and SDXL
- 🔥 **Firebase Integration** - Real-time database, authentication, and storage
- 🎛️ **Model Registry** - Dynamically add/manage AI models without code changes
- 👥 **Role-Based Access** - Admin, User, and Viewer roles with granular permissions
- 📊 **Session History** - Persistent chat and image generation history
- 🌐 **Multi-Provider** - Support for LM Studio, Hugging Face, OpenRouter, and more
- 🎨 **Modern UI** - Dark mode, TailwindCSS, and ShadCN UI components

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │ (Frontend + API Routes)
│   App Router    │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Firestore    │ │   Firebase   │ │   Firebase   │
│   Database     │ │     Auth     │ │   Storage    │
└────────────────┘ └──────────────┘ └──────────────┘
         │
         │  Model Registry
         │
         ▼
┌─────────────────────────────────────────────────┐
│              AI Model Endpoints                  │
├─────────────────────────────────────────────────┤
│  LM Studio  │  Hugging Face  │  OpenRouter  │ ...│
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- LM Studio (for local AI inference)

### Installation

1. **Clone the repository** (or use this directory)

```bash
cd "/Users/khare/Documents/Projects /Rabbit"
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup Firebase**

```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators
```

4. **Configure environment variables**

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and fill in your values
# Required: Firebase credentials, LM Studio URL
```

5. **Configure Firebase project**

```bash
# Copy Firebase project reference template
cp .firebaserc.example .firebaserc

# Edit .firebaserc and add your Firebase project ID
```

6. **Run development server**

```bash
npm run dev
```

7. **Open browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Firebase (Frontend - Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (Backend - Private)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# LM Studio (Primary AI Provider)
LMSTUDIO_API_URL=http://localhost:1234/v1
LMSTUDIO_API_KEY=lm-studio
LMSTUDIO_DEFAULT_MODEL=llama-3.1-8b-instruct

# Hugging Face (Secondary)
HUGGINGFACE_API_KEY=hf_your_api_key
HUGGINGFACE_API_URL=https://api-inference.huggingface.co/models

# Optional Providers
OPENROUTER_API_KEY=your-openrouter-key
```

See `.env.example` for a complete list of available environment variables.

---

## 📁 Project Structure

```
rabbit-ai-studio/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── chat/              # Text generation UI
│   ├── image/             # Image generation UI
│   ├── admin/             # Admin dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
│
├── components/            # React components
│   └── ui/               # ShadCN UI components
│
├── lib/                   # Utility libraries
│   ├── firebase/         # Firebase configuration
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Helper utilities
│
├── functions/             # Firebase Functions
│   └── src/              # Functions source code
│
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
└── package.json           # Dependencies
```

---

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Firestore**, **Authentication**, **Storage**, and **Functions**

### 2. Get Firebase Credentials

**For Frontend (Web App):**
1. Go to Project Settings > General
2. Scroll to "Your apps" > Add web app
3. Copy the Firebase config object

**For Backend (Admin SDK):**
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `project_id`, `client_email`, and `private_key`

### 3. Configure Authentication

1. Go to Authentication > Sign-in method
2. Enable **Email/Password** and **Google** providers

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Firebase
npm run firebase:emulators         # Run Firebase emulators
npm run firebase:deploy            # Deploy everything
npm run firebase:deploy:hosting    # Deploy hosting only
npm run firebase:deploy:functions  # Deploy functions only
npm run firebase:deploy:firestore  # Deploy Firestore rules
npm run firebase:deploy:storage    # Deploy Storage rules
```

---

## 🎯 Development Phases

This project follows a **phase-by-phase development approach**:

### ✅ Phase 1: Project Setup & Firebase Config (COMPLETED)
- Next.js project initialization
- Firebase configuration
- Environment setup
- TypeScript types
- UI framework setup

### 🔄 Phase 2: Backend Proxy & API Routing (NEXT)
- Firebase Functions setup
- API routes for text/image generation
- Streaming responses
- Error handling

### 📋 Phase 3: Model Registry System
- Firestore model collection
- Admin UI for model management
- Dynamic model loading

### 💬 Phase 4: Text Generation UI
- Chat interface
- Streaming responses
- Session history

### 🎨 Phase 5: Image Generation UI
- Prompt-to-image interface
- Image gallery
- Download functionality

### ⚙️ Phase 6: Admin Dashboard + Roles
- User management
- Role-based access control
- System logs

### 🌐 Phase 7: Scaling & Extensibility
- Multi-provider abstraction
- Load balancing
- Cloud Logging

### 🔒 Phase 8: Deployment & Security
- Production deployment
- Rate limiting
- Secret management

See `CLAUDE.md` for detailed phase breakdown and technical documentation.

---

## 🔒 Security

### Firestore Rules
- Users can only access their own data
- Admin role required for model management
- Session data is private by default

### Storage Rules
- User-uploaded files are private
- Generated images accessible by owner
- 10MB file size limit

### API Security
- Firebase Authentication required
- Role-based access control
- Rate limiting (planned)

---

## 🧪 Testing with Firebase Emulators

```bash
# Start emulators
npm run firebase:emulators

# Access emulator UIs
# - Firestore: http://localhost:8080
# - Functions: http://localhost:5001
# - Auth: http://localhost:9099
# - Storage: http://localhost:9199
# - Emulator Suite: http://localhost:4000
```

---

## 📚 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | TailwindCSS + ShadCN UI |
| **Backend** | Firebase Functions (Node 20) |
| **Database** | Firestore |
| **Storage** | Firebase Storage |
| **Auth** | Firebase Authentication |
| **AI Primary** | LM Studio |
| **AI Secondary** | Hugging Face, OpenRouter |
| **Deployment** | Firebase App Hosting |

---

## 🤝 Contributing

This is an internal project. For questions or improvements, contact the development team.

---

## 📝 License

Internal use only. All rights reserved.

---

## 🔗 Resources

- [CLAUDE.md](./CLAUDE.md) - Comprehensive technical documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [LM Studio](https://lmstudio.ai/)

---

## 📞 Support

For issues or questions:
1. Check [CLAUDE.md](./CLAUDE.md) for detailed documentation
2. Review Firebase logs: `firebase functions:log`
3. Check emulator logs during development
4. Contact the development team

---

**Built with ❤️ for internal AI research and development**
