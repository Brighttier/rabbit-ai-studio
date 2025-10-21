# Rabbit AI Studio - Claude Code Documentation

**Project Status:** Phase 1 Complete ✓
**Last Updated:** 2025-10-15

---

## 📋 Project Overview

Rabbit AI Studio is a **modular, scalable Next.js application** for multi-model AI generation (text and image), designed for **internal uncensored use**. The platform integrates with **Firebase App Hosting**, **Firestore**, **Firebase Functions**, and multiple AI model endpoints including **LM Studio** (primary), **Hugging Face**, and extensible support for other providers.

### Tech Stack
- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript
- **Styling:** TailwindCSS + ShadCN UI
- **Backend:** Firebase Functions (Node 20)
- **Database:** Firestore
- **Storage:** Firebase Storage
- **Auth:** Firebase Authentication
- **AI Providers:** LM Studio, Hugging Face, OpenRouter, Ollama, Vertex AI (extensible)

---

## 🗂️ Project Structure

```
/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── chat/                     # Text generation UI
│   ├── image/                    # Image generation UI
│   ├── admin/                    # Admin dashboard
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   └── ui/                       # ShadCN UI components
│       └── button.tsx            # Button component
│
├── lib/                          # Utility libraries
│   ├── firebase/                 # Firebase configuration
│   │   ├── config.ts             # Firebase client config
│   │   ├── clientApp.ts          # Firebase client SDK
│   │   └── adminApp.ts           # Firebase Admin SDK
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Helper utilities
│
├── functions/                    # Firebase Functions
│   └── src/                      # Functions source code
│
├── firebase.json                 # Firebase project config
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore indexes
├── storage.rules                 # Storage security rules
├── .firebaserc.example           # Firebase project reference (template)
├── .env.example                  # Environment variables (template)
├── .env.local.example            # Local dev environment (template)
├── package.json                  # Dependencies and scripts
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── components.json               # ShadCN UI configuration
└── README.md                     # Setup and usage guide
```

---

## 🔥 Firebase Configuration

### Firestore Collections

