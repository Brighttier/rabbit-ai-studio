# Rabbit AI Studio - User Guide for Matt Clemente

**Date:** October 24, 2025  
**To:** Matt Clemente (mclemente@brighttier.com)  
**From:** Development Team  
**Subject:** Rabbit AI Studio Access & Usage Instructions

---

## 🚀 **Platform Overview**

Welcome to **Rabbit AI Studio** - your internal AI generation platform! This system provides access to multiple uncensored AI models for text, image, and video generation, all hosted on our dedicated GPU infrastructure.

**Application URL:** https://rabbit-ai-studio-main--tanzen-186b4.us-east4.hosted.app

---

## 🔐 **Sign In Instructions**

### **Your Account Details:**
- **Email:** mclemente@brighttier.com
- **Password:** [Use your existing password or request reset]

### **Sign In Steps:**
1. Navigate to the application URL above
2. Click **"Sign In"** 
3. Enter your email: `mclemente@brighttier.com`
4. Enter your password (use the **👁️ eye icon** to toggle visibility if needed)
5. Click **"Sign In"** or use **"Sign in with Google"** for faster access

### **If You Experience Login Issues:**
- **Invalid Credential Error:** Contact admin for password reset
- **Account Not Found:** Your account may need to be created by admin
- **Too Many Attempts:** Wait 15 minutes before trying again

---

## 🤖 **Available AI Models**

### **Text Generation (Chat):**
- **Dolphin Llama 3.1 8B** - Best general-purpose uncensored model
- **CodeLlama 13B** - Specialized for programming tasks
- **DarkIdol Llama 3.1 8B** - Completely uncensored creative writing
- **Nidum Gemma 2B** - Fast responses, lightweight
- **Luna AI 7B** - Uncensored conversational AI

### **Image Generation:**
- **Stable Diffusion XL** - High-quality image generation
- **Realistic Vision V5.1** - Photorealistic images
- **ChilloutMix** - Specialized for people/portraits
- **DreamShaper XL** - Artistic and versatile styles

### **Video Generation:**
- **Stable Video Diffusion XT** - 2-4 second video clips from images

---

## 📋 **Basic Usage Instructions**

### **Text Generation (Chat):**
1. Click **"Chat"** or **"Text Generation"** from the home page
2. Select your preferred model from the dropdown
3. Type your prompt in the message box
4. Press **Enter** or click **Send**
5. Watch the response stream in real-time

### **Image Generation:**
1. Click **"Image Generation"** from the home page
2. Select an image model (e.g., "Stable Diffusion XL")
3. Enter your image prompt
4. Optionally adjust settings (resolution, guidance scale)
5. Click **"Generate"**
6. Download or save generated images

### **Video Generation:**
1. Navigate to **"Video Generation"**
2. Upload a starting image
3. Describe the motion/animation you want
4. Click **"Generate Video"**
5. Wait for processing (may take 2-5 minutes)

---

## ⚠️ **IMPORTANT - DO NOT PRESS "SEED MODELS"**

### **Critical Warning:**
**NEVER click the "Seed Models" button in the admin panel.** This will:
- Overwrite all existing model configurations
- Reset all custom settings
- Potentially break the current setup
- Require admin intervention to fix

### **Why This Button Exists:**
- It's for initial setup only
- Used during development/deployment
- Not meant for regular users
- Can cause data loss if used incorrectly

### **If You Accidentally Clicked It:**
1. **Stop immediately** - don't click anything else
2. **Contact admin** right away
3. **Don't try to "fix" it yourself**
4. **Report exactly what happened**

---

## 🎯 **Best Practices**

### **Model Selection:**
- **Quick questions:** Use Nidum Gemma 2B (fastest)
- **Coding help:** Use CodeLlama 13B
- **Creative writing:** Use DarkIdol Llama 3.1 8B
- **General tasks:** Use Dolphin Llama 3.1 8B

### **Prompt Writing:**
- **Be specific:** "Write a Python function to calculate..." instead of "help with code"
- **Set context:** "You are a helpful assistant..." 
- **Ask follow-ups:** Build on previous responses in the same session
- **Use examples:** Show the format you want

### **Performance Tips:**
- **Start with smaller models** for quick tests
- **Use specific prompts** to avoid long responses
- **Keep sessions focused** on one topic
- **Clear browser cache** if experiencing slowdowns

---

## 🔧 **Troubleshooting**

### **Slow Responses:**
- ✅ **Fixed:** Recent static IP implementation should resolve this
- If still slow: Try a smaller model first
- Check your internet connection
- Refresh the page if responses stop

### **Connection Errors:**
- **Refresh the page** and try again
- **Check the model status** on the home page
- **Try a different model** if one isn't responding
- **Contact admin** if all models are down

### **"All Models Unavailable" or "Server Not Responding":**
This usually means the **GPU server is stopped**. Our AI models run on a **Google Cloud spot instance** that may occasionally stop to save costs.

**What is a Spot Instance?**
- **Cost-effective** GPU server (saves ~70% on costs)
- **May stop automatically** during high demand periods
- **Restarts quickly** when needed
- **Static IP preserved** - no configuration changes needed

**If Models Are Not Working:**
1. **Check the home page** - it will show model status
2. **Wait 2-3 minutes** - server may be starting up
3. **Try refreshing** the page after a few minutes
4. **Contact admin** if issue persists longer than 10 minutes

**Admin Can Restart Server:**
- Server restart takes **2-3 minutes**
- **All models preserved** - no data loss
- **Static IP maintained** - no configuration changes
- **Automatic restart** on most shutdowns

