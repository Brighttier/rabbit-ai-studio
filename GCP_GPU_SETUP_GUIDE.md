# 🚀 GCP GPU Spot Instance Setup Guide
## Rabbit AI Studio - Self-Hosted Uncensored AI Models

**Budget:** $200/month
**Total Cost:** ~$170/month (GPU VM) + $20/month (Firebase) = **$190/month** ✅

---

## 📋 **Quick Summary**

You'll set up:
- **Text Models** (6): Dolphin, DarkIdol, Hermes, etc. → Ollama on GPU
- **Image Models** (4): SDXL, Realistic Vision, ChilloutMix, DreamShaper → Automatic1111
- **Video Models** (3): Stable Video Diffusion → ComfyUI

All running on a single **NVIDIA L4 GPU spot instance** in `us-west1-b` (Oregon).

---

## 🎯 **STEP 1: Create GPU Spot Instance**

### **1.1 Create the VM**

```bash
# Set your project
gcloud config set project tanzen-186b4

# Create GPU spot instance (L4 GPU - 24GB VRAM)
gcloud compute instances create rabbit-ai-gpu \
  --project=tanzen-186b4 \
  --zone=us-west1-b \
  --machine-type=g2-standard-4 \
  --accelerator=type=nvidia-l4,count=1 \
  --provisioning-model=SPOT \
  --instance-termination-action=STOP \
  --maintenance-policy=TERMINATE \
  --boot-disk-size=150GB \
  --boot-disk-type=pd-balanced \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --metadata=install-nvidia-driver=True \
  --tags=ai-server \
  --scopes=https://www.googleapis.com/auth/cloud-platform

# Cost: ~$150/month (spot) + $20 storage = $170/month
# Performance: 2x faster than T4, 24GB VRAM (vs 16GB)
```

### **1.2 Configure Firewall**

```bash
# Allow AI API ports
gcloud compute firewall-rules create allow-ai-api \
  --project=tanzen-186b4 \
  --allow=tcp:11434,tcp:7860,tcp:8188 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=ai-server \
  --description="Allow Ollama (11434), Automatic1111 (7860), ComfyUI (8188)"
```

### **1.3 Reserve Static IP (Optional but Recommended)**

```bash
# Reserve external IP
gcloud compute addresses create rabbit-ai-ip \
  --project=tanzen-186b4 \
  --region=us-central1

# Get the IP
gcloud compute addresses describe rabbit-ai-ip --region=us-central1

# Note the IP address (e.g., 34.123.45.67)
```

---

## 🎯 **STEP 2: Install AI Software**

### **2.1 SSH into VM**

```bash
gcloud compute ssh rabbit-ai-gpu \
  --project=tanzen-186b4 \
  --zone=us-west1-b
```

### **2.2 Verify GPU**

```bash
# Check NVIDIA driver
nvidia-smi

# Should show:
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 535.xx       Driver Version: 535.xx       CUDA Version: 12.2     |
# |-------------------------------+----------------------+----------------------+
# | GPU  Name        TCC/WDDM | Bus-Id        Disp.A | Volatile Uncorr. ECC |
# | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
# |===============================+======================+======================|
# |   0  NVIDIA L4           Off  | 00000000:00:04.0 Off |                    0 |
# | N/A   40C    P0    30W /  72W |      0MiB / 23034MiB |      0%      Default |
# +-------------------------------+----------------------+----------------------+
# 24GB VRAM - 50% more than T4!
```

If driver not installed:
```bash
# Install NVIDIA driver
sudo apt update
sudo apt install -y nvidia-driver-535 nvidia-utils-535
sudo reboot

# Wait 2 minutes, then SSH back in
gcloud compute ssh rabbit-ai-gpu --project=tanzen-186b4 --zone=us-west1-b
```

---

## 🎯 **STEP 3: Install Ollama (Text Models)**

### **3.1 Install Ollama**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
ollama --version
```

### **3.2 Download Uncensored Text Models**

```bash
# Pull uncensored models (this will take 30-60 minutes)
ollama pull dolphin-llama3:8b           # Dolphin 2.9.4 (4.9GB)
ollama pull nous-hermes2:7b-dpo         # Nous-Hermes-2 (4.1GB)

# Optional: Larger models if you want
# ollama pull dolphin-llama3:13b        # 13B version (7.3GB)
```

### **3.3 Configure Ollama for Remote Access**

```bash
# Edit systemd service
sudo systemctl edit ollama

# Add these lines in the editor:
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"

# Save and exit (Ctrl+X, Y, Enter)

# Restart Ollama
sudo systemctl restart ollama

