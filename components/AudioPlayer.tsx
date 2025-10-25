'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';
import { AudioFile } from '@/lib/types';
import { formatDuration, downloadAudioFile, formatFileSize } from '@/lib/audio';

interface AudioPlayerProps {
  audioFile: AudioFile;
  showDownload?: boolean;
  showWaveform?: boolean;
  compact?: boolean;
}

export function AudioPlayer({
  audioFile,
  showDownload = true,
  showWaveform = true,
  compact = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioFile.url]);

  // Handle play/pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
        <audio ref={audioRef} src={audioFile.url} preload="metadata" />

        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{audioFile.name}</div>
          <div className="text-xs text-muted-foreground">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>
        </div>

        {showDownload && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => downloadAudioFile(audioFile)}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <audio ref={audioRef} src={audioFile.url} preload="metadata" />

      {/* File Info */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{audioFile.name}</div>
            <div className="text-sm text-muted-foreground">
              {audioFile.format.toUpperCase()} • {formatFileSize(audioFile.size)}
            </div>
          </div>
          {showDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadAudioFile(audioFile)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Waveform / Progress Bar */}
      {showWaveform && (
        <div
          ref={progressRef}
          className="h-16 bg-muted rounded-md mb-3 cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          {/* Simple waveform visualization (static bars) */}
          <div ref={waveformRef} className="absolute inset-0 flex items-center justify-around px-1">
            {Array.from({ length: 50 }).map((_, i) => {
              const height = Math.random() * 60 + 20; // Random height between 20-80%
              return (
                <div
                  key={i}
                  className="w-0.5 bg-primary/30 rounded-full"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Progress overlay */}
          <div
            className="absolute inset-y-0 left-0 bg-primary/20"
            style={{ width: `${progress}%` }}
          />

          {/* Playhead */}
          <div
            className="absolute inset-y-0 w-0.5 bg-primary"
            style={{ left: `${progress}%` }}
          />
        </div>
      )}

      {/* Simple progress bar (if waveform disabled) */}
      {!showWaveform && (
        <div
          ref={progressRef}
          className="h-2 bg-muted rounded-full mb-3 cursor-pointer relative"
          onClick={handleSeek}
        >
          <div
            className="absolute inset-0 bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <Button
          size="sm"
          variant="outline"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        {/* Time */}
        <div className="text-sm text-muted-foreground">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-muted-foreground mt-2">
          Loading audio...
        </div>
      )}
    </div>
  );
}
