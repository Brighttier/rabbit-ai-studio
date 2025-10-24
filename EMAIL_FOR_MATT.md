# Email for Matt Clemente - Rabbit AI Studio Access

**Subject:** Your Rabbit AI Studio Access is Ready - Important Usage Instructions

---

Hi Matt,

Your access to **Rabbit AI Studio** is now ready! This is our internal AI platform with uncensored models for text, image, and video generation.

## 🔗 **Access Information**
**URL:** https://rabbit-ai-studio-main--tanzen-186b4.us-east4.hosted.app  
**Email:** mclemente@brighttier.com  
**Sign In:** Use your existing password or Google sign-in

## ⚠️ **CRITICAL WARNING - READ THIS FIRST**
**DO NOT click the "Seed Models" button** if you see it anywhere in the interface. This will break the system and require admin intervention to fix. It's only for initial setup, not regular use.

## 🚀 **Quick Start Guide**

### **Available Models:**
- **Text Chat:** Dolphin Llama 3.1 8B (best general use), CodeLlama 13B (coding), DarkIdol 8B (creative)
- **Images:** Stable Diffusion XL, Realistic Vision V5.1, ChilloutMix
- **Video:** Stable Video Diffusion (2-4 second clips)

### **How to Use:**
1. **Sign in** with your email
2. **Choose "Chat"** for text generation or **"Image Generation"** for images
3. **Select a model** from the dropdown
4. **Enter your prompt** and hit send/generate
5. **Watch responses stream** in real-time

### **Pro Tips:**
- Start with **Dolphin Llama 3.1 8B** for general tasks
- Use **CodeLlama 13B** for programming help
- Be specific in prompts: "Write a Python function to..." vs "help with code"
- Try the **👁️ password visibility toggle** on the signin page

## 🔧 **Recent Improvements**
- **Fixed slow responses** with static IP implementation
- **Added password visibility toggle** to signin
- **Enhanced model reliability** and performance
- **API access enabled** for external applications
- **11 active models** ready to use

## 🔑 **API Access for External Apps**
You can now generate API keys for external applications! Access the **Admin Dashboard** → **API Keys** to:
- Create API keys for mobile apps, scripts, or other services
- Set expiration dates or create permanent keys
- Monitor usage and manage key permissions
- See full documentation at API_DOCUMENTATION.md

## 📞 **Need Help?**
- **Login issues:** Contact admin for password reset
- **Models not responding:** GPU server may be restarting (wait 2-3 minutes)
- **Technical problems:** Include error messages and what you were trying to do
- **Usage questions:** Feel free to experiment, but remember the "Seed Models" warning!

## 🖥️ **About Our GPU Server**
Our AI models run on a **Google Cloud spot instance** (NVIDIA L4 GPU):
- **Cost-effective** setup saves ~70% on infrastructure costs
- **May occasionally restart** during high demand periods
- **Quick recovery** - server restarts in 2-3 minutes
- **Static IP maintained** - no configuration changes needed
- **All models preserved** - no data loss during restarts

**Admin Quick Start Commands:**
```bash
# Check if server is running
gcloud compute instances describe rabbit-ai-gpu --zone=us-west1-b --project=tanzen-186b4 --format="value(status)"

# Start server if stopped
gcloud compute instances start rabbit-ai-gpu --zone=us-west1-b --project=tanzen-186b4

# Test services after startup (wait 2-3 minutes)
curl -s http://34.83.248.1:11434/api/tags
```

## 🎯 **Remember:**
- This is an **internal, uncensored platform** - use responsibly
- All models are **self-hosted** on our GPU infrastructure
- **No content filtering** - designed for maximum utility
- **Don't click "Seed Models"** - seriously, this is important!

The platform is ready to go and should provide fast, reliable responses. The recent static IP implementation has resolved the performance issues we were experiencing.

**Enjoy the new AI capabilities!**

Best regards,  
Development Team

---

*P.S. - If you accidentally click "Seed Models", stop immediately and contact admin. Don't try to fix it yourself.*