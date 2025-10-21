#!/bin/bash
# Rabbit AI Studio - GPU Server Setup Script
# Run this on your GCP VM after SSH'ing in

set -e  # Exit on error

echo "========================================="
echo "Rabbit AI Studio - GPU Server Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get username
USERNAME=$(whoami)
echo -e "${GREEN}Setting up for user: $USERNAME${NC}"
echo ""

# ==========================================
# PART 1: Install Automatic1111
# ==========================================
echo -e "${YELLOW}[1/3] Installing Automatic1111 Stable Diffusion...${NC}"

# Install dependencies
echo "Installing dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git wget libgl1 libglib2.0-0

# Install PyTorch with CUDA
echo "Installing PyTorch with CUDA support..."
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Clone Automatic1111
echo "Cloning Automatic1111..."
cd ~
if [ ! -d "stable-diffusion-webui" ]; then
  git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
fi
cd stable-diffusion-webui

# Download image models
echo "Downloading image models (this takes 30-60 minutes)..."
cd models/Stable-diffusion

# SDXL Base 1.0 (6.5GB)
if [ ! -f "sd_xl_base_1.0.safetensors" ]; then
  echo "Downloading SDXL Base 1.0..."
  wget -c https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
fi

# Realistic Vision V5.1 (2.1GB)
if [ ! -f "realisticVisionV51_v51VAE.safetensors" ]; then
  echo "Downloading Realistic Vision V5.1..."
  wget -c https://huggingface.co/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/realisticVisionV51_v51VAE.safetensors
fi

# DreamShaper XL (6.5GB)
if [ ! -f "DreamShaperXL_Turbo_v2.safetensors" ]; then
  echo "Downloading DreamShaper XL..."
  wget -c https://huggingface.co/Lykon/dreamshaper-xl-1-0/resolve/main/DreamShaperXL_Turbo_v2.safetensors
fi

# ChilloutMix (2GB)
if [ ! -f "chilloutmix.safetensors" ]; then
  echo "Downloading ChilloutMix..."
  wget -c "https://civitai.com/api/download/models/11745?type=Model&format=SafeTensor&size=full&fp=fp16" -O chilloutmix.safetensors
fi

cd ~/stable-diffusion-webui

# Create launch script
echo "Creating launch script..."
cat > start-auto1111.sh << 'EOF'
#!/bin/bash
cd /home/$USER/stable-diffusion-webui
python3 launch.py \
  --api \
  --listen \
  --port 7860 \
  --xformers \
  --enable-insecure-extension-access \
  --no-half-vae
EOF
chmod +x start-auto1111.sh

# Create systemd service
echo "Creating systemd service..."
sudo bash -c "cat > /etc/systemd/system/automatic1111.service << EOF
[Unit]
Description=Automatic1111 Stable Diffusion WebUI
After=network.target

[Service]
Type=simple
User=$USERNAME
WorkingDirectory=/home/$USERNAME/stable-diffusion-webui
ExecStart=/bin/bash /home/$USERNAME/stable-diffusion-webui/start-auto1111.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF"

# Enable and start service
echo "Starting Automatic1111 service..."
sudo systemctl daemon-reload
sudo systemctl enable automatic1111
sudo systemctl start automatic1111

echo -e "${GREEN}✓ Automatic1111 installed and started${NC}"
echo ""

# ==========================================
# PART 2: Install ComfyUI
# ==========================================
echo -e "${YELLOW}[2/3] Installing ComfyUI for video generation...${NC}"

# Clone ComfyUI
cd ~
if [ ! -d "ComfyUI" ]; then
  git clone https://github.com/comfyanonymous/ComfyUI
fi
cd ComfyUI

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing ComfyUI dependencies..."
pip install -r requirements.txt

# Download video model
echo "Downloading Stable Video Diffusion model (9.6GB)..."
cd models/checkpoints
if [ ! -f "svd_xt_1_1.safetensors" ]; then
  wget -c https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1/resolve/main/svd_xt_1_1.safetensors
fi
cd ~/ComfyUI

# Create systemd service for ComfyUI
echo "Creating ComfyUI systemd service..."
sudo bash -c "cat > /etc/systemd/system/comfyui.service << EOF
[Unit]
Description=ComfyUI Video Generation
After=network.target

[Service]
Type=simple
User=$USERNAME
WorkingDirectory=/home/$USERNAME/ComfyUI
ExecStart=/home/$USERNAME/ComfyUI/venv/bin/python main.py --listen 0.0.0.0 --port 8188
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF"

# Enable and start service
echo "Starting ComfyUI service..."
sudo systemctl daemon-reload
sudo systemctl enable comfyui
sudo systemctl start comfyui

echo -e "${GREEN}✓ ComfyUI installed and started${NC}"
echo ""

# ==========================================
# PART 3: Create startup script for spot instances
# ==========================================
echo -e "${YELLOW}[3/3] Configuring auto-restart for spot instances...${NC}"

# Create startup script
sudo bash -c 'cat > /usr/local/bin/start-ai-services.sh << EOF
#!/bin/bash

# Wait for GPU to be ready
sleep 30

# Restart all AI services
systemctl restart ollama
systemctl restart automatic1111
systemctl restart comfyui

echo "All AI services restarted at \$(date)" >> /var/log/ai-services-startup.log
EOF'

sudo chmod +x /usr/local/bin/start-ai-services.sh

# Add to crontab for auto-start on reboot
(crontab -l 2>/dev/null; echo "@reboot /usr/local/bin/start-ai-services.sh") | crontab -

echo -e "${GREEN}✓ Auto-restart configured${NC}"
echo ""

# ==========================================
# Summary
# ==========================================
echo "========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "========================================="
echo ""
echo "Services running:"
echo "  • Ollama (text):        http://$(curl -s ifconfig.me):11434"
echo "  • Automatic1111 (image): http://$(curl -s ifconfig.me):7860"
echo "  • ComfyUI (video):       http://$(curl -s ifconfig.me):8188"
echo ""
echo "Check service status:"
echo "  sudo systemctl status ollama"
echo "  sudo systemctl status automatic1111"
echo "  sudo systemctl status comfyui"
echo ""
echo "View logs:"
echo "  sudo journalctl -u ollama -f"
echo "  sudo journalctl -u automatic1111 -f"
echo "  sudo journalctl -u comfyui -f"
echo ""
echo "Installed models:"
echo "  Text: dolphin-llama3:8b, wizardlm-uncensored (or whichever you installed)"
echo "  Image: SDXL, Realistic Vision V5.1, DreamShaper XL, ChilloutMix"
echo "  Video: Stable Video Diffusion XT 1.1"
echo ""
echo -e "${GREEN}Your GPU server is ready!${NC}"
echo ""
