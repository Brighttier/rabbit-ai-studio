'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { StemType, AudioFormat } from '@/lib/types';
import {
  separateAudio,
  validateAudioFile,
  estimateProcessingTime,
  formatFileSize,
} from '@/lib/audio';

interface StemSeparationProps {
  modelId: string;
  models: any[];
  onSuccess: (response: any, originalFile: string) => void;
  onError: (error: string) => void;
  token: string;
}

export function StemSeparation({
  modelId,
  models,
  onSuccess,
  onError,
  token,
}: StemSeparationProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedStems, setSelectedStems] = useState<StemType[]>([]);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('wav');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const allStems: StemType[] = ['vocals', 'drums', 'bass', 'other'];

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateAudioFile(selectedFile);
      if (!validation.valid) {
        onError(validation.error || 'Invalid audio file');
        return;
      }
      setFile(selectedFile);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validation = validateAudioFile(droppedFile);
      if (!validation.valid) {
        onError(validation.error || 'Invalid audio file');
        return;
      }
      setFile(droppedFile);
    }
  }, [onError]);

  // Toggle stem selection
  const toggleStem = (stem: StemType) => {
    setSelectedStems((prev) =>
      prev.includes(stem)
        ? prev.filter((s) => s !== stem)
        : [...prev, stem]
    );
  };

  // Handle separation
  const handleSeparate = async () => {
    if (!file) {
      onError('Please select an audio file');
      return;
    }

    if (!modelId) {
      onError('Please select a model');
      return;
    }

    setIsProcessing(true);
    setProgress('Uploading file...');

    try {
      // Call separation API
      const result = await separateAudio(
        file,
        modelId,
        selectedStems.length > 0 ? selectedStems : undefined,
        outputFormat,
        token
      );

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Separation failed');
      }

      setProgress('');
      onSuccess(result.data, file.name);

      // Reset form
      setFile(null);
      setSelectedStems([]);
    } catch (error: any) {
      setProgress('');
      onError(error.message || 'Failed to separate audio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Stem Separation</h2>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Audio File
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatFileSize(file.size)} • {file.type}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Est. processing time: {estimateProcessingTime(file.size, 'separation')}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setFile(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm text-muted-foreground mb-2">
                Drag and drop an audio file here, or click to browse
              </div>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.m4a"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('audio-upload')?.click()}
                disabled={isProcessing}
              >
                Browse Files
              </Button>
              <div className="text-xs text-muted-foreground mt-2">
                Supported: MP3, WAV, FLAC, M4A (max 100MB)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Demucs Model
        </label>
        <p className="text-sm text-muted-foreground mb-2">
          htdemucs is recommended for best quality
        </p>
      </div>

      {/* Stem Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Stems to Extract (leave empty for all)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {allStems.map((stem) => (
            <button
              key={stem}
              onClick={() => toggleStem(stem)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedStems.includes(stem)
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border bg-background hover:bg-muted'
              }`}
              disabled={isProcessing}
            >
              <div className="capitalize">{stem}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Output Format
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['wav', 'mp3', 'flac', 'm4a'] as AudioFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => setOutputFormat(format)}
              className={`p-2 rounded-lg border text-center transition-all ${
                outputFormat === format
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border bg-background hover:bg-muted'
              }`}
              disabled={isProcessing}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Process Button */}
      <Button
        onClick={handleSeparate}
        disabled={!file || !modelId || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {progress || 'Processing...'}
          </>
        ) : (
          'Separate Audio'
        )}
      </Button>

      {/* Info */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <strong>Note:</strong> Stem separation uses the Demucs AI model running on the GPU server.
        Processing time is approximately 1.5× the duration of your audio file.
      </div>
    </div>
  );
}
