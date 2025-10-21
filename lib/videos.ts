/**
 * Video Generation Utilities
 * Helper functions for video generation, storage, and management
 */

export interface GeneratedVideo {
  id: string;
  videoUrl: string;
  prompt: string;
  modelId: string;
  modelName?: string;
  provider?: string;
  duration?: number;
  fps?: number;
  resolution?: string;
  inputImage?: string;
  createdAt: Date;
}

export interface VideoConfig {
  modelId: string;
  prompt: string;
  duration?: number;
  fps?: number;
  resolution?: string;
  inputImage?: string;
}

const VIDEO_HISTORY_KEY = 'rabbit_video_history';
const VIDEO_CONFIG_KEY = 'rabbit_video_config';
const MAX_HISTORY_ITEMS = 50;

/**
 * Generate a video using the API
 */
export async function generateVideo(
  prompt: string,
  options: {
    modelId: string;
    duration?: number;
    fps?: number;
    resolution?: string;
    inputImage?: string;
  },
  token: string
): Promise<{
  success: boolean;
  video?: GeneratedVideo;
  error?: { message: string; code?: string };
}> {
  try {
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt,
        modelId: options.modelId,
        duration: options.duration,
        fps: options.fps,
        resolution: options.resolution,
        inputImage: options.inputImage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: `HTTP ${response.status}: ${response.statusText}` },
      }));
      return {
        success: false,
        error: errorData.error || { message: 'Failed to generate video' },
      };
    }

    const data = await response.json();

    if (!data.success || !data.videoUrl) {
      return {
        success: false,
        error: data.error || { message: 'No video URL returned' },
      };
    }

    // Create video object
    const video: GeneratedVideo = {
      id: crypto.randomUUID(),
      videoUrl: data.videoUrl,
      prompt,
      modelId: options.modelId,
      modelName: data.modelName,
      provider: data.provider,
      duration: options.duration,
      fps: options.fps,
      resolution: options.resolution,
      inputImage: options.inputImage,
      createdAt: new Date(),
    };

    return { success: true, video };
  } catch (error: any) {
    console.error('Video generation error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to generate video',
        code: 'GENERATION_ERROR',
      },
    };
  }
}

/**
 * Download a video
 */
export function downloadVideo(video: GeneratedVideo) {
  const link = document.createElement('a');
  link.href = video.videoUrl;
  link.download = `rabbit-video-${video.id}.mp4`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Load video history from localStorage
 */
export function loadVideoHistory(): GeneratedVideo[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(VIDEO_HISTORY_KEY);
    if (!stored) return [];

    const videos = JSON.parse(stored);
    // Convert date strings back to Date objects
    return videos.map((video: any) => ({
      ...video,
      createdAt: new Date(video.createdAt),
    }));
  } catch (error) {
    console.error('Failed to load video history:', error);
    return [];
  }
}

/**
 * Save video history to localStorage
 */
export function saveVideoHistory(videos: GeneratedVideo[]) {
  if (typeof window === 'undefined') return;

  try {
    // Keep only the most recent items
    const trimmed = videos.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(VIDEO_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save video history:', error);
  }
}

/**
 * Add videos to history
 */
export function addVideosToHistory(newVideos: GeneratedVideo[]) {
  const existing = loadVideoHistory();
  const updated = [...newVideos, ...existing];
  saveVideoHistory(updated);
}

/**
 * Remove a video from history
 */
export function removeVideoFromHistory(videoId: string) {
  const existing = loadVideoHistory();
  const updated = existing.filter((video) => video.id !== videoId);
  saveVideoHistory(updated);
}

/**
 * Clear all video history
 */
export function clearVideoHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VIDEO_HISTORY_KEY);
}

/**
 * Load saved video config
 */
export function loadVideoConfig(): Partial<VideoConfig> | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(VIDEO_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load video config:', error);
    return null;
  }
}

/**
 * Save video config
 */
export function saveVideoConfig(config: Partial<VideoConfig>) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(VIDEO_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save video config:', error);
  }
}
