# FxNorm-automix GPU Server Setup Guide

## Overview

This guide walks through installing and integrating Sony's FxNorm-automix into the existing audio processing service on the GPU server.

---

## Prerequisites

- GPU server: `rabbit-ai-gpu` (34.83.248.1)
- Existing audio service running at port 8080
- Python 3.10+ with PyTorch already installed
- NVIDIA L4 GPU with CUDA enabled

---

## Installation Steps

### 1. Clone FxNorm-automix Repository

```bash
# SSH into GPU server
gcloud compute ssh rabbit-ai-gpu --zone=us-west1-b --project=tanzen-186b4

# Navigate to audio service directory
cd ~/audio-service

# Clone FxNorm-automix
git clone https://github.com/sony/FxNorm-automix.git
cd FxNorm-automix
```

### 2. Install Dependencies

```bash
# Install FxNorm dependencies
pip3 install -r requirements.txt

# Or manually install key packages:
pip3 install torch==1.9.0 librosa>=0.8.1 scipy>=1.6.3 soundfile
pip3 install git+https://github.com/csteinmetz1/pymixconsole.git
pip3 install git+https://github.com/csteinmetz1/pyloudnorm.git
```

### 3. Download Pretrained Models

```bash
# Create models directory
mkdir -p ~/audio-service/fxnorm_models

# Download pretrained models
cd ~/audio-service/fxnorm_models

# Model: ours_S_La (recommended)
wget https://huggingface.co/sony/FxNorm-automix/resolve/main/ours_S_La/training_params.json
wget https://huggingface.co/sony/FxNorm-automix/resolve/main/ours_S_La/nets.pth
wget https://huggingface.co/sony/FxNorm-automix/resolve/main/ours_S_La/weights.pth

# Download feature statistics
wget https://huggingface.co/sony/FxNorm-automix/resolve/main/features_MUSDB18.npy
```

**Note**: Check the actual model hosting location in the FxNorm-automix repository.

### 4. Download Impulse Responses (Optional but Recommended)

```bash
# Create IR directory
mkdir -p ~/audio-service/impulse_responses

# Download sample IRs or use your own
# IRs should be organized as:
# impulse_responses/ir-001/impulse_response.wav
# impulse_responses/ir-002/impulse_response.wav
```

---

## Integration with FastAPI Service

### 5. Add FxNorm Endpoint to main.py

Add the following to `~/audio-service/main.py`:

```python
import subprocess
import os
from pathlib import Path

# FxNorm configuration
FXNORM_DIR = Path.home() / 'audio-service' / 'FxNorm-automix'
FXNORM_MODELS_DIR = Path.home() / 'audio-service' / 'fxnorm_models'
IMPULSE_RESPONSES_DIR = Path.home() / 'audio-service' / 'impulse_responses'

@app.post('/api/automix')
async def automix_audio(
    vocals: Optional[UploadFile] = File(None),
    drums: Optional[UploadFile] = File(None),
    bass: Optional[UploadFile] = File(None),
    other: Optional[UploadFile] = File(None),
    job_id: Optional[str] = Form(None),
    output_format: str = Form('wav'),
    model: str = Form('ours_S_La')
):
    """
    Auto-mix stems using FxNorm-automix

    Two modes:
    1. job_id provided: Use stems from previous separation job
    2. Individual stems uploaded: vocals, drums, bass, other
    """
    mix_job_id = str(uuid.uuid4())
    temp_dir = UPLOAD_DIR / mix_job_id
    output_dir = OUTPUT_DIR / mix_job_id

    try:
        temp_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Mode 1: Use stems from previous job
        if job_id:
            source_dir = OUTPUT_DIR / job_id

            # Find separated stems
            stem_files = {
                'vocals': None,
                'drums': None,
                'bass': None,
                'other': None
            }

            for stem_type in stem_files.keys():
                # Search for stem file in separation output
                for stem_file in source_dir.rglob(f'{stem_type}.wav'):
                    stem_files[stem_type] = stem_file
                    break

            # Verify all stems found
            if not all(stem_files.values()):
                raise HTTPException(
                    status_code=400,
                    detail=f'Missing stems in job {job_id}'
                )

        # Mode 2: Individual stem upload
        else:
            if not all([vocals, drums, bass, other]):
                raise HTTPException(
                    status_code=400,
                    detail='All stems required: vocals, drums, bass, other'
                )

            stem_files = {}

            for name, file in [
                ('vocals', vocals),
                ('drums', drums),
                ('bass', bass),
                ('other', other)
            ]:
                stem_path = temp_dir / f'{name}.wav'

                with stem_path.open('wb') as buffer:
                    shutil.copyfileobj(file.file, buffer)

                stem_files[name] = stem_path

        logger.info(f'Auto-mixing stems for job {mix_job_id}')

        # Prepare FxNorm command
        output_mix = output_dir / 'automix.wav'

        cmd = [
            'python3',
            str(FXNORM_DIR / 'automix' / 'inference.py'),
            '--vocals', str(stem_files['vocals']),
            '--drums', str(stem_files['drums']),
            '--bass', str(stem_files['bass']),
            '--other', str(stem_files['other']),
            '--output', str(output_mix),
            '--training-params', str(FXNORM_MODELS_DIR / model / 'training_params.json'),
            '--nets', str(FXNORM_MODELS_DIR / model / 'nets.pth'),
            '--weights', str(FXNORM_MODELS_DIR / model / 'weights.pth'),
            '--features', str(FXNORM_MODELS_DIR / 'features_MUSDB18.npy'),
        ]

        # Add impulse responses if available
        if IMPULSE_RESPONSES_DIR.exists():
            cmd.extend([
                '--impulse-responses', str(IMPULSE_RESPONSES_DIR),
                '--pre-impulse-responses', str(IMPULSE_RESPONSES_DIR)
            ])

        # Run FxNorm inference
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            logger.error(f'FxNorm failed: {result.stderr}')
            raise HTTPException(
                status_code=500,
                detail=f'Auto-mix failed: {result.stderr}'
            )

        # Convert output format if needed
        if output_format.lower() != 'wav':
            converted_mix = convert_audio_format(
                str(output_mix),
                str(output_dir / 'automix'),
                output_format
            )
            final_file = Path(converted_mix)
        else:
            final_file = output_mix

        logger.info(f'Successfully auto-mixed: {final_file.name}')

        return {
            'success': True,
            'job_id': mix_job_id,
            'mixedFile': {
                'filename': final_file.name,
                'path': str(final_file),
                'url': f'/api/download/{mix_job_id}/{final_file.name}',
                'format': output_format,
                'size': final_file.stat().st_size
            },
            'metadata': {
                'model': model,
                'stems': list(stem_files.keys())
            }
        }

    except subprocess.TimeoutExpired:
        logger.error('FxNorm timeout')
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
        raise HTTPException(status_code=504, detail='Auto-mix timeout (>5 min)')

    except Exception as e:
        logger.error(f'Auto-mix failed: {str(e)}')
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))


# Update health check to include FxNorm
@app.get('/api/health')
async def health_check():
    try:
        import demucs
        import matchering
        import torch

        # Check if FxNorm is available
        fxnorm_available = (FXNORM_DIR / 'automix' / 'inference.py').exists()

        return {
            'status': 'healthy',
            'services': {
                'demucs': 'available',
                'matchering': 'available',
                'fxnorm': 'available' if fxnorm_available else 'not installed',
                'ffmpeg': 'available',
                'torch': 'available',
                'cuda': torch.cuda.is_available()
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={'status': 'unhealthy', 'error': str(e)}
        )
```

