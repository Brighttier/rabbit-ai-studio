/**
 * Audio Processing Utilities
 * Helper functions for audio separation and mastering
 */

import {
  ProcessedAudio,
  AudioFile,
  AudioSeparationResponse,
  AudioMasteringResponse,
  StemType,
  AudioFormat,
  ApiResponse,
} from './types';

// Local storage keys
const AUDIO_HISTORY_KEY = 'rabbit-audio-history';
const AUDIO_CONFIG_KEY = 'rabbit-audio-config';

/**
 * Audio configuration for local storage
 */
export interface AudioConfig {
  separationModelId?: string;
  separationOutputFormat?: AudioFormat;
  masteringOutputFormat?: AudioFormat;
}

/**
 * Audio history stored in local storage
 */
export interface AudioHistory {
  separations: ProcessedAudio[];
  masterings: ProcessedAudio[];
}

/**
 * Separate audio into stems
 */
export async function separateAudio(
  file: File,
  modelId: string,
  stems: StemType[] | undefined,
  outputFormat: AudioFormat,
  token: string
): Promise<{ success: boolean; data?: AudioSeparationResponse; error?: { message: string } }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelId', modelId);
    if (stems && stems.length > 0) {
      formData.append('stems', stems.join(','));
    }
    formData.append('outputFormat', outputFormat);

    const response = await fetch('/api/audio/separate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result: ApiResponse<AudioSeparationResponse> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to separate audio');
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    console.error('Audio separation failed:', error);
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Master audio
 */
export async function masterAudio(
  targetFile: File,
  referenceFile: File,
  outputFormat: AudioFormat,
  token: string
): Promise<{ success: boolean; data?: AudioMasteringResponse; error?: { message: string } }> {
  try {
    const formData = new FormData();
    formData.append('target', targetFile);
    formData.append('reference', referenceFile);
    formData.append('outputFormat', outputFormat);

    const response = await fetch('/api/audio/master', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result: ApiResponse<AudioMasteringResponse> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to master audio');
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    console.error('Audio mastering failed:', error);
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Download audio file
 */
export function downloadAudioFile(audioFile: AudioFile, filename?: string) {
  const link = document.createElement('a');
  link.href = audioFile.url;
  link.download = filename || audioFile.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download all stems from a separation
 */
export function downloadAllStems(stems: AudioFile[], prefix: string = 'stem') {
  stems.forEach((stem, index) => {
    setTimeout(() => {
      downloadAudioFile(stem, `${prefix}_${stem.name}`);
    }, index * 500); // Stagger downloads
  });
}

/**
 * Load audio history from local storage
 */
export function loadAudioHistory(): AudioHistory | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUDIO_HISTORY_KEY);
    if (!stored) return null;

    const history = JSON.parse(stored);
    // Convert date strings back to Date objects
    history.separations = history.separations.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
    history.masterings = history.masterings.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));

    return history;
  } catch (error) {
    console.error('Failed to load audio history:', error);
    return null;
  }
}

/**
 * Save audio history to local storage
 */
export function saveAudioHistory(history: AudioHistory) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AUDIO_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save audio history:', error);
  }
}

/**
 * Add separation to history
 */
export function addSeparationToHistory(separation: ProcessedAudio) {
  const history = loadAudioHistory() || { separations: [], masterings: [] };
  history.separations.unshift(separation);

  // Keep only last 50 items
  if (history.separations.length > 50) {
    history.separations = history.separations.slice(0, 50);
  }

  saveAudioHistory(history);
}

/**
 * Add mastering to history
 */
export function addMasteringToHistory(mastering: ProcessedAudio) {
  const history = loadAudioHistory() || { separations: [], masterings: [] };
  history.masterings.unshift(mastering);

  // Keep only last 50 items
  if (history.masterings.length > 50) {
    history.masterings = history.masterings.slice(0, 50);
  }

  saveAudioHistory(history);
}

/**
 * Remove item from history
 */
export function removeFromHistory(id: string, type: 'separation' | 'mastering') {
  const history = loadAudioHistory();
  if (!history) return;

  if (type === 'separation') {
    history.separations = history.separations.filter((item) => item.id !== id);
  } else {
    history.masterings = history.masterings.filter((item) => item.id !== id);
  }

  saveAudioHistory(history);
}

/**
 * Clear all history
 */
export function clearAudioHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUDIO_HISTORY_KEY);
}

/**
 * Load audio config from local storage
 */
export function loadAudioConfig(): AudioConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUDIO_CONFIG_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load audio config:', error);
    return null;
  }
}

/**
 * Save audio config to local storage
 */
export function saveAudioConfig(config: AudioConfig) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AUDIO_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save audio config:', error);
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Estimate processing time based on file size and type
 */
export function estimateProcessingTime(
  fileSize: number,
  type: 'separation' | 'mastering'
): string {
  if (type === 'separation') {
    // Demucs: ~1.5x audio duration, rough estimate based on file size
    // Assume ~10MB per minute of audio
    const minutes = fileSize / (10 * 1024 * 1024);
    const processingMinutes = minutes * 1.5;

    if (processingMinutes < 1) {
      return '< 1 minute';
    } else if (processingMinutes < 60) {
      return `~${Math.round(processingMinutes)} minutes`;
    } else {
      const hours = Math.floor(processingMinutes / 60);
      const mins = Math.round(processingMinutes % 60);
      return `~${hours}h ${mins}m`;
    }
  } else {
    // Matchering: typically 10-30 seconds
    return '10-30 seconds';
  }
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 100MB)
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatFileSize(MAX_SIZE)}`,
    };
  }

  // Check file type
  const validExtensions = ['.mp3', '.wav', '.flac', '.m4a'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!validExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Supported formats: ${validExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get audio file duration (requires HTML5 Audio API)
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio file'));
    });

    audio.src = url;
  });
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