**Admin Instructions for Starting Stopped GPU Server:**

1. **Check Server Status:**
   ```bash
   gcloud compute instances describe rabbit-ai-gpu --zone=us-west1-b --project=tanzen-186b4 --format="value(status)"
   ```

2. **If Status Shows "TERMINATED" or "STOPPED", Start Server:**
   ```bash
   gcloud compute instances start rabbit-ai-gpu --zone=us-west1-b --project=tanzen-186b4
   ```

3. **Verify Services After Startup (wait 2-3 minutes):**
   ```bash
   # Test Ollama (Text Models)
   curl -s http://34.83.248.1:11434/api/tags
   
   # Test Automatic1111 (Image Models)
   curl -s http://34.83.248.1:7860/sdapi/v1/samplers
   
   # Test ComfyUI (Video Models)
   curl -s http://34.83.248.1:8188/system_stats
   ```

4. **Check Application Health:**
   ```bash
   curl -s https://rabbit-ai-studio-main--tanzen-186b4.us-east4.hosted.app/api/health
   ```

**Server Details:**
- **Instance Name:** `rabbit-ai-gpu`
- **Project:** `tanzen-186b4`
- **Zone:** `us-west1-b`
- **Static IP:** `34.83.248.1`
- **Startup Time:** ~2-3 minutes for all services

### **Authentication Issues:**
- **Clear browser cookies** for the site
- **Try incognito/private browsing**
- **Use "Sign in with Google"** as alternative
- **Request password reset** if needed

### **Image/Video Generation Fails:**
- **Check file size limits** (max 10MB for uploads)
- **Try simpler prompts** first
- **Wait longer** for video generation (up to 5 minutes)
- **Refresh and retry** if generation stalls

---

## 🔌 **API Access for External Applications**

### **Accessing the API Keys Interface:**
1. Sign in to the application
2. Navigate to **Admin Dashboard** (`/admin`)
3. Click **"API Keys"** button in the header OR
4. Click the **🔑 API Keys** card in Quick Actions
5. This takes you to `/admin/api-keys`

### **Creating an API Key:**
1. Click **"+ Create New API Key"**
2. Enter a descriptive **name** (e.g., "Mobile App", "Python Script")
3. Set **expiration** (0 = never expires, 30 = 30 days, etc.)
4. Click **"Create API Key"**
5. **⚠️ IMPORTANT:** Copy the key immediately - it's only shown once!
6. Store it securely (password manager, environment variable, etc.)

### **Using API Keys in External Apps:**
```bash
# Example with cURL
curl -X POST https://rabbit.brighttier.com/api/generate-text \
  -H "Authorization: Bearer rabbit_sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello AI", "modelId": "dolphin-llama3:8b"}'
```

### **Available API Endpoints:**
- **Text Generation:** `POST /api/generate-text`
- **Image Generation:** `POST /api/generate-image`
- **Video Generation:** `POST /api/generate-video`
- **List Models:** `GET /api/models`

### **Rate Limits:**
- Text: 100 requests/minute
- Images: 20 requests/minute
- Video: 5 requests/minute

### **Full API Documentation:**
See `API_DOCUMENTATION.md` for complete examples in Python, JavaScript, PHP, and more.

---

## 📞 **Support & Contact**

### **For Technical Issues:**
- Email: [Admin Contact]
- Include: Error messages, browser type, steps taken
- Be specific: "I tried to generate an image with prompt X and got error Y"

### **For Access Issues:**
- Password resets
- Account permissions
- New feature requests
- Model additions

### **For Usage Questions:**
- Best model for specific tasks
- Prompt optimization
- Feature explanations
- Performance issues

### **For API Integration:**
- API key issues
- Rate limit increases
- Integration examples
- Webhook setup

---

## 🎉 **Getting Started Checklist**

- [ ] Access the application URL
- [ ] Sign in with your credentials  
- [ ] Test the password visibility toggle
- [ ] Try a simple chat with Dolphin Llama 3.1 8B
- [ ] Generate a test image with Stable Diffusion XL
- [ ] Bookmark the application for easy access
- [ ] **Remember: DO NOT click "Seed Models"**

---

## 📊 **Current System Status**

**Server Infrastructure:**
- **GPU Server:** NVIDIA L4 (24GB VRAM) on Google Cloud
- **Instance Type:** Spot instance (cost-optimized, may occasionally restart)
- **Static IP:** 34.83.248.1 (no more IP changes!)
- **Location:** us-west1-b (Oregon)
- **Uptime:** 99%+ availability (with occasional spot instance restarts)
- **Models:** 11 active models available

**About Our Spot Instance Setup:**
- **Cost Savings:** ~70% cheaper than regular instances
- **Smart Restart:** Automatically restarts when stopped
- **Data Preserved:** All models and configurations maintained
- **Quick Recovery:** 2-3 minute restart time
- **Monitoring:** System alerts admin when server needs attention

**Recent Improvements:**
- ✅ Static IP implementation (faster responses)
- ✅ Password visibility toggle in signin
- ✅ Enhanced model configurations
- ✅ Improved reliability and performance

---

**Enjoy using Rabbit AI Studio! This platform gives you access to powerful, uncensored AI capabilities for all your creative and technical needs.**

**Questions?** Don't hesitate to reach out for support.

---

*This guide was generated on October 24, 2025. For the most up-to-date information, check the application's help section or contact your administrator.*