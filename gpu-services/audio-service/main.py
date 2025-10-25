"""
Rabbit AI Studio - Audio Processing Service
FastAPI service for Demucs (stem separation) and Matchering (audio mastering)
Runs on GPU server for L4 GPU acceleration
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import demucs.separate
import matchering as mg
from pathlib import Path
import tempfile
import shutil
import os
import uuid
import subprocess
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Rabbit AI Audio Service",
    description="Audio processing with Demucs and Matchering",
    version="1.0.0"
)

# CORS middleware - adjust origins as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path("/tmp/rabbit-audio-uploads")
OUTPUT_DIR = Path("/tmp/rabbit-audio-outputs")
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Create directories
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def convert_audio_format(input_path: str, output_path: str, format: str) -> str:
    """
    Convert audio file to specified format using ffmpeg

    Args:
        input_path: Path to input audio file
        output_path: Path for output file (without extension)
        format: Target format (mp3, flac, m4a, wav)

    Returns:
        Path to converted file
    """
    extension = format.lower()
    if extension not in ['mp3', 'flac', 'm4a', 'wav']:
        raise ValueError(f"Unsupported format: {format}")

    output_file = f"{output_path}.{extension}"

    try:
        cmd = ['ffmpeg', '-i', input_path, '-y']

        # Format-specific options
        if extension == 'mp3':
            cmd.extend(['-codec:a', 'libmp3lame', '-qscale:a', '2'])
        elif extension == 'flac':
            cmd.extend(['-codec:a', 'flac'])
        elif extension == 'm4a':
            cmd.extend(['-codec:a', 'aac', '-b:a', '256k'])
        elif extension == 'wav':
            cmd.extend(['-codec:a', 'pcm_s16le'])

        cmd.append(output_file)

        subprocess.run(cmd, check=True, capture_output=True)
        return output_file
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg conversion failed: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail=f"Audio conversion failed: {e.stderr.decode()}")


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "service": "Rabbit AI Audio Service",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "models": "/api/models",
            "separate": "/api/separate",
            "master": "/api/master"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if Demucs is available
        import demucs.pretrained
        models = demucs.pretrained.PRETRAINED_MODELS

        return {
            "status": "healthy",
            "services": {
                "demucs": "available",
                "matchering": "available",
                "ffmpeg": "available"
            },
            "models_count": len(models)
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )


@app.get("/api/models")
async def list_models():
    """List available Demucs models"""
    try:
        import demucs.pretrained
        models = demucs.pretrained.PRETRAINED_MODELS

        model_list = []
        for name, info in models.items():
            model_list.append({
                "id": name,
                "name": name,
                "description": f"Demucs model: {name}",
                "sources": info.get("sources", 4)
            })

        return {
            "models": model_list,
            "count": len(model_list),
            "recommended": "htdemucs"  # Best quality model
        }
    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/separate")
async def separate_audio(
    file: UploadFile = File(...),
    model: str = Form("htdemucs"),
    stems: Optional[str] = Form(None),  # Comma-separated: vocals,drums,bass,other
    output_format: str = Form("wav")
):
    """
    Separate audio into stems using Demucs

    Args:
        file: Audio file to separate
        model: Demucs model to use (default: htdemucs)
        stems: Comma-separated list of stems to extract (or None for all)
        output_format: Output format (wav, mp3, flac, m4a)

    Returns:
        JSON with URLs to separated stems
    """
    job_id = str(uuid.uuid4())
    temp_dir = UPLOAD_DIR / job_id
    output_dir = OUTPUT_DIR / job_id

    try:
        # Create job directories
        temp_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Save uploaded file
        input_path = temp_dir / file.filename
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"Processing audio separation: {file.filename} with model {model}")

        # Prepare Demucs arguments
        args = [
            "--out", str(output_dir),
            "-n", model,
            str(input_path)
        ]

        # Add two-stems mode if specific stems requested
        if stems:
            stem_list = [s.strip() for s in stems.split(",")]
            if len(stem_list) == 1:
                args.extend(["--two-stems", stem_list[0]])

        # Run Demucs separation
        logger.info(f"Running Demucs with args: {args}")
        demucs.separate.main(args)

        # Find separated stems
        # Demucs outputs to: output_dir / model / filename_without_ext / {stem}.wav
        filename_base = input_path.stem
        separated_dir = output_dir / model / filename_base

        if not separated_dir.exists():
            raise HTTPException(status_code=500, detail="Separation failed - no output directory")

        # Collect stem files
        stem_files = []
        for stem_file in separated_dir.glob("*.wav"):
            stem_name = stem_file.stem

            # Convert to requested format if not WAV
            if output_format.lower() != "wav":
                output_path = separated_dir / f"{stem_name}"
                converted_file = convert_audio_format(
                    str(stem_file),
                    str(output_path),
                    output_format
                )
                final_file = Path(converted_file)
            else:
                final_file = stem_file

            stem_files.append({
                "name": stem_name,
                "filename": final_file.name,
                "path": str(final_file),
                "format": output_format,
                "size": final_file.stat().st_size
            })

        logger.info(f"Successfully separated {len(stem_files)} stems")

        return {
            "success": True,
            "job_id": job_id,
            "model": model,
            "stems": stem_files,
            "download_base": f"/api/download/{job_id}"
        }

    except Exception as e:
        logger.error(f"Separation failed: {str(e)}")
        # Cleanup on error
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/master")
async def master_audio(
    target: UploadFile = File(...),
    reference: UploadFile = File(...),
    output_format: str = Form("wav")
):
    """
    Master audio using Matchering

    Args:
        target: Target audio file to master
        reference: Reference audio file to match
        output_format: Output format (wav, mp3, flac)

    Returns:
        JSON with URL to mastered audio
    """
    job_id = str(uuid.uuid4())
    temp_dir = UPLOAD_DIR / job_id
    output_dir = OUTPUT_DIR / job_id

    try:
        # Create job directories
        temp_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        # Save uploaded files
        target_path = temp_dir / f"target_{target.filename}"
        reference_path = temp_dir / f"reference_{reference.filename}"

        with target_path.open("wb") as buffer:
            shutil.copyfileobj(target.file, buffer)

        with reference_path.open("wb") as buffer:
            shutil.copyfileobj(reference.file, buffer)

        logger.info(f"Processing audio mastering: {target.filename} -> {reference.filename}")

        # Output files
        output_16bit = output_dir / "mastered_16bit.wav"
        output_24bit = output_dir / "mastered_24bit.wav"

        # Run Matchering
        mg.process(
            target=str(target_path),
            reference=str(reference_path),
            results=[
                mg.pcm16(str(output_16bit)),
                mg.pcm24(str(output_24bit))
            ]
        )

        # Use 24-bit version for further processing
        mastered_file = output_24bit

        # Convert to requested format if not WAV
        if output_format.lower() != "wav":
            output_path = output_dir / "mastered"
            converted_file = convert_audio_format(
                str(mastered_file),
                str(output_path),
                output_format
            )
            final_file = Path(converted_file)
        else:
            final_file = mastered_file

        logger.info(f"Successfully mastered audio: {final_file.name}")

        return {
            "success": True,
            "job_id": job_id,
            "mastered": {
                "filename": final_file.name,
                "path": str(final_file),
                "format": output_format,
                "size": final_file.stat().st_size
            },
            "download_url": f"/api/download/{job_id}/{final_file.name}"
        }

    except Exception as e:
        logger.error(f"Mastering failed: {str(e)}")
        # Cleanup on error
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    """
    Download a processed audio file

    Args:
        job_id: Job ID
        filename: Filename to download

    Returns:
        File response
    """
    # Search in output directory
    output_dir = OUTPUT_DIR / job_id

    # Try direct file
    file_path = output_dir / filename
    if file_path.exists():
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="audio/mpeg"  # Adjust based on actual format
        )

    # Try in subdirectories (for Demucs output)
    for subdir in output_dir.rglob("*"):
        if subdir.is_dir():
            file_path = subdir / filename
            if file_path.exists():
                return FileResponse(
                    path=str(file_path),
                    filename=filename,
                    media_type="audio/mpeg"
                )

    raise HTTPException(status_code=404, detail="File not found")


@app.delete("/api/cleanup/{job_id}")
async def cleanup_job(job_id: str):
    """
    Clean up temporary files for a job

    Args:
        job_id: Job ID to clean up

    Returns:
        Success status
    """
    try:
        temp_dir = UPLOAD_DIR / job_id
        output_dir = OUTPUT_DIR / job_id

        if temp_dir.exists():
            shutil.rmtree(temp_dir)

        if output_dir.exists():
            shutil.rmtree(output_dir)

        return {"success": True, "message": f"Cleaned up job {job_id}"}
    except Exception as e:
        logger.error(f"Cleanup failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
