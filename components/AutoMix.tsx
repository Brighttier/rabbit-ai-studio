'use client';

import { useState, useCallback } from 'react';
import { Upload, Music2, Sparkles, Play, Download, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AudioPlayer } from './AudioPlayer';

interface StemFile {
  type: 'vocals' | 'drums' | 'bass' | 'other';
  file: File;
  url: string;
  size: number;
}

interface MixResult {
  id: string;
  mixedFile: {
    filename: string;
    url: string;
    size: number;
    format: string;
  };
  originalStems: StemFile[];
  timestamp: Date;
}

export default function AutoMix() {
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [fullTrack, setFullTrack] = useState<File | null>(null);
  const [stems, setStems] = useState<StemFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{
    step: 'separating' | 'mixing' | 'done';
    percentage: number;
    message: string;
  } | null>(null);
  const [mixResult, setMixResult] = useState<MixResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if all required stems are present
  const hasAllStems = useCallback(() => {
    const requiredStems = ['vocals', 'drums', 'bass', 'other'];
    const presentStems = stems.map(s => s.type);
    return requiredStems.every(type => presentStems.includes(type as any));
  }, [stems]);

  // Handle full track upload (Quick Mix mode)
  const handleFullTrackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFullTrack(file);
      setError(null);
    }
  };

  // Handle individual stem upload (Custom Mix mode)
  const handleStemUpload = (type: StemFile['type'], file: File) => {
    // Remove existing stem of this type if present
    const filteredStems = stems.filter(s => s.type !== type);

    const newStem: StemFile = {
      type,
      file,
      url: URL.createObjectURL(file),
      size: file.size,
    };

    setStems([...filteredStems, newStem]);
    setError(null);
  };

  // Remove a stem
  const removeStem = (type: StemFile['type']) => {
    setStems(stems.filter(s => s.type !== type));
  };

  // Process Quick Mix (separate + mix in one go)
  const handleQuickMix = async () => {
    if (!fullTrack) return;

    setProcessing(true);
    setError(null);
    setProgress({ step: 'separating', percentage: 0, message: 'Separating stems...' });

    try {
      // Step 1: Separate stems
      const separateFormData = new FormData();
      separateFormData.append('file', fullTrack);
      separateFormData.append('model', 'htdemucs');
      separateFormData.append('output_format', 'wav');

      const separateResponse = await fetch('/api/audio/separate', {
        method: 'POST',
        body: separateFormData,
      });

      if (!separateResponse.ok) {
        throw new Error('Failed to separate stems');
      }

      const separateData = await separateResponse.json();
      setProgress({ step: 'mixing', percentage: 50, message: 'Mixing stems professionally...' });

      // Step 2: Auto-mix the separated stems
      const mixFormData = new FormData();
      mixFormData.append('job_id', separateData.job_id);
      mixFormData.append('output_format', 'wav');

      const mixResponse = await fetch('/api/audio/automix', {
        method: 'POST',
        body: mixFormData,
      });

      if (!mixResponse.ok) {
        throw new Error('Failed to mix stems');
      }

      const mixData = await mixResponse.json();

      setProgress({ step: 'done', percentage: 100, message: 'Mix complete!' });
      setMixResult({
        id: mixData.job_id,
        mixedFile: mixData.mixedFile,
        originalStems: separateData.stems.map((s: any) => ({
          type: s.name,
          url: `/api/download/${separateData.job_id}/${s.filename}`,
          size: s.size,
          file: null as any,
        })),
        timestamp: new Date(),
      });

      setTimeout(() => setProgress(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process audio');
      setProgress(null);
    } finally {
      setProcessing(false);
    }
  };

  // Process Custom Mix (upload stems manually)
  const handleCustomMix = async () => {
    if (!hasAllStems()) {
      setError('Please upload all required stems (vocals, drums, bass, other)');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress({ step: 'mixing', percentage: 0, message: 'Mixing your stems...' });

    try {
      const formData = new FormData();
      stems.forEach(stem => {
        formData.append(stem.type, stem.file);
      });
      formData.append('output_format', 'wav');

      const response = await fetch('/api/audio/automix', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to mix stems');
      }

      const data = await response.json();

      setProgress({ step: 'done', percentage: 100, message: 'Mix complete!' });
      setMixResult({
        id: data.job_id,
        mixedFile: data.mixedFile,
        originalStems: stems,
        timestamp: new Date(),
      });

      setTimeout(() => setProgress(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mix audio');
      setProgress(null);
    } finally {
      setProcessing(false);
    }
  };

  // Stem upload component for custom mode
  const StemUploadSlot = ({ type, icon }: { type: StemFile['type']; icon: string }) => {
    const stem = stems.find(s => s.type === type);
    const inputId = `stem-${type}`;

    return (
      <Card className="p-4 relative">
        <input
          id={inputId}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleStemUpload(type, file);
          }}
        />

        {stem ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-2xl">{icon}</div>
                <div>
                  <p className="font-medium capitalize">{type}</p>
                  <p className="text-xs text-muted-foreground">
                    {(stem.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeStem(type)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Ready</span>
            </div>
          </div>
        ) : (
          <label htmlFor={inputId} className="cursor-pointer block">
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="text-3xl opacity-50">{icon}</div>
              <p className="font-medium capitalize">{type}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>Click to upload</span>
              </div>
            </div>
          </label>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('quick')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 ${
            mode === 'quick'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Quick Mix
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 ${
            mode === 'custom'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Music2 className="h-4 w-4" />
          Custom Mix
        </button>
      </div>

      {/* Quick Mix Mode */}
      {mode === 'quick' && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Quick Auto-Mix</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a song and we'll automatically separate and mix it professionally
                </p>
              </div>

              {!fullTrack ? (
                <label className="border-2 border-dashed rounded-lg p-12 cursor-pointer hover:border-primary transition-colors block">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFullTrackUpload}
                  />
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">Upload your song</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        MP3, WAV, FLAC, M4A (max 100MB)
                      </p>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Music2 className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{fullTrack.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(fullTrack.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFullTrack(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>

                  <Button
                    onClick={handleQuickMix}
                    disabled={processing}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Auto-Mix This Track
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Custom Mix Mode */}
      {mode === 'custom' && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Custom Stem Mixing</h3>
                <p className="text-sm text-muted-foreground">
                  Upload individual stems for precise control over your mix
                </p>
              </div>

              {/* Stem Upload Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StemUploadSlot type="vocals" icon="🎤" />
                <StemUploadSlot type="drums" icon="🥁" />
                <StemUploadSlot type="bass" icon="🎸" />
                <StemUploadSlot type="other" icon="🎹" />
              </div>

              {/* Mix Button */}
              <Button
                onClick={handleCustomMix}
                disabled={!hasAllStems() || processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mixing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Mix Stems ({stems.length}/4)
                  </>
                )}
              </Button>

              {!hasAllStems() && stems.length > 0 && (
                <p className="text-sm text-yellow-600 text-center">
                  {4 - stems.length} more stem{4 - stems.length !== 1 ? 's' : ''} required
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Progress Indicator */}
      {progress && (
        <Card className="p-6 border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{progress.message}</p>
              <span className="text-sm text-muted-foreground">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Mix Result */}
      {mixResult && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">🎉 Your Professional Mix is Ready!</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(mixResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Mixed Audio Player */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Mixed Output</p>
            <AudioPlayer
              audioFile={{
                name: mixResult.mixedFile.filename,
                url: mixResult.mixedFile.url,
                format: mixResult.mixedFile.format as any,
                size: mixResult.mixedFile.size,
              }}
              showWaveform
              showDownload={false}
            />
          </div>

          {/* Download Button */}
          <Button className="w-full" size="lg" asChild>
            <a href={mixResult.mixedFile.url} download={mixResult.mixedFile.filename}>
              <Download className="mr-2 h-4 w-4" />
              Download Mixed Track ({(mixResult.mixedFile.size / 1024 / 1024).toFixed(2)} MB)
            </a>
          </Button>

          {/* Individual Stems Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Original Stems Used</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {mixResult.originalStems.map((stem, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="capitalize">{stem.type}</span>
                  <span className="text-muted-foreground">
                    ({(stem.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