# Verify it's listening
curl http://localhost:11434/api/tags
```

### **3.4 Test Ollama**

```bash
# Test locally
ollama run dolphin-llama3:8b "Write a short poem about AI"

# Test API
curl http://localhost:11434/api/generate -d '{
  "model": "dolphin-llama3:8b",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

---

## 🎯 **STEP 4: Install Automatic1111 (Image Models)**

### **4.1 Install Dependencies**

```bash
# Install Python and dependencies
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git wget libgl1 libglib2.0-0

# Install PyTorch with CUDA support
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### **4.2 Install Automatic1111**

```bash
# Clone repository
cd ~
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui
```

### **4.3 Download Uncensored Image Models**

```bash
# Download models (this will take 30-60 minutes)
cd models/Stable-diffusion

# SDXL Base 1.0 (6.5GB)
wget -c https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

# Realistic Vision V5.1 (2.1GB) - Best for realistic images
wget -c https://huggingface.co/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/realisticVisionV51_v51VAE.safetensors

# DreamShaper XL (6.5GB) - Versatile artistic model
wget -c https://huggingface.co/Lykon/dreamshaper-xl-1-0/resolve/main/DreamShaperXL_Turbo_v2.safetensors

# ChilloutMix (2GB) - NSFW capable, photorealistic
wget -c "https://civitai.com/api/download/models/11745?type=Model&format=SafeTensor&size=full&fp=fp16" -O chilloutmix.safetensors

cd ~/stable-diffusion-webui
```

### **4.4 Create Startup Script**

```bash
# Create launch script
nano start-auto1111.sh
```

Paste this content:
```bash
#!/bin/bash
cd /home/$USER/stable-diffusion-webui
python3 launch.py \
  --api \
  --listen \
  --port 7860 \
  --xformers \
  --enable-insecure-extension-access \
  --no-half-vae
```

```bash
# Make executable
chmod +x start-auto1111.sh
```

### **4.5 Create Systemd Service**

```bash
# Create service file
sudo nano /etc/systemd/system/automatic1111.service
```

Paste this content (replace `YOUR_USERNAME`):
```ini
[Unit]
Description=Automatic1111 Stable Diffusion WebUI
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/stable-diffusion-webui
ExecStart=/bin/bash /home/YOUR_USERNAME/stable-diffusion-webui/start-auto1111.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Replace YOUR_USERNAME with your actual username
sudo sed -i "s/YOUR_USERNAME/$USER/g" /etc/systemd/system/automatic1111.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable automatic1111
sudo systemctl start automatic1111

# Check status
sudo systemctl status automatic1111

# View logs
sudo journalctl -u automatic1111 -f
```

### **4.6 Test Automatic1111**

```bash
# Wait 2-3 minutes for startup, then test
curl http://localhost:7860/sdapi/v1/sd-models

# Test image generation
curl -X POST http://localhost:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful landscape",
    "steps": 20,
    "width": 512,
    "height": 512
  }'
```

---

## 🎯 **STEP 5: Install ComfyUI (Video Models)**

### **5.1 Install ComfyUI**

```bash
# Clone ComfyUI
cd ~
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### **5.2 Download Video Models**

```bash
# Download Stable Video Diffusion model (9.6GB)
cd models/checkpoints
wget -c https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1/resolve/main/svd_xt_1_1.safetensors

cd ~/ComfyUI
```

### **5.3 Create Systemd Service**

```bash
# Create service
sudo nano /etc/systemd/system/comfyui.service
```

Paste this content (replace `YOUR_USERNAME`):
```ini
[Unit]
Description=ComfyUI Video Generation
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/ComfyUI
ExecStart=/home/YOUR_USERNAME/ComfyUI/venv/bin/python main.py --listen 0.0.0.0 --port 8188
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Replace YOUR_USERNAME
sudo sed -i "s/YOUR_USERNAME/$USER/g" /etc/systemd/system/comfyui.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable comfyui
sudo systemctl start comfyui

# Check status
sudo systemctl status comfyui
```

---

## 🎯 **STEP 6: Configure Auto-Restart on Spot Termination**

Since you're using spot instances, create a startup script to auto-restart all services:

```bash
# Create startup script
sudo nano /usr/local/bin/start-ai-services.sh
```

Paste this:
```bash
#!/bin/bash

# Wait for GPU to be ready
sleep 30

# Restart all AI services
systemctl restart ollama
systemctl restart automatic1111
systemctl restart comfyui

echo "All AI services restarted at $(date)" >> /var/log/ai-services-startup.log
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/start-ai-services.sh

# Add to VM metadata startup script
gcloud compute instances add-metadata rabbit-ai-gpu \
  --project=tanzen-186b4 \
  --zone=us-central1-a \
  --metadata=startup-script='#!/bin/bash
/usr/local/bin/start-ai-services.sh'
```

