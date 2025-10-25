# Audio Processing Setup Guide

This guide will help you set up the audio processing features (stem separation and mastering) for Rabbit AI Studio.

## Overview

The audio processing system consists of:
- **Frontend**: Next.js app at `/audio` route (hidden from homepage)
- **Backend**: FastAPI service running on GPU server
- **Processing**:
  - Demucs for stem separation (GPU accelerated)
  - Matchering for audio mastering (CPU based)

---

## Part 1: GPU Server Setup

### Prerequisites

- GPU server with NVIDIA L4 (or similar)
- Ubuntu/Debian Linux
- Python 3.8+
- CUDA installed (for GPU acceleration)
- Root/sudo access

### Step 1: Install System Dependencies

```bash
# SSH into your GPU server
ssh brighttiercloud@34.168.113.13

# Update system
sudo apt update && sudo apt upgrade -y

# Install FFmpeg (required for audio format conversion)
sudo apt install -y ffmpeg libsndfile1

# Install Python 3 and pip
sudo apt install -y python3 python3-pip

# Verify installations
ffmpeg -version
python3 --version
```

### Step 2: Create Service Directory

```bash
# Create directory for audio service
mkdir -p ~/audio-service
cd ~/audio-service
```

### Step 3: Upload Service Files

Upload these files from your local `gpu-services/audio-service/` directory to the server:

```bash
# On your local machine
scp -r gpu-services/audio-service/* brighttiercloud@34.168.113.13:~/audio-service/
```

Or manually create the files on the server using the content from:
- `gpu-services/audio-service/main.py`
- `gpu-services/audio-service/requirements.txt`
- `gpu-services/audio-service/audio_service.service`

### Step 4: Install Python Dependencies

```bash
cd ~/audio-service

# Install requirements
pip3 install -r requirements.txt

# This will install:
# - fastapi
# - uvicorn
# - demucs
# - matchering
# - pydub
# - soundfile
# - httpx
```

### Step 5: Test the Service

```bash
# Run the service manually to test
python3 main.py

# You should see:
# INFO:     Started server process
# INFO:     Uvicorn running on http://0.0.0.0:8080
```

In another terminal, test the health endpoint:

```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "demucs": "available",
    "matchering": "available",
    "ffmpeg": "available"
  }
}
```

### Step 6: Set Up Systemd Service

```bash
# Copy service file
sudo cp audio_service.service /etc/systemd/system/

# Edit service file if needed (change user/paths)
sudo nano /etc/systemd/system/audio_service.service

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable audio_service

# Start service
sudo systemctl start audio_service

# Check status
sudo systemctl status audio_service
```

### Step 7: Configure Firewall

```bash
# Allow port 8080 through firewall
sudo ufw allow 8080/tcp

# Or if using GCP firewall:
gcloud compute firewall-rules create allow-audio-service \
  --allow tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Rabbit AI Audio Service" \
  --project=tanzen-186b4
```

### Step 8: Verify Service is Running

```bash
# From your local machine
curl http://34.168.113.13:8080/api/health

# Should return healthy status
```

---

## Part 2: Frontend Setup

### Step 1: Update Environment Variables

Copy the audio service URLs to your `.env.local` file:

```bash
cd /path/to/rabbit-ai-studio

# Copy .env.example if you haven't already
cp .env.example .env.local

# Edit .env.local and add/update:
nano .env.local
```

Add these lines:
```bash
DEMUCS_BASE_URL=http://34.168.113.13:8080
MATCHERING_BASE_URL=http://34.168.113.13:8080
NEXT_PUBLIC_DEMUCS_BASE_URL=http://34.168.113.13:8080
NEXT_PUBLIC_MATCHERING_BASE_URL=http://34.168.113.13:8080
AUDIO_MAX_FILE_SIZE=104857600
```

### Step 2: Build and Deploy

```bash
# Build the Next.js app
npm run build

# Deploy to Firebase (if using Firebase hosting)
firebase deploy --only hosting

# Or if running locally/dev
npm run dev
```

### Step 3: Access the Audio Page

Navigate to: `http://your-domain.com/audio` or `http://localhost:3000/audio`

The page is NOT linked from the homepage but is accessible via direct URL.

---

## Part 3: Testing

### Test Stem Separation

1. Navigate to `/audio`
2. Select "Stem Separation" tab
3. Upload a music file (MP3, WAV, FLAC, or M4A)
4. Leave stems empty (extracts all: vocals, drums, bass, other)
5. Select output format (WAV recommended)
6. Click "Separate Audio"
7. Wait for processing (~1.5× audio duration)
8. Download individual stems

