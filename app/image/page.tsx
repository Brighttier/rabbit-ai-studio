'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ImageGenerationForm, ImageConfig } from '@/components/ImageGenerationForm';
import { ImageGallery } from '@/components/ImageGallery';
import { GeneratedImage } from '@/components/ImageCard';
import { Button } from '@/components/ui/button';
import {
  generateImage,
  downloadImage,
  loadImageHistory,
  saveImageHistory,
  addImagesToHistory,
  removeImageFromHistory,
  clearImageHistory,
  loadImageConfig,
  saveImageConfig,
} from '@/lib/images';

import { useAuth } from '@/lib/firebase/auth';

export default function ImageGenerationPage() {
  const { user, token, userRole } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Image generation configuration
  const [config, setConfig] = useState<ImageConfig>({
    modelId: '',
    prompt: '',
    negativePrompt: '',
    width: 512,
    height: 512,
    steps: 20,
    guidanceScale: 7.5,
    numImages: 1,
    stylePreset: undefined,
  });

    // Initialize
  useEffect(() => {
    if (!user) {
      setError('Please sign in to generate images.');
      return;
    }

    // Load saved images from local storage
    const savedImages = loadImageHistory();
    if (savedImages) {
      setImages(savedImages);
    }

    // Load saved config
    const savedConfig = loadImageConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [user]);

  // Save config when it changes (but not prompt)
  useEffect(() => {
    if (config.modelId) {
      const configToSave = {
        modelId: config.modelId,
        model: config.model,
        negativePrompt: config.negativePrompt,
        width: config.width,
        height: config.height,
        steps: config.steps,
        guidanceScale: config.guidanceScale,
        numImages: config.numImages,
        stylePreset: config.stylePreset,
        seed: config.seed,
      };
      saveImageConfig(configToSave);
    }
  }, [
    config.modelId,
    config.model,
    config.negativePrompt,
    config.width,
    config.height,
    config.steps,
    config.guidanceScale,
    config.numImages,
    config.stylePreset,
    config.seed,
  ]);

  async function handleGenerate() {
    if (!token || !config.modelId || !config.prompt.trim()) {
      setError('Please select a model and enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await generateImage(
        config.prompt,
        {
          modelId: config.modelId,
          negativePrompt: config.negativePrompt || undefined,
          width: config.width,
          height: config.height,
          steps: config.steps,
          guidanceScale: config.guidanceScale,
          seed: config.seed,
          numImages: config.numImages,
          stylePreset: config.stylePreset,
        },
        token
      );

      if (!result.success || !result.images) {
        throw new Error(result.error?.message || 'Failed to generate image');
      }

      // Add to gallery
      setImages((prev) => [...result.images!, ...prev]);

      // Save to local storage
      addImagesToHistory(result.images);

      // Show success message
      setSuccessMessage(
        `Successfully generated ${result.images.length} ${
          result.images.length === 1 ? 'image' : 'images'
        }!`
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownload(image: GeneratedImage) {
    try {
      downloadImage(image);
    } catch (err: any) {
      setError(`Failed to download image: ${err.message}`);
    }
  }

  function handleDelete(imageId: string) {
    if (confirm('Are you sure you want to delete this image?')) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      removeImageFromHistory(imageId);
    }
  }

  function handleUsePrompt(prompt: string) {
    setConfig((prev) => ({ ...prev, prompt }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleClearAll() {
    if (confirm('Are you sure you want to clear all generated images? This cannot be undone.')) {
      setImages([]);
      clearImageHistory();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Image Generation</h1>
            <p className="text-sm text-muted-foreground">
              Create images with AI-powered models
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/chat')}>
              Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/video')}>
              Video
            </Button>
            {userRole === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => (window.location.href = '/admin/models')}>
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/')}>
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Generation Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Generate New Image
                </h2>

                <ImageGenerationForm
                  config={config}
                  onChange={setConfig}
                  onGenerate={handleGenerate}
                  token={token || undefined}
                  disabled={isGenerating}
                  isGenerating={isGenerating}
                />

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                    {successMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Image Gallery */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Generated Images</h2>
                {images.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {images.length} {images.length === 1 ? 'image' : 'images'} total
                  </p>
                )}
              </div>

              <ImageGallery
                images={images}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onUsePrompt={handleUsePrompt}
                onClearAll={handleClearAll}
                isLoading={isGenerating}
                emptyMessage="No images generated yet"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="max-w-7xl mx-auto p-4 mt-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Tips for Better Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground mb-1">✍️ Detailed Prompts</div>
              <p>Be specific about style, composition, lighting, and details you want to see.</p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">🎨 Use Style Presets</div>
              <p>
                Style presets help guide the model toward specific artistic styles and aesthetics.
              </p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">⚙️ Adjust Settings</div>
              <p>Higher steps = better quality but slower. Guidance scale controls prompt adherence.</p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">🚫 Negative Prompts</div>
              <p>
                Specify what you don't want (e.g., "blurry, distorted, low quality").
              </p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">🎲 Use Seeds</div>
              <p>
                Setting a seed allows you to reproduce the same image with slight variations.
              </p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">📐 Resolution</div>
              <p>
                Higher resolutions take longer but produce more detailed images.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="max-w-7xl mx-auto p-4 mt-6 mb-12">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Example Prompts</h3>
          <div className="space-y-2 text-sm">
            <button
              onClick={() =>
                handleUsePrompt(
                  'A serene mountain landscape at sunset, snow-capped peaks, reflective alpine lake, golden hour lighting, highly detailed, 4k'
                )
              }
              className="block w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-foreground">Landscape:</span>{' '}
              <span className="text-muted-foreground">
                A serene mountain landscape at sunset, snow-capped peaks...
              </span>
            </button>
            <button
              onClick={() =>
                handleUsePrompt(
                  'Portrait of a cyberpunk character, neon lights, futuristic city background, detailed face, digital art style'
                )
              }
              className="block w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-foreground">Portrait:</span>{' '}
              <span className="text-muted-foreground">
                Portrait of a cyberpunk character, neon lights, futuristic city...
              </span>
            </button>
            <button
              onClick={() =>
                handleUsePrompt(
                  'A majestic dragon perched on a castle tower, fantasy art, dramatic lighting, epic composition, highly detailed scales'
                )
              }
              className="block w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-foreground">Fantasy:</span>{' '}
              <span className="text-muted-foreground">
                A majestic dragon perched on a castle tower, fantasy art...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