---

## 🎯 **STEP 7: Get Your Server IP**

```bash
# Get external IP
gcloud compute instances describe rabbit-ai-gpu \
  --project=tanzen-186b4 \
  --zone=us-west1-b \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Current IP: 34.168.113.13
```

Your services will be available at:
- **Ollama (Text):** `http://YOUR_IP:11434`
- **Automatic1111 (Images):** `http://YOUR_IP:7860`
- **ComfyUI (Video):** `http://YOUR_IP:8188`

---

## 🎯 **STEP 8: Update Rabbit App Configuration**

Update your `.env.local` file:

```env
# Text Generation (Ollama)
OLLAMA_BASE_URL=http://YOUR_SERVER_IP:11434

# Image Generation (Automatic1111)
AUTOMATIC1111_BASE_URL=http://YOUR_SERVER_IP:7860

# Video Generation (ComfyUI)
COMFYUI_BASE_URL=http://YOUR_SERVER_IP:8188
```

Replace `YOUR_SERVER_IP` with the actual IP from Step 7.

---

## 📊 **Cost Breakdown**

| Service | Cost/Month |
|---------|------------|
| g2-standard-4 (spot) | $50 |
| NVIDIA L4 GPU (spot) | $100 |
| 150GB SSD Storage | $20 |
| **Compute Total** | **$170** |
| Firebase Services | $20 |
| **GRAND TOTAL** | **$190/month** ✅ |

**Performance Upgrade:**
- **VRAM:** 24GB (vs 16GB on T4) = +50% memory
- **Speed:** 2x faster text/image/video generation
- **Cost increase:** Only +$25/month (+17%)

**Savings vs Regular Pricing:**
- Regular L4 GPU VM: $510/month
- **You Save: $340/month (67% discount)** 🎉

---

## 🔧 **Monitoring & Maintenance**

### **Check Service Status**

```bash
# SSH into VM
gcloud compute ssh rabbit-ai-gpu --project=tanzen-186b4 --zone=us-west1-b

# Check all services
sudo systemctl status ollama
sudo systemctl status automatic1111
sudo systemctl status comfyui

# Check GPU usage
nvidia-smi

# Check disk space
df -h
```

### **View Logs**

```bash
# Ollama logs
sudo journalctl -u ollama -f

# Automatic1111 logs
sudo journalctl -u automatic1111 -f

# ComfyUI logs
sudo journalctl -u comfyui -f
```

### **Restart Services**

```bash
# Restart individual service
sudo systemctl restart ollama
sudo systemctl restart automatic1111
sudo systemctl restart comfyui

# Restart all
sudo systemctl restart ollama automatic1111 comfyui
```

---

## ⚠️ **Spot Instance Considerations**

**What happens when Google preempts your VM?**
1. VM stops (usually after 12-24 hours)
2. Automatically restarts in ~2-3 minutes
3. Startup script runs and restarts all services
4. Total downtime: **3-5 minutes**

**Your app should:**
- Detect when server is down
- Show "Server restarting..." message
- Auto-retry after a few minutes

---

## ✅ **Next Steps**

1. ✅ Run the GCP commands above
2. ✅ Wait for models to download (~1-2 hours total)
3. ✅ Test each service locally
4. ✅ Get your server IP
5. ✅ Update Rabbit app .env.local
6. ✅ Seed models (next document)
7. ✅ Test from your Rabbit app

---

## 🆘 **Troubleshooting**

### **Ollama not responding**
```bash
sudo systemctl restart ollama
curl http://localhost:11434/api/tags
```

### **Automatic1111 not starting**
```bash
# Check logs
sudo journalctl -u automatic1111 -n 100

# Common fix: CUDA out of memory
# Restart the service
sudo systemctl restart automatic1111
```

### **GPU not detected**
```bash
# Reinstall NVIDIA driver
sudo apt install -y nvidia-driver-535
sudo reboot
```

### **Disk full**
```bash
# Check disk usage
df -h

# Clear old model downloads
rm -rf ~/stable-diffusion-webui/models/Stable-diffusion/*.tmp
```

---

**Your self-hosted GPU AI server is ready!** 🚀

**Total Setup Time:** 2-3 hours
**Monthly Cost:** $143
**Value:** Unlimited text, image, and video generation with 100% uncensored models!
