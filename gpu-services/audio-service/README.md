# Rabbit AI Studio - Audio Processing Service

FastAPI service for audio processing with Demucs (stem separation) and Matchering (audio mastering).

## Installation

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install FFmpeg (required for audio format conversion)
sudo apt install -y ffmpeg libsndfile1

# Install Python 3.8+ if not already installed
sudo apt install -y python3 python3-pip
```

### 2. Install Python Dependencies

```bash
# Navigate to service directory
cd ~/audio-service

# Install requirements
pip3 install -r requirements.txt
```

### 3. Verify Installation

```bash
# Test Demucs
python3 -c "import demucs; print('Demucs OK')"

# Test Matchering
python3 -c "import matchering; print('Matchering OK')"

# Test FFmpeg
ffmpeg -version
```

## Running the Service

### Development Mode

```bash
# Run directly with uvicorn
python3 main.py

# Or with auto-reload for development
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### Production Mode (Systemd Service)

```bash
# Copy service file
sudo cp audio_service.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable audio_service

# Start service
sudo systemctl start audio_service

# Check status
sudo systemctl status audio_service

# View logs
sudo journalctl -u audio_service -f
```

## API Endpoints

### Health Check
```bash
GET http://localhost:8080/api/health
```

### List Available Models
```bash
GET http://localhost:8080/api/models
```

### Separate Audio into Stems
```bash
POST http://localhost:8080/api/separate
Content-Type: multipart/form-data

Parameters:
- file: Audio file (required)
- model: Demucs model name (default: htdemucs)
- stems: Comma-separated stem names (optional, default: all)
- output_format: wav, mp3, flac, or m4a (default: wav)
```

### Master Audio
```bash
POST http://localhost:8080/api/master
Content-Type: multipart/form-data

Parameters:
- target: Audio file to master (required)
- reference: Reference audio file (required)
- output_format: wav, mp3, or flac (default: wav)
```

### Download Processed File
```bash
GET http://localhost:8080/api/download/{job_id}/{filename}
```

### Cleanup Job Files
```bash
DELETE http://localhost:8080/api/cleanup/{job_id}
```

## Firewall Configuration

If running on GCP, open port 8080:

```bash
gcloud compute firewall-rules create allow-audio-service \
  --allow tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Rabbit AI Audio Service"
```

## Testing

```bash
# Test separation endpoint
curl -X POST "http://localhost:8080/api/separate" \
  -F "file=@test_audio.wav" \
  -F "model=htdemucs" \
  -F "output_format=wav"

# Test mastering endpoint
curl -X POST "http://localhost:8080/api/master" \
  -F "target=@my_song.wav" \
  -F "reference=@reference_track.wav" \
  -F "output_format=wav"
```

## Performance Notes

### Demucs (Stem Separation)
- **GPU Processing**: Requires 3GB+ VRAM (L4 GPU has 24GB)
- **Processing Time**: ~1.5x duration of track (e.g., 3-minute song = ~4.5 minutes)
- **Recommended Model**: `htdemucs` (best quality)
- **Memory Usage**: ~2-4GB RAM per job

### Matchering (Audio Mastering)
- **CPU Processing**: No GPU acceleration
- **Processing Time**: ~10-30 seconds per track
- **Memory Usage**: ~1-2GB RAM per job

## Troubleshooting

### Out of Memory
If you encounter OOM errors, reduce the number of workers:
```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --workers 1
```

### CUDA Errors
If GPU is not detected:
```bash
# Check CUDA installation
nvidia-smi

# Verify PyTorch sees GPU
python3 -c "import torch; print(torch.cuda.is_available())"
```

### FFmpeg Not Found
```bash
# Install FFmpeg
sudo apt install -y ffmpeg

# Verify installation
which ffmpeg
```

## Directory Structure

```
/tmp/rabbit-audio-uploads/    # Temporary upload directory
/tmp/rabbit-audio-outputs/     # Processed audio outputs
/var/log/rabbit-audio-service.log  # Service logs
```

## Cleanup

Temporary files are stored in `/tmp` and will be automatically cleaned up by the system. For manual cleanup:

```bash
# Clean up old job files (older than 24 hours)
find /tmp/rabbit-audio-uploads -type d -mtime +1 -exec rm -rf {} +
find /tmp/rabbit-audio-outputs -type d -mtime +1 -exec rm -rf {} +
```

## Security Notes

1. **File Size Limits**: Max 100MB per upload (configurable in code)
2. **CORS**: Currently allows all origins - restrict in production
3. **Rate Limiting**: Implement rate limiting in Next.js API routes
4. **Authentication**: Service itself has no auth - handle in Next.js layer
5. **Firewall**: Consider restricting access to known IP addresses

## Monitoring

```bash
# Watch logs in real-time
sudo journalctl -u audio_service -f

# Check service status
sudo systemctl status audio_service

# Check resource usage
htop  # Look for python3 processes
```