### 6. Update requirements.txt

Add FxNorm dependencies:

```bash
cd ~/audio-service
echo "librosa>=0.8.1" >> requirements.txt
echo "git+https://github.com/csteinmetz1/pymixconsole.git" >> requirements.txt
echo "git+https://github.com/csteinmetz1/pyloudnorm.git" >> requirements.txt
```

### 7. Restart Audio Service

```bash
sudo systemctl restart audio_service
sudo systemctl status audio_service

# Check logs
sudo journalctl -u audio_service -f
```

---

## Testing

### Test Auto-Mix Endpoint

```bash
# Create test stems (or use real separated stems)
ffmpeg -f lavfi -i 'sine=frequency=440:duration=5' -ac 2 /tmp/test_vocals.wav -y
ffmpeg -f lavfi -i 'sine=frequency=220:duration=5' -ac 2 /tmp/test_drums.wav -y
ffmpeg -f lavfi -i 'sine=frequency=110:duration=5' -ac 2 /tmp/test_bass.wav -y
ffmpeg -f lavfi -i 'sine=frequency=880:duration=5' -ac 2 /tmp/test_other.wav -y

# Test auto-mix
curl -X POST http://localhost:8080/api/automix \
  -F 'vocals=@/tmp/test_vocals.wav' \
  -F 'drums=@/tmp/test_drums.wav' \
  -F 'bass=@/tmp/test_bass.wav' \
  -F 'other=@/tmp/test_other.wav' \
  -F 'output_format=wav' \
  -F 'model=ours_S_La'
```

Expected response:
```json
{
  "success": true,
  "job_id": "uuid",
  "mixedFile": {
    "filename": "automix.wav",
    "url": "/api/download/{job_id}/automix.wav",
    "size": 1234567
  }
}
```

---

## Troubleshooting

### FxNorm Not Found

```bash
# Check installation
ls -la ~/audio-service/FxNorm-automix
python3 -c "import sys; sys.path.append('/home/khare/audio-service/FxNorm-automix'); from automix import inference"
```

### Missing Models

```bash
# Verify model files exist
ls -la ~/audio-service/fxnorm_models/ours_S_La/
# Should contain: training_params.json, nets.pth, weights.pth

# Verify features file
ls -la ~/audio-service/fxnorm_models/features_MUSDB18.npy
```

### CUDA Errors

```bash
# Check CUDA availability
python3 -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"

# Check PyTorch version compatibility
python3 -c "import torch; print(torch.__version__)"
```

---

## Performance Notes

- **Processing Time**: ~30-60 seconds for a 3-minute song (GPU)
- **Memory**: ~2-3GB RAM + 2-4GB VRAM
- **Concurrent Jobs**: Limited to 2 (configured workers)
- **Recommended**: Process one mix at a time for best quality

---

## Next Steps

1. Install FxNorm-automix on GPU server
2. Download pretrained models
3. Update main.py with automix endpoint
4. Test locally
5. Update environment variables if needed
6. Deploy frontend changes

---

## Resources

- FxNorm-automix Repository: https://github.com/sony/FxNorm-automix
- Paper: https://arxiv.org/abs/2106.01483
- Models: Check repository for download links
