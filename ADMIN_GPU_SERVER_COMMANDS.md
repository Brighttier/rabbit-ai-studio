# Admin Quick Reference - GPU Server Management

**For:** Rabbit AI Studio GPU Server (rabbit-ai-gpu)  
**Last Updated:** October 24, 2025

---

## 🖥️ **Server Information**
- **Instance Name:** `rabbit-ai-gpu`
- **Project:** `tanzen-186b4`
- **Zone:** `us-west1-b`
- **Static IP:** `34.83.248.1`
- **GPU:** NVIDIA L4 (24GB VRAM)
- **Type:** Spot instance (cost-optimized)

---

## 🔍 **Check Server Status**
```bash
gcloud compute instances describe rabbit-ai-gpu \
  --zone=us-west1-b \
  --project=tanzen-186b4 \
  --format="value(status)"
```

**Possible Status Values:**
- `RUNNING` - Server is operational
- `TERMINATED` - Server is stopped (needs restart)
- `STOPPING` - Server is in process of stopping
- `PROVISIONING` - Server is starting up

---

## ▶️ **Start Stopped Server**
```bash
gcloud compute instances start rabbit-ai-gpu \
  --zone=us-west1-b \
  --project=tanzen-186b4
```

**Expected Output:**
```
Starting instance(s) rabbit-ai-gpu...
done.
Instance internal IP is 10.138.0.2
Instance external IP is 34.83.248.1
```

---

## ⏹️ **Stop Server (if needed)**
```bash
gcloud compute instances stop rabbit-ai-gpu \
  --zone=us-west1-b \
  --project=tanzen-186b4
```

---

## 🧪 **Test Services After Startup**

**Wait 2-3 minutes after starting, then test:**

### **1. Test Ollama (Text Models):**
```bash
curl -s http://34.83.248.1:11434/api/tags
```
**Expected:** JSON response with model list

### **2. Test Automatic1111 (Image Models):**
```bash
curl -s http://34.83.248.1:7860/sdapi/v1/samplers
```
**Expected:** JSON array with sampler information

### **3. Test ComfyUI (Video Models):**
```bash
curl -s http://34.83.248.1:8188/system_stats
```
**Expected:** JSON with system statistics

### **4. Test Application Health:**
```bash
curl -s https://rabbit-ai-studio-main--tanzen-186b4.us-east4.hosted.app/api/health
```
**Expected:** JSON with service status showing providers as `true`

---

## 📊 **Quick Health Check Script**
```bash
#!/bin/bash
echo "🔍 Checking GPU Server Status..."
STATUS=$(gcloud compute instances describe rabbit-ai-gpu --zone=us-west1-b --project=tanzen-186b4 --format="value(status)")
echo "Server Status: $STATUS"

if [ "$STATUS" = "RUNNING" ]; then
    echo "✅ Server is running, testing services..."
    echo ""
    
    echo "🤖 Testing Ollama..."
    curl -s http://34.83.248.1:11434/api/tags > /dev/null && echo "✅ Ollama OK" || echo "❌ Ollama Failed"
    
    echo "🎨 Testing Automatic1111..."
    curl -s http://34.83.248.1:7860/sdapi/v1/samplers > /dev/null && echo "✅ Automatic1111 OK" || echo "❌ Automatic1111 Failed"
    
    echo "🎬 Testing ComfyUI..."
    curl -s http://34.83.248.1:8188/system_stats > /dev/null && echo "✅ ComfyUI OK" || echo "❌ ComfyUI Failed"
    
    echo "🌐 Testing Application..."
    curl -s https://rabbit-ai-studio-main--tanzen-186b4.us-east4.hosted.app/api/health > /dev/null && echo "✅ Application OK" || echo "❌ Application Failed"
    
elif [ "$STATUS" = "TERMINATED" ] || [ "$STATUS" = "STOPPED" ]; then
    echo "⚠️  Server is stopped, starting now..."
    gcloud compute instances start rabbit-ai-gpu --zone=us-west1-b --project=tanzen-186b4
    echo "⏳ Wait 2-3 minutes for services to start, then test again"
else
    echo "🔄 Server is in transition state: $STATUS"
    echo "⏳ Wait a moment and check again"
fi
```

---

## 🚨 **Common Issues & Solutions**

### **Issue: Models not responding**
**Solution:** 
1. Check server status (may be stopped)
2. Start server if needed
3. Wait 2-3 minutes for services to initialize

### **Issue: Spot instance terminated**
**Solution:**
1. This is normal behavior for cost optimization
2. Start the server manually
3. All data and models are preserved

### **Issue: Services not starting after server start**
**Solution:**
1. Wait up to 5 minutes for full initialization
2. Check individual service endpoints
3. If persistent, restart the server again

### **Issue: Static IP not responding**
**Solution:**
1. Verify server is running
2. Check if static IP assignment is correct
3. Static IP should always be `34.83.248.1`

---

## 💰 **Cost Management**

**Spot Instance Benefits:**
- **~70% cost savings** vs regular instances
- **Automatic restart** capability
- **Data persistence** through disk snapshots

**Best Practices:**
- **Stop server** when not in use for extended periods
- **Monitor usage** through Google Cloud Console
- **Let spot preemption happen** (it will restart automatically)

---

## 📞 **Emergency Contacts**

**If server issues persist:**
1. Check Google Cloud Console for alerts
2. Review server logs in Compute Engine
3. Contact development team with specific error messages
4. Include output of status and test commands

---

**Last Verified:** October 24, 2025  
**Next Review:** Check monthly for updates