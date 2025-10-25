'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download } from 'lucide-react';
import { AudioFile } from '@/lib/types';
import { formatDuration, downloadAudioFile } from '@/lib/audio';

interface AudioComparisonProps {
  audioA: AudioFile;
  audioB: AudioFile;
  labelA?: string;
  labelB?: string;
}

export function AudioComparison({
  audioA,
  audioB,
  labelA = 'Original',
  labelB = 'Processed',
}: AudioComparisonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTrack, setActiveTrack] = useState<'A' | 'B'>('A');

  const audioARef = useRef<HTMLAudioElement>(null);
  const audioBRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Sync audio elements
  useEffect(() => {
    const audioA = audioARef.current;
    const audioB = audioBRef.current;
    if (!audioA || !audioB) return;

    const handleLoadedMetadata = () => {
      // Use the longer duration
      const maxDuration = Math.max(audioA.duration, audioB.duration);
      setDuration(maxDuration);
    };

    const handleTimeUpdate = () => {
      const activeAudio = activeTrack === 'A' ? audioA : audioB;
      setCurrentTime(activeAudio.currentTime);

      // Sync the other track's time
      const otherAudio = activeTrack === 'A' ? audioB : audioA;
      if (Math.abs(otherAudio.currentTime - activeAudio.currentTime) > 0.1) {
        otherAudio.currentTime = activeAudio.currentTime;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audioA.currentTime = 0;
      audioB.currentTime = 0;
    };

    audioA.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioB.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioA.addEventListener('timeupdate', handleTimeUpdate);
    audioB.addEventListener('timeupdate', handleTimeUpdate);
    audioA.addEventListener('ended', handleEnded);
    audioB.addEventListener('ended', handleEnded);

    return () => {
      audioA.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioB.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioA.removeEventListener('timeupdate', handleTimeUpdate);
      audioB.removeEventListener('timeupdate', handleTimeUpdate);
      audioA.removeEventListener('ended', handleEnded);
      audioB.removeEventListener('ended', handleEnded);
    };
  }, [activeTrack]);

  // Handle play/pause
  const togglePlay = () => {
    const activeAudio = activeTrack === 'A' ? audioARef.current : audioBRef.current;
    if (!activeAudio) return;

    if (isPlaying) {
      audioARef.current?.pause();
      audioBRef.current?.pause();
    } else {
      // Pause both first
      audioARef.current?.pause();
      audioBRef.current?.pause();

      // Play the active track
      activeAudio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Switch tracks (A/B comparison)
  const switchTrack = (track: 'A' | 'B') => {
    const wasPlaying = isPlaying;
    const currentTimeValue = currentTime;

    // Pause both
    audioARef.current?.pause();
    audioBRef.current?.pause();

    // Set active track
    setActiveTrack(track);

    // Sync time
    if (audioARef.current && audioBRef.current) {
      audioARef.current.currentTime = currentTimeValue;
      audioBRef.current.currentTime = currentTimeValue;
    }

    // Resume playing if was playing
    if (wasPlaying) {
      setTimeout(() => {
        const newActiveAudio = track === 'A' ? audioARef.current : audioBRef.current;
        newActiveAudio?.play();
        setIsPlaying(true);
      }, 50);
    }
  };

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    if (audioARef.current && audioBRef.current) {
      audioARef.current.currentTime = newTime;
      audioBRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Audio Comparison</h3>

      {/* Hidden audio elements */}
      <audio ref={audioARef} src={audioA.url} preload="metadata" />
      <audio ref={audioBRef} src={audioB.url} preload="metadata" />

      {/* Track selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => switchTrack('A')}
          className={`p-3 rounded-lg border transition-all ${
            activeTrack === 'A'
              ? 'border-primary bg-primary/10 text-primary font-medium'
              : 'border-border bg-background hover:bg-muted'
          }`}
        >
          <div className="font-medium">{labelA}</div>
          <div className="text-sm text-muted-foreground">{audioA.name}</div>
        </button>

        <button
          onClick={() => switchTrack('B')}
          className={`p-3 rounded-lg border transition-all ${
            activeTrack === 'B'
              ? 'border-primary bg-primary/10 text-primary font-medium'
              : 'border-border bg-background hover:bg-muted'
          }`}
        >
          <div className="font-medium">{labelB}</div>
          <div className="text-sm text-muted-foreground">{audioB.name}</div>
        </button>
      </div>

      {/* Progress bar */}
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

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="text-sm text-muted-foreground">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => downloadAudioFile(audioA, `${labelA}_${audioA.name}`)}
            title={`Download ${labelA}`}
          >
            <Download className="h-4 w-4 mr-1" />
            {labelA}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => downloadAudioFile(audioB, `${labelB}_${audioB.name}`)}
            title={`Download ${labelB}`}
          >
            <Download className="h-4 w-4 mr-1" />
            {labelB}
          </Button>
        </div>
      </div>

      {/* Hint */}
      <div className="mt-3 text-sm text-muted-foreground">
        Click on a track above to switch between {labelA} and {labelB} during playback
      </div>
    </div>
  );
}