### Test Audio Mastering

1. Navigate to `/audio`
2. Select "Mastering" tab
3. Upload your target track (the one you want to master)
4. Upload a reference track (professionally mastered song)
5. Select output format (WAV recommended)
6. Click "Master Audio"
7. Wait for processing (~10-30 seconds)
8. Compare original vs mastered using the player

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u audio_service -f

# Common issues:
# 1. Port 8080 already in use
sudo lsof -i :8080

# 2. Python dependencies missing
pip3 install -r requirements.txt

# 3. Permissions issue
sudo chown -R brighttiercloud:brighttiercloud ~/audio-service
```

### GPU Not Detected

```bash
# Check CUDA installation
nvidia-smi

# Verify PyTorch sees GPU
python3 -c "import torch; print(torch.cuda.is_available())"

# If false, reinstall PyTorch with CUDA support
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Out of Memory Errors

Reduce concurrent processing by limiting workers:

```bash
# Edit service file
sudo nano /etc/systemd/system/audio_service.service

# Change ExecStart line to use 1 worker:
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1

# Restart service
sudo systemctl restart audio_service
```

### Frontend Connection Issues

```bash
# Check if service is accessible
curl http://34.168.113.13:8080/api/health

# Check CORS settings in main.py
# Ensure allow_origins includes your Next.js domain

# Check browser console for CORS errors
# Fix by updating CORS middleware in gpu-services/audio-service/main.py
```

---

## Performance Notes

### Demucs (Stem Separation)
- **GPU**: NVIDIA L4 with 24GB VRAM
- **Processing Time**: ~1.5× audio duration
  - 3-minute song = ~4.5 minutes
  - 5-minute song = ~7.5 minutes
- **Memory**: ~2-4GB RAM + 3-5GB VRAM per job
- **Recommended Model**: `htdemucs` (best quality)

### Matchering (Audio Mastering)
- **CPU**: Multi-core processing
- **Processing Time**: 10-30 seconds (independent of audio length)
- **Memory**: ~1-2GB RAM per job
- **Best Results**: High-quality WAV/FLAC files

### Rate Limits
- **Separation**: 10 requests/hour per user
- **Mastering**: 15 requests/hour per user
- Configurable in API route files

---

## File Cleanup

Temporary files are stored in `/tmp` and cleaned automatically by the OS. For manual cleanup:

```bash
# On GPU server
# Clean up old files (older than 24 hours)
find /tmp/rabbit-audio-uploads -type d -mtime +1 -exec rm -rf {} + 2>/dev/null
find /tmp/rabbit-audio-outputs -type d -mtime +1 -exec rm -rf {} + 2>/dev/null

# Add to crontab for daily cleanup
crontab -e

# Add this line:
0 2 * * * find /tmp/rabbit-audio-uploads -type d -mtime +1 -exec rm -rf {} + 2>/dev/null
0 2 * * * find /tmp/rabbit-audio-outputs -type d -mtime +1 -exec rm -rf {} + 2>/dev/null
```

---

## Security Considerations

1. **Authentication**: All API routes require Firebase authentication
2. **Rate Limiting**: Strict rate limits prevent abuse
3. **File Size**: Max 100MB per upload
4. **Firewall**: Restrict port 8080 to known IP addresses in production
5. **CORS**: Update CORS settings to only allow your domain

---

## Monitoring

```bash
# Watch service logs
sudo journalctl -u audio_service -f

# Check resource usage
htop

# Monitor GPU usage
watch -n 1 nvidia-smi

# Check service status
sudo systemctl status audio_service
```

---

## Updating the Service

```bash
# Stop service
sudo systemctl stop audio_service

# Update code
cd ~/audio-service
# Make changes to main.py

# Or pull new version
scp -r gpu-services/audio-service/* brighttiercloud@34.168.113.13:~/audio-service/

# Restart service
sudo systemctl start audio_service

# Check status
sudo systemctl status audio_service
```

---

## Next Steps

1. ✅ Complete GPU server setup
2. ✅ Test stem separation
3. ✅ Test audio mastering
4. Monitor performance and adjust rate limits
5. Consider adding models to Firestore `/models` collection
6. Optionally integrate Firebase Storage for permanent file storage
7. Add usage analytics

---

## Support

For issues, check:
- Service logs: `sudo journalctl -u audio_service -f`
- GPU status: `nvidia-smi`
- Network connectivity: `curl http://34.168.113.13:8080/api/health`

---

**Setup Complete! 🎉**

Your audio processing system is now ready. Access it at `/audio` and start separating stems or mastering tracks!
