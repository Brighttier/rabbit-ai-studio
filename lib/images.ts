/**
 * Image Generation Utilities
 * Client-side utilities for managing image generation
 */

import { GeneratedImage } from '@/components/ImageCard';

/**
 * Generate an image using the API
 */
export async function generateImage(
  prompt: string,
  config: {
    modelId: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    guidanceScale?: number;
    seed?: number;
    numImages?: number;
    stylePreset?: string;
  },
  token: string
): Promise<{ success: boolean; images?: GeneratedImage[]; error?: any }> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt,
        modelId: config.modelId,
        negativePrompt: config.negativePrompt,
        width: config.width ?? 512,
        height: config.height ?? 512,
        steps: config.steps ?? 20,
        guidanceScale: config.guidanceScale ?? 7.5,
        seed: config.seed,
        numImages: config.numImages ?? 1,
        stylePreset: config.stylePreset,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || { message: `HTTP error! status: ${response.status}` },
      };
    }

    // Convert API response to GeneratedImage format
    const images: GeneratedImage[] = result.data.images.map((imgUrl: string, index: number) => ({
      id: `img-${Date.now()}-${index}`,
      url: imgUrl, // Images are returned as strings (base64 data URLs or URLs)
      prompt,
      negativePrompt: config.negativePrompt,
      width: config.width ?? 512,
      height: config.height ?? 512,
      modelName: result.data.modelId,
      timestamp: new Date(),
      seed: config.seed,
      steps: config.steps,
      guidanceScale: config.guidanceScale,
      stylePreset: config.stylePreset,
    }));

    return { success: true, images };
  } catch (error: any) {
    return {
      success: false,
      error: { message: error.message || 'Failed to generate image' },
    };
  }
}

/**
 * Download an image to the user's device
 */
export function downloadImage(image: GeneratedImage): void {
  const link = document.createElement('a');
  link.href = image.url;
  link.download = `rabbit-${image.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download multiple images as a zip (requires JSZip)
 * For now, just downloads them one by one
 */
export async function downloadMultipleImages(images: GeneratedImage[]): Promise<void> {
  for (const image of images) {
    downloadImage(image);
    // Add small delay between downloads to avoid browser blocking
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Copy image URL to clipboard
 */
export async function copyImageUrl(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy URL:', error);
    return false;
  }
}

/**
 * Copy image prompt to clipboard
 */
export async function copyPrompt(prompt: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(prompt);
    return true;
  } catch (error) {
    console.error('Failed to copy prompt:', error);
    return false;
  }
}

/**
 * Format image resolution for display
 */
export function formatResolution(width: number, height: number): string {
  const megapixels = (width * height) / 1_000_000;
  return `${width}×${height} (${megapixels.toFixed(1)}MP)`;
}

/**
 * Calculate aspect ratio
 */
export function getAspectRatio(width: number, height: number): string {
  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }

  const divisor = gcd(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;

  // Common aspect ratio names
  if (ratioWidth === 1 && ratioHeight === 1) return 'Square (1:1)';
  if (ratioWidth === 16 && ratioHeight === 9) return 'Widescreen (16:9)';
  if (ratioWidth === 4 && ratioHeight === 3) return 'Standard (4:3)';
  if (ratioWidth === 3 && ratioHeight === 2) return 'Classic (3:2)';
  if (ratioWidth === 2 && ratioHeight === 3) return 'Portrait (2:3)';

  return `${ratioWidth}:${ratioHeight}`;
}

/**
 * Estimate generation time based on configuration
 */
export function estimateGenerationTime(
  width: number,
  height: number,
  steps: number,
  numImages: number
): string {
  // Very rough estimation: 0.5 seconds per step per megapixel per image
  const megapixels = (width * height) / 1_000_000;
  const seconds = megapixels * steps * numImages * 0.5;

  if (seconds < 60) return `~${Math.round(seconds)} seconds`;
  const minutes = Math.round(seconds / 60);
  return `~${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/**
 * Validate image generation configuration
 */
export function validateImageConfig(config: {
  prompt: string;
  modelId: string;
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  numImages: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.prompt.trim()) {
    errors.push('Prompt is required');
  }

  if (config.prompt.length > 1000) {
    errors.push('Prompt must be less than 1000 characters');
  }

  if (!config.modelId) {
    errors.push('Model must be selected');
  }

  if (config.width < 64 || config.width > 2048) {
    errors.push('Width must be between 64 and 2048 pixels');
  }

  if (config.height < 64 || config.height > 2048) {
    errors.push('Height must be between 64 and 2048 pixels');
  }

  if (config.steps < 1 || config.steps > 150) {
    errors.push('Steps must be between 1 and 150');
  }

  if (config.guidanceScale < 0 || config.guidanceScale > 30) {
    errors.push('Guidance scale must be between 0 and 30');
  }

  if (config.numImages < 1 || config.numImages > 10) {
    errors.push('Number of images must be between 1 and 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Local storage keys
 */
const STORAGE_KEYS = {
  IMAGE_HISTORY: 'rabbit-image-history',
  IMAGE_CONFIG: 'rabbit-image-config',
} as const;

/**
 * Save images to local storage
 */
export function saveImageHistory(images: GeneratedImage[]): void {
  if (typeof window !== 'undefined') {
    try {
      // Keep only last 100 images to avoid storage issues
      const limited = images.slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.IMAGE_HISTORY, JSON.stringify(limited));
    } catch (error) {
      console.error('Failed to save image history:', error);
    }
  }
}

/**
 * Load images from local storage
 */
export function loadImageHistory(): GeneratedImage[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((img: any) => ({
          ...img,
          timestamp: new Date(img.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load image history:', error);
    }
  }
  return [];
}

/**
 * Clear image history
 */
export function clearImageHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.IMAGE_HISTORY);
  }
}

/**
 * Save image generation config
 */
export function saveImageConfig(config: any): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save image config:', error);
    }
  }
}

/**
 * Load image generation config
 */
export function loadImageConfig(): any | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_CONFIG);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load image config:', error);
    }
  }
  return null;
}

/**
 * Add image to history
 */
export function addImageToHistory(image: GeneratedImage): void {
  const history = loadImageHistory();
  history.unshift(image);
  saveImageHistory(history);
}

/**
 * Add multiple images to history
 */
export function addImagesToHistory(images: GeneratedImage[]): void {
  const history = loadImageHistory();
  history.unshift(...images);
  saveImageHistory(history);
}

/**
 * Remove image from history
 */
export function removeImageFromHistory(imageId: string): void {
  const history = loadImageHistory();
  const filtered = history.filter((img) => img.id !== imageId);
  saveImageHistory(filtered);
}

/**
 * Get style preset description
 */
export function getStylePresetDescription(preset: string): string {
  const presets: Record<string, string> = {
    photographic: 'Realistic photography style with natural lighting',
    'digital-art': 'Digital illustration with vibrant colors',
    anime: 'Anime and manga artistic style',
    'fantasy-art': 'Fantasy and magical artistic style',
    '3d-model': '3D rendered with realistic materials',
    'comic-book': 'Comic book illustration style',
    cinematic: 'Movie-like composition and lighting',
    abstract: 'Abstract and experimental art style',
  };

  return presets[preset] || preset;
}
