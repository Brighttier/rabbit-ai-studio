# Rabbit AI Studio - Complete Setup Guide for Bootcamp

**Last Updated:** 2025-10-23
**Project:** Rabbit AI Studio (Multi-Model AI Generation Platform)
**Tech Stack:** Next.js 14, Firebase, TypeScript, TailwindCSS, Ollama, Automatic1111, ComfyUI

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Firebase Project Setup](#firebase-project-setup)
4. [GPU Server Setup (GCP)](#gpu-server-setup-gcp)
5. [Local Development Setup](#local-development-setup)
6. [Environment Configuration](#environment-configuration)
7. [Firebase Configuration](#firebase-configuration)
8. [Deploying to Firebase App Hosting](#deploying-to-firebase-app-hosting)
9. [Initial Admin Setup](#initial-admin-setup)
10. [Troubleshooting](#troubleshooting)
11. [Cost Optimization](#cost-optimization)

---

## Prerequisites

### Required Accounts
- **Google Cloud Platform (GCP) Account** - [console.cloud.google.com](https://console.cloud.google.com)
  - Billing account enabled
  - Free tier: $300 credit for 90 days
- **GitHub Account** - [github.com](https://github.com)
  - For code repository and CI/CD

### Required Tools
Install these on your local machine:

```bash
# Node.js (v20 or higher)
# Download from: https://nodejs.org/
node --version  # Should be v20+

# npm (comes with Node.js)
npm --version  # Should be v10+

# Firebase CLI
npm install -g firebase-tools
firebase --version

# Git
git --version

# Google Cloud SDK (gcloud CLI)
# Download from: https://cloud.google.com/sdk/docs/install
gcloud --version
```

### Required Knowledge
- Basic understanding of React/Next.js
- Basic understanding of Firebase (Auth, Firestore, Storage)
- Basic terminal/command line usage
- Basic understanding of APIs and environment variables

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Chat Page   │  │  Image Page  │  │  Video Page  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Admin Panel │  │  User Mgmt   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE APP HOSTING (Cloud Run)                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Next.js 14 Application (SSR)               │  │
│  │                                                       │  │
│  │  /api/generate-text    → Text Generation API        │  │
│  │  /api/generate-image   → Image Generation API       │  │
│  │  /api/models           → Model Management API       │  │
│  │  /api/admin/*          → Admin APIs                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE SERVICES                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Firestore │  │  Auth (IAM) │  │   Storage   │        │
│  │             │  │             │  │             │        │
│  │  /users     │  │  - Email    │  │  /images    │        │
│  │  /models    │  │  - Google   │  │  /videos    │        │
│  │  /sessions  │  │  - Roles    │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        GCP GPU SERVER (Compute Engine - L4 GPU)              │
│                    IP: 34.127.26.165                         │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Ollama         │  │  Automatic1111  │                  │
│  │  Port: 11434    │  │  Port: 7860     │                  │
│  │  (Text Gen)     │  │  (Image Gen)    │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  ComfyUI        │                                        │
│  │  Port: 8188     │                                        │
│  │  (Video Gen)    │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Frontend (Next.js 14)**
   - Server-side rendering (SSR)
   - Client components for interactivity
   - TailwindCSS + ShadCN UI for styling
   - Firebase Auth for authentication

2. **Backend (Next.js API Routes)**
   - `/api/generate-text` - Proxy to Ollama
   - `/api/generate-image` - Proxy to Automatic1111
   - `/api/generate-video` - Proxy to ComfyUI
   - `/api/models` - Model registry CRUD
   - `/api/admin/*` - Admin operations

3. **Firebase Services**
   - **Authentication** - Email/password + Google OAuth
   - **Firestore** - NoSQL database for users, models, sessions
   - **Storage** - File storage for generated images/videos
   - **App Hosting** - Deployment on Cloud Run

4. **GPU Server (GCP Compute Engine)**
   - **VM Type:** n1-standard-8 (8 vCPUs, 30GB RAM)
   - **GPU:** 1x NVIDIA L4 (24GB VRAM)
   - **OS:** Ubuntu 22.04 LTS
   - **Preemptible:** Yes (cost savings)
   - **Services:**
     - Ollama (local LLMs)
     - Automatic1111 (Stable Diffusion)
     - ComfyUI (video generation)

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Enter project details:
   - **Project Name:** `rabbit-ai-studio` (or your choice)
   - **Project ID:** Will be auto-generated (e.g., `rabbit-ai-studio-xxxxx`)
   - **Google Analytics:** Enable (recommended)
4. Click **"Create Project"**
5. Wait for project creation (30-60 seconds)

### Step 2: Enable Required Services

#### Enable Firebase Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **"Get Started"**
3. Enable sign-in methods:
   - **Email/Password** - Enable
   - **Google** - Enable (optional but recommended)
4. Click **"Save"**

#### Enable Firestore Database

1. Go to **Build > Firestore Database**
2. Click **"Create Database"**
3. Select **"Start in production mode"** (we'll deploy rules later)
4. Choose location: **`us-central` (Iowa)** - same as App Hosting
5. Click **"Enable"**

#### Enable Firebase Storage

1. Go to **Build > Storage**
2. Click **"Get Started"**
3. Select **"Start in production mode"**
4. Choose location: **`us-central1`**
5. Click **"Done"**

### Step 3: Register Web App

1. In Firebase Console, go to **Project Overview**
2. Click the **Web icon** (`</>`)
3. Register app:
   - **App Nickname:** `rabbit-ai-studio`
   - **Firebase Hosting:** Check "Also set up Firebase Hosting"
4. Click **"Register App"**
5. **IMPORTANT:** Copy the Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

Keep this config safe - you'll need it later!

### Step 4: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project from the dropdown
3. Go to **IAM & Admin > Service Accounts**
4. Click **"Create Service Account"**
5. Enter details:
   - **Name:** `firebase-admin`
   - **Description:** "Firebase Admin SDK for backend operations"
6. Click **"Create and Continue"**
7. Grant roles:
   - **Firebase Admin**
   - **Cloud Datastore User**
   - **Storage Admin**
8. Click **"Continue"** → **"Done"**
9. Find the service account, click **Actions (⋮) > Manage Keys**
10. Click **"Add Key" > "Create New Key"**
11. Select **JSON** format
12. Click **"Create"** - downloads a JSON file
13. **IMPORTANT:** Keep this file secure - it grants admin access!

---

## GPU Server Setup (GCP)

### Step 1: Enable Required APIs

In Google Cloud Console:

```bash
# Enable Compute Engine API
gcloud services enable compute.googleapis.com --project=YOUR_PROJECT_ID

# Enable Cloud Build API (for deployments)
gcloud services enable cloudbuild.googleapis.com --project=YOUR_PROJECT_ID
```

### Step 2: Create GPU VM Instance

1. Go to **Compute Engine > VM Instances**
2. Click **"Create Instance"**
3. Configure instance:

**Basic Configuration:**
- **Name:** `rabbit-ai-gpu`
- **Region:** `us-west1` (Oregon) - has L4 GPUs
- **Zone:** `us-west1-b`

**Machine Configuration:**
- **Series:** N1
- **Machine Type:** `n1-standard-8` (8 vCPUs, 30GB RAM)
- **GPU:** Click "Add GPU"
  - **GPU Type:** NVIDIA L4
  - **Number of GPUs:** 1

**Boot Disk:**
- **Operating System:** Ubuntu
- **Version:** Ubuntu 22.04 LTS
- **Boot Disk Type:** Standard persistent disk
- **Size:** 100 GB

**Availability Policies:**
- **Preemptibility:** On (saves ~70% cost)
- **Automatic Restart:** Off (required for preemptible)

**Firewall:**
- Check **"Allow HTTP traffic"**
- Check **"Allow HTTPS traffic"**

4. Click **"Create"**
5. Wait 2-3 minutes for instance to start

### Step 3: Configure Firewall Rules

```bash
# Allow Ollama (11434)
gcloud compute firewall-rules create allow-ollama \
  --allow=tcp:11434 \
  --source-ranges=0.0.0.0/0 \
  --description="Allow Ollama API" \
  --project=YOUR_PROJECT_ID

# Allow Automatic1111 (7860)
gcloud compute firewall-rules create allow-automatic1111 \
  --allow=tcp:7860 \
  --source-ranges=0.0.0.0/0 \
  --description="Allow Automatic1111 API" \
  --project=YOUR_PROJECT_ID

# Allow ComfyUI (8188)
gcloud compute firewall-rules create allow-comfyui \
  --allow=tcp:8188 \
  --source-ranges=0.0.0.0/0 \
  --description="Allow ComfyUI API" \
  --project=YOUR_PROJECT_ID
```

### Step 4: SSH into VM and Install Software

```bash
# SSH into VM
gcloud compute ssh rabbit-ai-gpu --zone=us-west1-b --project=YOUR_PROJECT_ID
```

Inside the VM:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install NVIDIA drivers
sudo apt install -y nvidia-driver-535

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# Reboot to load drivers
sudo reboot
```

Wait 2 minutes, then SSH back in:

```bash
# Verify GPU is detected
nvidia-smi
# Should show NVIDIA L4 GPU

# Verify Docker can access GPU
sudo docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### Step 5: Install Ollama

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Start Ollama service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull models (this will take 10-30 minutes depending on model size)
ollama pull llama3.2:3b        # 3B param model (~2GB)
ollama pull mistral:7b         # 7B param model (~4GB)
ollama pull llama3.1:70b       # 70B param model (~40GB) - optional

# Test Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Hello, world!",
  "stream": false
}'
```

### Step 6: Install Automatic1111 (Stable Diffusion)

```bash
# Install dependencies
sudo apt install -y python3-pip python3-venv git

# Clone Automatic1111
cd ~
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git

# Install and run (first run downloads models - 5-10 minutes)
cd stable-diffusion-webui
./webui.sh --listen --api --xformers

# Wait for "Running on local URL: http://0.0.0.0:7860"
# Press Ctrl+C to stop

# Create systemd service for auto-start
sudo tee /etc/systemd/system/automatic1111.service > /dev/null <<EOF
[Unit]
Description=Automatic1111 Stable Diffusion WebUI
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/stable-diffusion-webui
ExecStart=/home/$USER/stable-diffusion-webui/webui.sh --listen --api --xformers
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable automatic1111
sudo systemctl start automatic1111
```

### Step 7: Install ComfyUI (Video Generation)

```bash
# Clone ComfyUI
cd ~
git clone https://github.com/comfyanonymous/ComfyUI.git

# Install dependencies
cd ComfyUI
python3 -m venv venv
source venv/bin/activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Test run
python main.py --listen 0.0.0.0 --port 8188

# Press Ctrl+C to stop

# Create systemd service
sudo tee /etc/systemd/system/comfyui.service > /dev/null <<EOF
[Unit]
Description=ComfyUI Video Generation
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/ComfyUI
ExecStart=/home/$USER/ComfyUI/venv/bin/python main.py --listen 0.0.0.0 --port 8188
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable comfyui
sudo systemctl start comfyui
```

### Step 8: Get External IP

```bash
# On your local machine
gcloud compute instances describe rabbit-ai-gpu \
  --zone=us-west1-b \
  --project=YOUR_PROJECT_ID \
  --format="get(networkInterfaces[0].accessConfigs[0].natIP)"

# Example output: 34.127.26.165
```

**Save this IP address** - you'll need it for environment variables!

### Step 9: Test Services

```bash
# Replace YOUR_GPU_IP with the IP from Step 8

# Test Ollama
curl http://YOUR_GPU_IP:11434/api/tags

# Test Automatic1111
curl http://YOUR_GPU_IP:7860/sdapi/v1/sd-models

# Test ComfyUI
curl http://YOUR_GPU_IP:8188/system_stats
```

All three should return JSON responses!

---

## Local Development Setup

### Step 1: Clone Repository

```bash
# Create project directory
mkdir rabbit-ai-studio
cd rabbit-ai-studio

# Initialize git
git init

# Create GitHub repository (via GitHub website)
# Then connect local to remote:
git remote add origin https://github.com/YOUR_USERNAME/rabbit-ai-studio.git
```

### Step 2: Download Project Files

You can either:
1. **Download the entire project** from the original repository
2. **Build from scratch** following the architecture

For this guide, we'll assume you're starting with the complete codebase.

### Step 3: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

Expected dependencies:
```
next@15.x
react@18.x
typescript@5.x
firebase@10.x
firebase-admin@12.x
tailwindcss@3.x
@radix-ui/* (ShadCN UI components)
```

---

## Environment Configuration

### Step 1: Create `.env.local`

```bash
# Copy example file
cp .env.example .env.local
```

### Step 2: Configure Firebase Environment Variables

Open `.env.local` and fill in:

```bash
# ============================================
# FIREBASE CLIENT (Frontend)
# ============================================
# Get these from Firebase Console > Project Settings > General > Your Apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# FIREBASE ADMIN (Backend)
# ============================================
# Get these from the service account JSON file you downloaded earlier
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# IMPORTANT: Keep the quotes and \n characters in FIREBASE_PRIVATE_KEY!

# ============================================
# GPU SERVER ENDPOINTS
# ============================================
# Replace YOUR_GPU_IP with the IP from GPU Server Setup Step 8
OLLAMA_BASE_URL=http://YOUR_GPU_IP:11434
AUTOMATIC1111_BASE_URL=http://YOUR_GPU_IP:7860
COMFYUI_BASE_URL=http://YOUR_GPU_IP:8188

# ============================================
# OPTIONAL: THIRD-PARTY AI PROVIDERS
# ============================================
# Hugging Face (for additional models)
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_API_URL=https://api-inference.huggingface.co/models

# Replicate (for video generation)
REPLICATE_API_KEY=r8_...
REPLICATE_API_URL=https://api.replicate.com/v1

# OpenRouter (for premium models)
OPENROUTER_API_KEY=sk-or-...

# ============================================
# APPLICATION SETTINGS
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 3: Extract Private Key from Service Account JSON

The service account JSON file looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

Copy the values:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters and quotes!)

---

## Firebase Configuration

### Step 1: Initialize Firebase in Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already initialized)
firebase init
```

Select:
- ☑ Firestore
- ☑ Hosting
- ☐ Functions (not needed)
- ☑ Storage

Configuration:
- **Firestore Rules:** Use default location (`firestore.rules`)
- **Firestore Indexes:** Use default location (`firestore.indexes.json`)
- **Hosting:** Use `out` directory (Next.js static export)
- **Storage Rules:** Use default location (`storage.rules`)

### Step 2: Set Firebase Project

```bash
# Set default project
firebase use --add

# Select your project from the list
# Enter alias: default
```

This creates `.firebaserc`:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### Step 3: Deploy Firestore Rules

Edit `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             request.auth.token.role == 'admin';
    }

    function isOwner(userId) {
      return isAuthenticated() &&
             request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin() || isOwner(userId);
      allow delete: if isAdmin();
    }

    // Models collection
    match /models/{modelId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
                              resource.data.userId == request.auth.uid;

      // Messages subcollection
      match /messages/{messageId} {
        allow read, write: if isAuthenticated() &&
                             get(/databases/$(database)/documents/sessions/$(sessionId)).data.userId == request.auth.uid;
      }
    }

    // Logs collection (admin only)
    match /logs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

### Step 4: Deploy Storage Rules

Edit `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             request.auth.token.role == 'admin';
    }

    // User profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() &&
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }

    // Generated images (backend writes only)
    match /images/{userId}/{sessionId}/{fileName} {
      allow read: if isAuthenticated() &&
                     request.auth.uid == userId;
      allow write: if false; // Backend only via Admin SDK
    }

    // Generated videos (backend writes only)
    match /videos/{userId}/{sessionId}/{fileName} {
      allow read: if isAuthenticated() &&
                     request.auth.uid == userId;
      allow write: if false; // Backend only via Admin SDK
    }

    // Public assets
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only storage:rules
```

---

## Deploying to Firebase App Hosting

### Step 1: Setup GitHub Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Rabbit AI Studio"

# Create GitHub repository via GitHub website
# Then push:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rabbit-ai-studio.git
git push -u origin main
```

### Step 2: Enable Firebase App Hosting

```bash
# Install latest Firebase CLI
npm install -g firebase-tools@latest

# Enable App Hosting (experimental)
firebase experiments:enable webframeworks
```

### Step 3: Create App Hosting Backend

```bash
# Create backend
firebase apphosting:backends:create \
  --project=your-project-id \
  --location=us-central1
```

You'll be prompted:
- **Backend ID:** `rabbit-ai-studio-main`
- **Repository:** Connect your GitHub repo
- **Branch:** `main`
- **Root directory:** `/` (default)

### Step 4: Configure Production Environment Variables

Create `apphosting.yaml`:

```yaml
# apphosting.yaml
runConfig:
  minInstances: 0
  maxInstances: 4
  concurrency: 80
  cpu: 1
  memoryMiB: 512

env:
  # Firebase (use same values as .env.local)
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: "AIzaSy..."
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: "your-project.firebaseapp.com"
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: "your-project-id"
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: "your-project.firebasestorage.app"
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "123456789"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: "1:123456789:web:abc123"

  # GPU Server (use your GPU server IP)
  - variable: OLLAMA_BASE_URL
    value: "http://YOUR_GPU_IP:11434"
  - variable: AUTOMATIC1111_BASE_URL
    value: "http://YOUR_GPU_IP:7860"
  - variable: COMFYUI_BASE_URL
    value: "http://YOUR_GPU_IP:8188"

  # Optional providers
  - variable: HUGGINGFACE_API_KEY
    secret: huggingface-api-key
  - variable: REPLICATE_API_KEY
    secret: replicate-api-key
  - variable: OPENROUTER_API_KEY
    secret: openrouter-api-key

  # Firebase Admin (use Google Secret Manager)
  - variable: FIREBASE_PROJECT_ID
    value: "your-project-id"
  - variable: FIREBASE_CLIENT_EMAIL
    secret: firebase-client-email
  - variable: FIREBASE_PRIVATE_KEY
    secret: firebase-private-key
```

### Step 5: Create Secrets in Google Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=your-project-id

# Create secrets from service account JSON
# Extract client_email
gcloud secrets create firebase-client-email \
  --data-file=- \
  --project=your-project-id <<< "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# Extract private_key (from JSON file)
gcloud secrets create firebase-private-key \
  --data-file=- \
  --project=your-project-id < private_key.txt

# Create Hugging Face API key (if using)
gcloud secrets create huggingface-api-key \
  --data-file=- \
  --project=your-project-id <<< "hf_..."

# Create Replicate API key (if using)
gcloud secrets create replicate-api-key \
  --data-file=- \
  --project=your-project-id <<< "r8_..."

# Create OpenRouter API key (if using)
gcloud secrets create openrouter-api-key \
  --data-file=- \
  --project=your-project-id <<< "sk-or-..."
```

### Step 6: Grant Secret Access to App Hosting

```bash
# Get the App Hosting service account
# It's usually: service-PROJECT_NUMBER@gcp-sa-firebaseapphosting.iam.gserviceaccount.com

# Grant access to each secret
gcloud secrets add-iam-policy-binding firebase-client-email \
  --member="serviceAccount:service-PROJECT_NUMBER@gcp-sa-firebaseapphosting.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=your-project-id

gcloud secrets add-iam-policy-binding firebase-private-key \
  --member="serviceAccount:service-PROJECT_NUMBER@gcp-sa-firebaseapphosting.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=your-project-id

# Repeat for other secrets...
```

### Step 7: Deploy!

```bash
# Commit apphosting.yaml
git add apphosting.yaml
git commit -m "Add App Hosting configuration"
git push origin main

# Firebase App Hosting will automatically detect the push and deploy
# Monitor deployment:
firebase apphosting:backends:get rabbit-ai-studio-main --project=your-project-id
```

Deployment takes 5-10 minutes. You'll get a URL like:
```
https://rabbit-ai-studio-main-RANDOM.web.app
```

---

## Initial Admin Setup

### Step 1: Start Local Development Server

```bash
npm run dev
```

Open: http://localhost:3000

### Step 2: Create First Admin User

Since the app is now internal-only, you need to create users manually via Firebase Console:

**Option 1: Via Firebase Console**

1. Go to Firebase Console > Authentication > Users
2. Click "Add User"
3. Enter:
   - **Email:** admin@yourdomain.com
   - **Password:** (temporary password)
4. Click "Add User"
5. Click on the user
6. Go to "Custom Claims" tab
7. Add claims:
```json
{
  "role": "admin",
  "mustChangePassword": false
}
```

**Option 2: Via gcloud CLI**

```bash
# Use the create user API (requires Firebase Admin SDK setup)
# Easier to use the Firebase Console for first user
```

### Step 3: Sign In and Test

1. Go to your deployed URL: https://your-app.web.app/auth/signin
2. Sign in with admin credentials
3. You should be redirected to home page
4. Click "Admin Dashboard"
5. Verify you can access admin features

### Step 4: Seed Initial Models

1. Go to Admin Dashboard
2. Click "Seed Models" button
3. This will populate the `/models` collection with default models:
   - Ollama text models (llama3.2, mistral)
   - Automatic1111 image models
   - ComfyUI video workflows

### Step 5: Create Additional Users

1. Go to Admin > User Management
2. Click "Create New User"
3. Fill in:
   - **Email:** user@example.com
   - **Password:** temporary123 (they'll be forced to change)
   - **Display Name:** Test User
   - **Role:** User or Admin
4. Click "Create User"
5. Send credentials to user
6. User must change password on first login

---

## Troubleshooting

### GPU Server Issues

**Problem:** "Server is Offline" banner shows

**Solution:**
```bash
# Check if instance is running
gcloud compute instances describe rabbit-ai-gpu \
  --zone=us-west1-b \
  --project=your-project-id \
  --format="get(status)"

# If TERMINATED, start it
gcloud compute instances start rabbit-ai-gpu \
  --zone=us-west1-b \
  --project=your-project-id

# Wait 2-3 minutes for services to start
# Check external IP (may have changed)
gcloud compute instances describe rabbit-ai-gpu \
  --zone=us-west1-b \
  --project=your-project-id \
  --format="get(networkInterfaces[0].accessConfigs[0].natIP)"

# If IP changed, update .env.local and apphosting.yaml
```

**Problem:** Services not responding after server starts

**Solution:**
```bash
# SSH into server
gcloud compute ssh rabbit-ai-gpu --zone=us-west1-b

# Check service status
sudo systemctl status ollama
sudo systemctl status automatic1111
sudo systemctl status comfyui

# Restart services if needed
sudo systemctl restart ollama
sudo systemctl restart automatic1111
sudo systemctl restart comfyui

# Check logs
sudo journalctl -u ollama -n 50
sudo journalctl -u automatic1111 -n 50
sudo journalctl -u comfyui -n 50
```

### Authentication Issues

**Problem:** "Unauthorized" errors in console

**Solution:**
```bash
# Verify Firebase config is correct
# Check .env.local has correct values
# Verify service account JSON is valid
# Check custom claims in Firebase Console > Authentication > Users > [user] > Custom Claims
```

**Problem:** "Token has expired" errors

**Solution:**
```bash
# This happens after 1 hour
# Refresh the page to get new token
# Or implement token refresh logic in client
```

### Deployment Issues

**Problem:** "Build failed" during deployment

**Solution:**
```bash
# Check build logs in Firebase Console
# Common issues:
# - Missing environment variables in apphosting.yaml
# - Incorrect Node.js version (must be 20+)
# - Missing dependencies in package.json

# Test build locally first:
npm run build
```

**Problem:** "Secret not found" errors

**Solution:**
```bash
# Verify secrets exist
gcloud secrets list --project=your-project-id

# Verify IAM permissions
gcloud secrets get-iam-policy firebase-client-email --project=your-project-id

# Add permissions if missing (see Step 6 above)
```

### Model Issues

**Problem:** Models not showing in list

**Solution:**
```bash
# Check Firestore rules allow read access
# Verify /models collection exists in Firestore
# Run seed models from admin panel
# Check browser console for errors
```

**Problem:** Generation fails with "Model not found"

**Solution:**
```bash
# Verify model exists in /models collection
# Check model.endpointURL is correct
# Test endpoint manually with curl
curl http://YOUR_GPU_IP:11434/api/tags
```

---

## Cost Optimization

### GPU Server Costs

**Current Configuration:**
- n1-standard-8: ~$0.38/hour
- NVIDIA L4 GPU: ~$0.70/hour
- **Preemptible:** ~70% discount
- **Total:** ~$0.32/hour = **~$240/month** (if running 24/7)

**Cost Savings:**

1. **Use Preemptible Instances** (already enabled)
   - Saves ~70% vs. on-demand
   - Can be shut down by Google with 30-second warning
   - Good for development/testing

2. **Stop Instance When Not in Use**
   ```bash
   # Stop instance
   gcloud compute instances stop rabbit-ai-gpu --zone=us-west1-b

   # Start instance
   gcloud compute instances start rabbit-ai-gpu --zone=us-west1-b
   ```
   - You only pay for disk storage when stopped (~$10/month)

3. **Use Scheduled Shutdowns**
   ```bash
   # Create Cloud Scheduler job to stop instance at midnight
   gcloud scheduler jobs create app-engine shutdown-gpu \
     --schedule="0 0 * * *" \
     --time-zone="America/Los_Angeles" \
     --uri="https://compute.googleapis.com/compute/v1/projects/YOUR_PROJECT/zones/us-west1-b/instances/rabbit-ai-gpu/stop" \
     --http-method=POST
   ```

4. **Use Smaller GPU for Development**
   - Switch to T4 GPU (~$0.35/hour) for testing
   - Use L4 only for production/demos

### Firebase Costs

**Free Tier (Spark Plan):**
- Authentication: 50,000 MAU (monthly active users)
- Firestore: 1GB storage, 50K reads, 20K writes per day
- Storage: 5GB storage, 1GB download per day
- Hosting: 10GB storage, 360MB/day transfer

**Blaze Plan (Pay-as-you-go):**
- Only charges when you exceed free tier
- Typical costs for small app: $0-25/month

**Cost Control:**
```bash
# Set billing budget alerts in GCP Console
# Go to Billing > Budgets & Alerts
# Set alert at $50, $100, $200
```

### Overall Monthly Cost Estimate

**Development (GPU stopped most of the time):**
- GPU Server: ~$10 (disk storage only)
- Firebase: $0-5 (within free tier)
- **Total: ~$15/month**

**Production (GPU running 8 hours/day):**
- GPU Server: ~$80 (8h × 30d × $0.32)
- Firebase: $5-25 (depending on usage)
- **Total: ~$105/month**

**Production (GPU running 24/7):**
- GPU Server: ~$240
- Firebase: $5-25
- **Total: ~$265/month**

---

## Summary Checklist

### Before Starting
- [ ] GCP account with billing enabled
- [ ] GitHub account
- [ ] Node.js 20+ installed
- [ ] Firebase CLI installed
- [ ] gcloud CLI installed

### Firebase Setup
- [ ] Firebase project created
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Web app registered
- [ ] Firebase config copied
- [ ] Service account created and JSON downloaded

### GPU Server Setup
- [ ] VM instance created with L4 GPU
- [ ] Firewall rules configured
- [ ] NVIDIA drivers installed
- [ ] Ollama installed and models pulled
- [ ] Automatic1111 installed and running
- [ ] ComfyUI installed and running
- [ ] External IP documented

### Local Development
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created and configured
- [ ] Firebase initialized (`firebase init`)
- [ ] `.firebaserc` configured
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Dev server runs successfully (`npm run dev`)

### Deployment
- [ ] GitHub repository created and code pushed
- [ ] `apphosting.yaml` created
- [ ] Secrets created in Secret Manager
- [ ] IAM permissions granted for secrets
- [ ] App Hosting backend created
- [ ] First deployment successful
- [ ] Production URL accessible

### Initial Setup
- [ ] First admin user created
- [ ] Admin can sign in
- [ ] Models seeded
- [ ] GPU server responding
- [ ] Test generation (text, image) works
- [ ] Additional users created

---

## Additional Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Automatic1111 API](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)

### Support
- Firebase Support: [firebase.google.com/support](https://firebase.google.com/support)
- GCP Support: [console.cloud.google.com/support](https://console.cloud.google.com/support)
- Stack Overflow: [stackoverflow.com](https://stackoverflow.com)

### Community
- Firebase Discord: [discord.gg/firebase](https://discord.gg/firebase)
- Next.js Discord: [nextjs.org/discord](https://nextjs.org/discord)

---

## License

This guide is provided as-is for educational purposes. Use at your own risk.

**Important:**
- Keep API keys and service account credentials secure
- Follow GCP and Firebase terms of service
- Monitor costs and set billing alerts
- This is an internal application - do not expose publicly without proper security review

---

**Last Updated:** 2025-10-23
**Version:** 1.0
**Maintained By:** Rabbit AI Studio Team

---

## Appendix: Project File Structure

```
rabbit-ai-studio/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/
│   │   │   ├── gpu-server/route.ts
│   │   │   ├── models/route.ts
│   │   │   ├── seed-models/route.ts
│   │   │   ├── stats/route.ts
│   │   │   └── users/
│   │   │       ├── route.ts
│   │   │       └── [uid]/
│   │   │           ├── route.ts
│   │   │           └── reset-password/route.ts
│   │   ├── generate-image/route.ts
│   │   ├── generate-text/route.ts
│   │   ├── generate-video/route.ts
│   │   ├── models/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── test/route.ts
│   │   └── users/
│   │       └── change-password/route.ts
│   ├── admin/                    # Admin Pages
│   │   ├── page.tsx
│   │   ├── models/page.tsx
│   │   └── users/page.tsx
│   ├── auth/                     # Auth Pages
│   │   ├── signin/page.tsx
│   │   ├── signup/page.tsx
│   │   └── change-password/page.tsx
│   ├── chat/page.tsx             # Chat Interface
│   ├── image/page.tsx            # Image Generation
│   ├── video/page.tsx            # Video Generation
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # Home Page
│   └── globals.css               # Global Styles
├── components/                   # React Components
│   ├── ui/                       # ShadCN UI Components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── ChatInterface.tsx
│   ├── ImageGenerator.tsx
│   ├── VideoGenerator.tsx
│   ├── ModelSelector.tsx
│   ├── GPUServerControl.tsx
│   ├── GPUServerStatusBanner.tsx
│   ├── ModelDialog.tsx
│   └── ...
├── lib/                          # Utility Libraries
│   ├── firebase/
│   │   ├── config.ts             # Firebase Client Config
│   │   ├── clientApp.ts          # Firebase Client SDK
│   │   ├── adminApp.ts           # Firebase Admin SDK
│   │   └── auth.tsx              # Auth Context Provider
│   ├── middleware/
│   │   ├── auth.ts               # Auth Middleware
│   │   └── errorHandler.ts      # Error Handler
│   ├── providers/
│   │   ├── ollama.ts
│   │   ├── automatic1111.ts
│   │   ├── comfyui.ts
│   │   ├── huggingface.ts
│   │   └── openrouter.ts
│   ├── types.ts                  # TypeScript Types
│   ├── utils.ts                  # Helper Utilities
│   └── modelRouter.ts            # Model Routing Logic
├── public/                       # Static Assets
│   ├── favicon.ico
│   └── ...
├── .env.local                    # Environment Variables (DO NOT COMMIT)
├── .env.example                  # Environment Template
├── .firebaserc                   # Firebase Project Config
├── .gitignore                    # Git Ignore Rules
├── apphosting.yaml               # App Hosting Config
├── components.json               # ShadCN UI Config
├── firebase.json                 # Firebase Config
├── firestore.rules               # Firestore Security Rules
├── firestore.indexes.json        # Firestore Indexes
├── next.config.js                # Next.js Config
├── package.json                  # Node Dependencies
├── storage.rules                 # Storage Security Rules
├── tailwind.config.ts            # Tailwind Config
├── tsconfig.json                 # TypeScript Config
├── CLAUDE.md                     # Project Documentation
├── README.md                     # Setup Instructions
└── BOOTCAMP_SETUP_GUIDE.md       # This guide!
```

---

**End of Bootcamp Setup Guide**
