'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { AudioFormat } from '@/lib/types';
import {
  masterAudio,
  validateAudioFile,
  estimateProcessingTime,
  formatFileSize,
} from '@/lib/audio';

interface AudioMasteringProps {
  onSuccess: (response: any, targetFile: string, referenceFile: string) => void;
  onError: (error: string) => void;
  token: string;
}

export function AudioMastering({
  onSuccess,
  onError,
  token,
}: AudioMasteringProps) {
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('wav');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [isDraggingReference, setIsDraggingReference] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'target' | 'reference') => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateAudioFile(selectedFile);
      if (!validation.valid) {
        onError(validation.error || 'Invalid audio file');
        return;
      }

      if (type === 'target') {
        setTargetFile(selectedFile);
      } else {
        setReferenceFile(selectedFile);
      }
    }
  };

  // Handle drag and drop for target
  const handleTargetDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingTarget(true);
  }, []);

  const handleTargetDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingTarget(false);
  }, []);

  const handleTargetDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingTarget(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validation = validateAudioFile(droppedFile);
      if (!validation.valid) {
        onError(validation.error || 'Invalid audio file');
        return;
      }
      setTargetFile(droppedFile);
    }
  }, [onError]);

  // Handle drag and drop for reference
  const handleReferenceDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingReference(true);
  }, []);

  const handleReferenceDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingReference(false);
  }, []);

  const handleReferenceDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingReference(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validation = validateAudioFile(droppedFile);
      if (!validation.valid) {
        onError(validation.error || 'Invalid audio file');
        return;
      }
      setReferenceFile(droppedFile);
    }
  }, [onError]);

  // Handle mastering
  const handleMaster = async () => {
    if (!targetFile) {
      onError('Please select a target audio file');
      return;
    }

    if (!referenceFile) {
      onError('Please select a reference audio file');
      return;
    }

    setIsProcessing(true);
    setProgress('Uploading files...');

    try {
      // Call mastering API
      const result = await masterAudio(
        targetFile,
        referenceFile,
        outputFormat,
        token
      );

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Mastering failed');
      }

      setProgress('');
      onSuccess(result.data, targetFile.name, referenceFile.name);

      // Reset form
      setTargetFile(null);
      setReferenceFile(null);
    } catch (error: any) {
      setProgress('');
      onError(error.message || 'Failed to master audio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Audio Mastering</h2>

      {/* Target File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Target Audio (Your Track)
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDraggingTarget
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleTargetDragOver}
          onDragLeave={handleTargetDragLeave}
          onDrop={handleTargetDrop}
        >
          {targetFile ? (
            <div>
              <div className="font-medium">{targetFile.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatFileSize(targetFile.size)} • {targetFile.type}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setTargetFile(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm text-muted-foreground mb-2">
                Drop your track here or click to browse
              </div>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.m4a"
                onChange={(e) => handleFileChange(e, 'target')}
                className="hidden"
                id="target-upload"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('target-upload')?.click()}
                disabled={isProcessing}
              >
                Browse Files
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reference File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Reference Audio (Track to Match)
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDraggingReference
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleReferenceDragOver}
          onDragLeave={handleReferenceDragLeave}
          onDrop={handleReferenceDrop}
        >
          {referenceFile ? (
            <div>
              <div className="font-medium">{referenceFile.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatFileSize(referenceFile.size)} • {referenceFile.type}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setReferenceFile(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm text-muted-foreground mb-2">
                Drop reference track here or click to browse
              </div>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.m4a"
                onChange={(e) => handleFileChange(e, 'reference')}
                className="hidden"
                id="reference-upload"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('reference-upload')?.click()}
                disabled={isProcessing}
              >
                Browse Files
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Output Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['wav', 'mp3', 'flac'] as AudioFormat[]).map((format) => (
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
        <p className="text-sm text-muted-foreground mt-2">
          WAV recommended for highest quality
        </p>
      </div>

      {/* Processing Time Estimate */}
      {targetFile && referenceFile && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          Estimated processing time: {estimateProcessingTime(
            Math.max(targetFile.size, referenceFile.size),
            'mastering'
          )}
        </div>
      )}

      {/* Process Button */}
      <Button
        onClick={handleMaster}
        disabled={!targetFile || !referenceFile || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {progress || 'Processing...'}
          </>
        ) : (
          'Master Audio'
        )}
      </Button>

      {/* Info */}
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <strong>How it works:</strong> Matchering analyzes your target audio and applies mastering
        to match the sonic characteristics (RMS, frequency response, stereo width) of the reference track.
        This is useful for making your mix sound similar to professionally mastered music.
      </div>
    </div>
  );
}
