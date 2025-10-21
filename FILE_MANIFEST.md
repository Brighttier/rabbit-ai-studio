# File Manifest - Rabbit AI Studio

Complete list of all files created in Phase 1, with descriptions.

---

## 📄 Root Configuration Files

### Package Management
- **`package.json`** - NPM dependencies and scripts for the main Next.js app
- **`tsconfig.json`** - TypeScript compiler configuration for the project
- **`.eslintrc.json`** - ESLint configuration for code linting
- **`postcss.config.js`** - PostCSS configuration for processing CSS

### Build & Framework
- **`next.config.js`** - Next.js configuration (standalone output for Firebase)
- **`tailwind.config.ts`** - TailwindCSS configuration with ShadCN theme
- **`components.json`** - ShadCN UI component configuration

### Git & Environment
- **`.gitignore`** - Git ignore patterns (node_modules, .env, Firebase, etc.)
- **`.env.example`** - Template for all environment variables
- **`.env.local.example`** - Template for local development environment

### Firebase
- **`firebase.json`** - Firebase project configuration (hosting, functions, emulators)
- **`.firebaserc.example`** - Firebase project reference template
- **`firestore.rules`** - Firestore security rules (role-based access)
- **`firestore.indexes.json`** - Firestore database indexes for queries
- **`storage.rules`** - Firebase Storage security rules

---

## 📚 Documentation Files

- **`README.md`** - Quick start guide and project overview
- **`CLAUDE.md`** - Comprehensive technical documentation for Claude Code
- **`SETUP.md`** - Step-by-step setup instructions from scratch
- **`PROJECT_STATUS.md`** - Current project status and phase tracking
- **`FILE_MANIFEST.md`** - This file - complete file listing and descriptions

---

## 🎨 App Directory (Next.js App Router)

### Root Files
- **`app/layout.tsx`** - Root layout component with dark mode and global styles
- **`app/page.tsx`** - Homepage with feature cards and warning banner
- **`app/globals.css`** - Global CSS with TailwindCSS imports and custom styles

### Subdirectories (Placeholders for future phases)
- **`app/api/`** - API routes (Phase 2)
- **`app/chat/`** - Text generation UI (Phase 4)
- **`app/image/`** - Image generation UI (Phase 5)
- **`app/admin/`** - Admin dashboard (Phase 6)

---

## 🧩 Components Directory

### UI Components (ShadCN)
- **`components/ui/button.tsx`** - Reusable button component with variants

Future components will include:
- Input, Textarea, Select, Slider
- Dialog, Dropdown, Tabs
- Card, Alert, Badge
- And more...

---

## 📚 Library Directory (`lib/`)

### Firebase Integration
- **`lib/firebase/config.ts`** - Firebase client configuration and validation
- **`lib/firebase/clientApp.ts`** - Firebase client SDK initialization (browser)
- **`lib/firebase/adminApp.ts`** - Firebase Admin SDK initialization (server)

### Utilities
- **`lib/types.ts`** - Comprehensive TypeScript type definitions
  - User, Role, Model types
  - Session, Message types
  - Request/Response types for text and image generation
  - API response types
  - System log types

- **`lib/utils.ts`** - Helper utility functions
  - `cn()` - ClassName merger (clsx + tailwind-merge)
  - `formatDate()` - Date formatting
  - `formatBytes()` - File size formatting
  - `truncateText()` - Text truncation
  - `generateId()` - Unique ID generation
  - `isValidUrl()` - URL validation

---

## ⚡ Functions Directory (Firebase Functions)

### Configuration
- **`functions/package.json`** - NPM dependencies for Firebase Functions (Node 20)
- **`functions/tsconfig.json`** - TypeScript configuration for Functions
- **`functions/src/index.ts`** - Functions entry point with placeholders

Functions to be implemented in Phase 2:
- `generateText` - Proxy to LM Studio for text generation
- `generateImage` - Proxy to Stable Diffusion for image generation
- Authentication middleware
- Rate limiting middleware

---

## 📊 File Breakdown by Category

### Configuration (9 files)
```
package.json
tsconfig.json
next.config.js
tailwind.config.ts
postcss.config.js
.eslintrc.json
components.json
firebase.json
firestore.indexes.json
```

### Security & Rules (2 files)
```
firestore.rules
storage.rules
```

### Environment & Templates (3 files)
```
.env.example
.env.local.example
.firebaserc.example
```

### Documentation (5 files)
```
README.md
CLAUDE.md
SETUP.md
PROJECT_STATUS.md
FILE_MANIFEST.md
```

### Application Code (3 files)
```
app/layout.tsx
app/page.tsx
app/globals.css
```

### Components (1 file)
```
components/ui/button.tsx
```

### Libraries (5 files)
```
lib/firebase/config.ts
lib/firebase/clientApp.ts
lib/firebase/adminApp.ts
lib/types.ts
lib/utils.ts
```

### Firebase Functions (3 files)
```
functions/package.json
functions/tsconfig.json
functions/src/index.ts
```

### Git & Ignore (1 file)
```
.gitignore
```

---

## 📈 File Statistics

**Total Files:** 32
- Configuration: 9
- Security: 2
- Environment: 3
- Documentation: 5
- TypeScript/TSX: 8
- JSON: 4
- CSS: 1

**Total Lines of Code (approx):**
- TypeScript/TSX: ~1,500
- Configuration: ~500
- Documentation: ~2,500
- CSS: ~150
- **Total: ~4,650 lines**

---

## 🔍 Key Files by Purpose

### Getting Started
1. `README.md` - Start here for quick overview
2. `SETUP.md` - Follow this for step-by-step setup
3. `.env.local.example` - Copy and fill this first

### Development
1. `package.json` - Install dependencies with `npm install`
2. `app/page.tsx` - Homepage to verify setup works
3. `lib/types.ts` - Reference for all TypeScript types

### Firebase Configuration
1. `firebase.json` - Main Firebase config
2. `firestore.rules` - Database security rules
3. `storage.rules` - File storage security rules
4. `functions/src/index.ts` - Cloud Functions code

### Understanding the Project
1. `CLAUDE.md` - Technical architecture and roadmap
2. `PROJECT_STATUS.md` - Current status and next steps
3. `FILE_MANIFEST.md` - This file

---

## 🚀 Next Files to Create (Phase 2)

### API Routes
```
app/api/generate-text/route.ts
app/api/generate-image/route.ts
app/api/models/route.ts
```

### Model Providers
```
lib/providers/lmstudio.ts
lib/providers/huggingface.ts
lib/modelRouter.ts
```

### Firebase Functions
```
functions/src/generateText.ts
functions/src/generateImage.ts
functions/src/middleware/auth.ts
functions/src/middleware/rateLimit.ts
```

### Utilities
```
lib/api.ts
lib/auth.ts
lib/streaming.ts
```

---

## 📝 Notes

- All TypeScript files use strict mode
- All React components are functional with hooks
- Firebase rules follow principle of least privilege
- Environment variables separated into public/private
- Documentation follows markdown best practices
- Code follows Next.js 14 App Router conventions

---

**Phase 1 Complete:** All foundation files created and documented. Ready for Phase 2! 🚀