#### `/users/{uid}`
```typescript
{
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `/models/{modelId}`
```typescript
{
  id: string;
  name: string;
  displayName: string;
  description?: string;
  provider: 'lmstudio' | 'huggingface' | 'openrouter' | 'ollama' | 'vertexai' | 'custom';
  type: 'text' | 'image' | 'multimodal';
  endpointURL: string;
  apiKeyRef?: string;
  enabled: boolean;
  config?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    defaultSystemPrompt?: string;
  };
  metadata?: {
    contextWindow?: number;
    capabilities?: string[];
    pricing?: { input: number; output: number; };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `/sessions/{sessionId}`
```typescript
{
  id: string;
  userId: string;
  type: 'chat' | 'image' | 'multimodal';
  title: string;
  modelId: string;
  modelName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    messageCount?: number;
    totalTokens?: number;
  };
}
```

#### `/sessions/{sessionId}/messages/{messageId}`
```typescript
{
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  metadata?: {
    tokens?: number;
    model?: string;
    finishReason?: string;
  };
}
```

#### `/logs/{logId}` (Admin only)
```typescript
{
  id: string;
  timestamp: Timestamp;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}
```

### Security Rules

**Firestore Rules** (`firestore.rules`):
- Users can read/update their own data
- Only admins can modify user roles
- Models are readable by all authenticated users
- Only admins can create/update/delete models
- Sessions are private to the user who created them
- Logs are admin-only

**Storage Rules** (`storage.rules`):
- User profile images: 5MB limit, user-owned
- Generated images: Backend-only writes (via Admin SDK)
- Session attachments: 10MB limit, user-owned
- Public assets: Read-only, admin writes

---

## 🔐 Environment Variables

### Required Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Firebase (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# LM Studio (Primary AI Provider)
LMSTUDIO_API_URL=http://localhost:1234/v1
LMSTUDIO_API_KEY=lm-studio
LMSTUDIO_DEFAULT_MODEL=llama-3.1-8b-instruct

# Hugging Face (Secondary)
HUGGINGFACE_API_KEY=
HUGGINGFACE_API_URL=https://api-inference.huggingface.co/models

# Optional Providers
OPENROUTER_API_KEY=
GCP_MODEL_ENDPOINT=
```

---

## 🚀 Development Phases

### ✅ Phase 1: Project Setup & Firebase Config (COMPLETED)

**Deliverables:**
- ✓ Next.js 14 project initialized with TypeScript and TailwindCSS
- ✓ Firebase configuration files created
- ✓ Environment variable templates
- ✓ Project folder structure
- ✓ Firebase client and admin SDK setup
- ✓ TypeScript type definitions
- ✓ ShadCN UI configuration
- ✓ Homepage with feature cards
- ✓ Dark mode by default

**Files Created:**
- `package.json`, `tsconfig.json`, `next.config.js`
- `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`
- `lib/firebase/config.ts`, `lib/firebase/clientApp.ts`, `lib/firebase/adminApp.ts`
- `lib/types.ts`, `lib/utils.ts`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `components/ui/button.tsx`, `components.json`
- `.env.example`, `.env.local.example`, `.firebaserc.example`

### 🔄 Phase 2: Backend Proxy & API Routing (NEXT)

**Goals:**
- Create Firebase Functions for model proxying
- Build `/api/generateText` endpoint
- Build `/api/generateImage` endpoint
- Implement streaming responses (SSE)
- Add error handling and auth checks

**Files to Create:**
- `functions/src/index.ts`
- `functions/package.json`
- `app/api/generate-text/route.ts`
- `app/api/generate-image/route.ts`
- `lib/modelRouter.ts`

### 📋 Phase 3: Model Registry System

**Goals:**
- Create `/models` Firestore collection
- Build admin UI for model management
- Implement dynamic model loading
- Create model selection dropdown

**Files to Create:**
- `app/admin/models/page.tsx`
- `components/ModelRegistry.tsx`
- `lib/models.ts`

### 💬 Phase 4: Text Generation UI

**Goals:**
- Chat interface with streaming responses
- Model selection dropdown
- System prompt and temperature controls
- Session history and replay

**Files to Create:**
- `app/chat/page.tsx`
- `components/ChatInterface.tsx`
- `components/MessageList.tsx`
- `lib/chat.ts`

### 🎨 Phase 5: Image Generation UI

**Goals:**
- Prompt-to-image interface
- Style presets and resolution options
- Image preview and download
- Gallery view with history

**Files to Create:**
- `app/image/page.tsx`
- `components/ImageGenerator.tsx`
- `components/ImageGallery.tsx`
- `lib/imageGeneration.ts`

### ⚙️ Phase 6: Admin Dashboard + Roles

**Goals:**
- User management interface
- Model management
- API key management
- System logs viewer
- Role-based access control

**Files to Create:**
- `app/admin/page.tsx`
- `app/admin/users/page.tsx`
- `components/AdminPanel.tsx`
- `lib/admin.ts`

### 🌐 Phase 7: Scaling & Extensibility

**Goals:**
- Unified model handler abstraction
- Add Hugging Face integration
- Add Vertex AI support
- Add OpenRouter support
- Load balancing for Firebase Functions
- Cloud Logging integration

**Files to Create:**
- `lib/providers/lmstudio.ts`
- `lib/providers/huggingface.ts`
- `lib/providers/vertexai.ts`
- `lib/providers/openrouter.ts`

### 🔒 Phase 8: Deployment & Security

**Goals:**
- Firebase deployment scripts
- Rate limiting middleware
- Request validation
- Secret Manager integration
- Production Firebase rules
- Monitoring and alerts

---

## 🛠️ API Endpoints (Planned)

### Text Generation
```
POST /api/generate-text
Body: {
  prompt: string;
  modelId: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
```

### Image Generation
```
POST /api/generate-image
Body: {
  prompt: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  steps?: number;
}
```

### Model Management
```
GET /api/models - List all models
GET /api/models/:id - Get model by ID
POST /api/models - Create new model (admin only)
PUT /api/models/:id - Update model (admin only)
DELETE /api/models/:id - Delete model (admin only)
```

---

## 🎯 Key Features

### 1. Model Registry System
- Dynamic model registration via Firestore
- No code changes required to add new models
- Admin panel for model CRUD operations
- Automatic routing based on `modelId`

### 2. Multi-Provider Support
- **Primary:** LM Studio (server-side, uncensored)
- **Secondary:** Hugging Face Inference API
- **Extensible:** OpenRouter, Ollama, Vertex AI, custom endpoints

### 3. Role-Based Access Control
- **Admin:** Full access to all features, model management, user management
- **User:** Can use all generation features, manage own sessions
- **Viewer:** Read-only access to shared content

### 4. Session Management
- Persistent chat history in Firestore
- Image generation history with Firebase Storage
- Session replay and continuation
- Export/import functionality

### 5. Streaming Responses
- Real-time text generation with SSE (Server-Sent Events)
- Progressive image loading
- Token-by-token display for LLMs

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Firebase emulators
npm run firebase:emulators

# Deploy everything to Firebase
npm run firebase:deploy

# Deploy only hosting
npm run firebase:deploy:hosting

# Deploy only functions
npm run firebase:deploy:functions

# Deploy Firestore rules
npm run firebase:deploy:firestore

# Deploy Storage rules
npm run firebase:deploy:storage
```

---

## 🔍 Current Status

**Phase 1 Complete:**
- ✅ Project structure initialized
- ✅ Firebase configuration complete
- ✅ TypeScript types defined
- ✅ TailwindCSS + ShadCN UI configured
- ✅ Homepage created with feature cards
- ✅ Security rules defined
- ✅ Environment variables templated

**Next Steps:**
1. Install dependencies: `npm install`
2. Setup Firebase project: `firebase init`
3. Copy `.env.local.example` to `.env.local` and fill in values
4. Copy `.firebaserc.example` to `.firebaserc` and add project ID
5. Run development server: `npm run dev`
6. Start Phase 2: Backend Proxy & API Routing

---

## 📝 Notes for Claude

### Context for Future Sessions
- This is an **internal, uncensored AI platform** - security is role-based, not content-filtered
- **LM Studio** is the primary text generation endpoint (server-side HTTP API)
- All model endpoints are abstracted through the Model Registry (Firestore collection)
- Use **Firebase App Hosting** for deployment (not Vercel)
- Dark mode is default and preferred
- Follow the **phase-by-phase** approach - complete each phase before moving to the next

### Code Style Guidelines
- Use **TypeScript** for all files
- Use **async/await** over promises
- Use **functional components** with hooks
- Prefer **server components** in Next.js App Router where possible
- Use **ShadCN UI components** for consistency
- Keep components small and focused
- Extract reusable logic into `lib/` utilities

### Firebase Best Practices
- Always validate auth on the backend
- Use Firebase Admin SDK for privileged operations
- Keep API keys in environment variables or Secret Manager
- Use Firestore security rules as the first line of defense
- Implement rate limiting on API routes
- Log all admin actions to `/logs` collection

---

## 🚨 Important Warnings

1. **Uncensored Content:** This platform is for internal use only. No content filtering is applied by design.
2. **API Keys:** Never commit API keys or service account credentials to version control.
3. **Firebase Rules:** Deploy Firestore and Storage rules before production use.
4. **Rate Limiting:** Implement rate limiting before exposing to broader access.
5. **Cost Monitoring:** Monitor Firebase usage and set billing alerts.

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [ShadCN UI Components](https://ui.shadcn.com/)
- [LM Studio API Docs](https://lmstudio.ai/docs/api)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference)

---

**End of CLAUDE.md**
