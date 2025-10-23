'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth';
import { VideoGallery } from '@/components/VideoGallery';
import { GPUServerStatusBanner } from '@/components/GPUServerStatusBanner';
import {
  generateVideo,
  downloadVideo,
  loadVideoHistory,
  saveVideoHistory,
  addVideosToHistory,
  removeVideoFromHistory,
  clearVideoHistory,
  loadVideoConfig,
  saveVideoConfig,
  GeneratedVideo,
  VideoConfig,
} from '@/lib/videos';

export default function VideoGenerationPage() {
  const { user, token, userRole } = useAuth();
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [models, setModels] = useState<any[]>([]);

  // Video generation configuration
  const [config, setConfig] = useState<VideoConfig>({
    modelId: '',
    prompt: '',
    duration: 5,
    fps: 24,
    resolution: '576x1024',
    inputImage: undefined,
  });

  // Initialize
  useEffect(() => {
    // Load saved videos from local storage
    const savedVideos = loadVideoHistory();
    if (savedVideos) {
      setVideos(savedVideos);
    }

    // Load saved config
    const savedConfig = loadVideoConfig();
    if (savedConfig) {
      setConfig((prev) => ({ ...prev, ...savedConfig }));
    }

    // Fetch available video models
    fetchModels();
  }, []);

  // Save config when it changes (but not prompt)
  useEffect(() => {
    if (config.modelId) {
      const configToSave = {
        modelId: config.modelId,
        duration: config.duration,
        fps: config.fps,
        resolution: config.resolution,
      };
      saveVideoConfig(configToSave);
    }
  }, [config.modelId, config.duration, config.fps, config.resolution]);

  async function fetchModels() {
    try {
      const response = await fetch('/api/models?type=video');
      if (response.ok) {
        const result = await response.json();
        const models = result.data || [];
        setModels(models);

        // Auto-select first enabled model if none selected
        const enabledModels = models.filter((m: any) => m.enabled);
        if (!config.modelId && enabledModels.length > 0) {
          setConfig((prev) => ({ ...prev, modelId: enabledModels[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  }

  async function handleGenerate() {
    if (!token || !config.modelId || !config.prompt.trim()) {
      setError('Please select a model and enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await generateVideo(
        config.prompt,
        {
          modelId: config.modelId,
          duration: config.duration,
          fps: config.fps,
          resolution: config.resolution,
          inputImage: config.inputImage,
        },
        token
      );

      if (!result.success || !result.video) {
        throw new Error(result.error?.message || 'Failed to generate video');
      }

      // Add to gallery
      setVideos((prev) => [result.video!, ...prev]);

      // Save to local storage
      addVideosToHistory([result.video!]);

      // Show success message
      setSuccessMessage('Video generated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownload(video: GeneratedVideo) {
    try {
      downloadVideo(video);
    } catch (err: any) {
      setError(`Failed to download video: ${err.message}`);
    }
  }

  function handleDelete(videoId: string) {
    if (confirm('Are you sure you want to delete this video?')) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      removeVideoFromHistory(videoId);
    }
  }

  function handleClearAll() {
    if (confirm('Are you sure you want to clear all generated videos? This cannot be undone.')) {
      setVideos([]);
      clearVideoHistory();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Video Generation</h1>
            <p className="text-sm text-muted-foreground">
              Create videos with AI-powered models
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/chat')}>
              Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/image')}>
              Images
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

      {/* Server Status Indicator */}
      {token && (
        <div className="border-b border-border bg-card px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <GPUServerStatusBanner token={token} userRole={userRole || undefined} compact={true} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Generation Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Generate New Video
                </h2>

                {/* Model Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Model
                  </label>
                  <select
                    value={config.modelId}
                    onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    disabled={isGenerating}
                  >
                    <option value="">Select a model...</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.displayName || model.name}
                        {model.provider === 'comfyui' && ' (Self-Hosted)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prompt */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Prompt
                  </label>
                  <textarea
                    value={config.prompt}
                    onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                    placeholder="Describe the video you want to generate..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
                    disabled={isGenerating}
                  />
                </div>

                {/* Duration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Duration: {config.duration}s
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={config.duration}
                    onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                    className="w-full"
                    disabled={isGenerating}
                  />
                </div>

                {/* FPS */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    FPS: {config.fps}
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="30"
                    step="6"
                    value={config.fps}
                    onChange={(e) => setConfig({ ...config, fps: parseInt(e.target.value) })}
                    className="w-full"
                    disabled={isGenerating}
                  />
                </div>

                {/* Resolution */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Resolution
                  </label>
                  <select
                    value={config.resolution}
                    onChange={(e) => setConfig({ ...config, resolution: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    disabled={isGenerating}
                  >
                    <option value="576x1024">576x1024 (Portrait)</option>
                    <option value="720p">1280x720 (720p)</option>
                    <option value="1080p">1920x1080 (1080p)</option>
                  </select>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !config.modelId || !config.prompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate Video'}
                </Button>

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

          {/* Right Panel - Video Gallery */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <VideoGallery
                videos={videos}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onClearAll={handleClearAll}
                isLoading={isGenerating}
                emptyMessage="No videos generated yet. Create your first video!"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tips Panel */}
      <div className="max-w-7xl mx-auto p-4 mt-6 mb-12">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Tips for Better Video Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground mb-1">🎬 Be Specific</div>
              <p>Describe camera movements, subject actions, and scene details clearly.</p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">⏱️ Duration</div>
              <p>Shorter videos (2-5s) generate faster. Longer videos need more time.</p>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">🎯 Self-Hosted</div>
              <p>
                SVD XT 1.1 (Self-Hosted) is free and unlimited. Cloud models cost per video.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
