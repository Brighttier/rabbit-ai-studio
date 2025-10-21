'use client';

import { useState } from 'react';
import { Model } from '@/lib/types';
import { ModelSelectorWithDetails } from './ModelSelector';
import { Button } from './ui/button';

export interface ImageConfig {
  modelId: string;
  model?: Model;
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  seed?: number;
  numImages: number;
  stylePreset?: string;
}

const STYLE_PRESETS = [
  { value: 'none', label: 'None', description: 'No style preset' },
  { value: 'photographic', label: 'Photographic', description: 'Realistic photography style' },
  { value: 'digital-art', label: 'Digital Art', description: 'Digital illustration style' },
  { value: 'anime', label: 'Anime', description: 'Anime and manga style' },
  { value: 'fantasy-art', label: 'Fantasy Art', description: 'Fantasy and magical style' },
  { value: '3d-model', label: '3D Model', description: '3D rendered style' },
  { value: 'comic-book', label: 'Comic Book', description: 'Comic book illustration' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-like composition' },
  { value: 'abstract', label: 'Abstract', description: 'Abstract art style' },
];

const RESOLUTION_PRESETS = [
  { width: 512, height: 512, label: '512×512', description: 'Square (fast)' },
  { width: 768, height: 768, label: '768×768', description: 'Square HD' },
  { width: 1024, height: 1024, label: '1024×1024', description: 'Square Full HD' },
  { width: 512, height: 768, label: '512×768', description: 'Portrait' },
  { width: 768, height: 512, label: '768×512', description: 'Landscape' },
  { width: 1024, height: 768, label: '1024×768', description: 'Landscape HD' },
  { width: 768, height: 1024, label: '768×1024', description: 'Portrait HD' },
];

interface ImageGenerationFormProps {
  config: ImageConfig;
  onChange: (config: ImageConfig) => void;
  onGenerate: () => void;
  token?: string;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function ImageGenerationForm({
  config,
  onChange,
  onGenerate,
  token,
  disabled = false,
  isGenerating = false,
}: ImageGenerationFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleModelChange(modelId: string, model: Model) {
    onChange({
      ...config,
      modelId,
      model,
      // Update defaults from model config if available
      steps: model.config?.steps ?? config.steps,
      guidanceScale: model.config?.guidanceScale ?? config.guidanceScale,
    });
  }

  function handlePromptChange(value: string) {
    onChange({ ...config, prompt: value });
  }

  function handleNegativePromptChange(value: string) {
    onChange({ ...config, negativePrompt: value });
  }

  function handleResolutionPreset(width: number, height: number) {
    onChange({ ...config, width, height });
  }

  function handleStylePreset(value: string) {
    onChange({ ...config, stylePreset: value === 'none' ? undefined : value });
  }

  function handleStepsChange(value: number) {
    onChange({ ...config, steps: value });
  }

  function handleGuidanceScaleChange(value: number) {
    onChange({ ...config, guidanceScale: value });
  }

  function handleNumImagesChange(value: number) {
    onChange({ ...config, numImages: value });
  }

  function handleRandomSeed() {
    onChange({ ...config, seed: Math.floor(Math.random() * 1000000) });
  }

  function handleClearSeed() {
    onChange({ ...config, seed: undefined });
  }

  function resetToDefaults() {
    if (config.model) {
      onChange({
        ...config,
        steps: config.model.config?.steps ?? 20,
        guidanceScale: config.model.config?.guidanceScale ?? 7.5,
        width: 512,
        height: 512,
        numImages: 1,
        negativePrompt: '',
        stylePreset: undefined,
        seed: undefined,
      });
    }
  }

  const isValid = config.prompt?.trim().length > 0 && config.modelId;

  return (
    <div className="space-y-6">
      {/* Model Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          AI Model
        </label>
        <ModelSelectorWithDetails
            value={config.modelId}
            onChange={handleModelChange}
            type="image"
            disabled={disabled}
            showDetails={true}
          />
      </div>

      {/* Main Prompt */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Image Description
          <span className="text-xs text-muted-foreground ml-2">
            (Describe the image you want to generate)
          </span>
        </label>
        <textarea
          value={config.prompt || ''}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="A serene landscape with mountains and a lake at sunset, highly detailed, 4k..."
          disabled={disabled}
          rows={4}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {(config.prompt || '').length} / 1000 characters
          </p>
          {(config.prompt || '').length > 900 && (
            <p className="text-xs text-yellow-500">
              Approaching character limit
            </p>
          )}
        </div>
      </div>

      {/* Style Presets */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Style Preset
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleStylePreset(preset.value)}
              disabled={disabled}
              className={`px-3 py-2 rounded-md border text-sm transition-colors disabled:opacity-50 ${
                (config.stylePreset === preset.value || (!config.stylePreset && preset.value === 'none'))
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-accent'
              }`}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Presets */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Resolution
        </label>
        <div className="grid grid-cols-4 gap-2">
          {RESOLUTION_PRESETS.map((preset) => (
            <button
              key={`${preset.width}x${preset.height}`}
              onClick={() => handleResolutionPreset(preset.width, preset.height)}
              disabled={disabled}
              className={`px-3 py-2 rounded-md border text-sm transition-colors disabled:opacity-50 ${
                config.width === preset.width && config.height === preset.height
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-accent'
              }`}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Current: {config.width}×{config.height} pixels
        </p>
      </div>

      {/* Number of Images */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Number of Images: {config.numImages}
        </label>
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={config.numImages}
          onChange={(e) => handleNumImagesChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1 image</span>
          <span>2 images</span>
          <span>3 images</span>
          <span>4 images</span>
        </div>
      </div>

      {/* Toggle Advanced Settings */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full"
      >
        {isExpanded ? '▼' : '▶'} Advanced Settings
      </Button>

      {/* Advanced Settings */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Negative Prompt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Negative Prompt
              <span className="text-xs text-muted-foreground ml-2">
                (Optional - What to avoid in the image)
              </span>
            </label>
            <textarea
              value={config.negativePrompt}
              onChange={(e) => handleNegativePromptChange(e.target.value)}
              placeholder="blurry, low quality, distorted, ugly..."
              disabled={disabled}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
            />
          </div>

          {/* Steps Slider */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Inference Steps: {config.steps}
              <span className="text-xs text-muted-foreground ml-2">
                (More steps = higher quality, slower)
              </span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={config.steps}
              onChange={(e) => handleStepsChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Fast (10)</span>
              <span>Balanced (50)</span>
              <span>High Quality (100)</span>
            </div>
          </div>

          {/* Guidance Scale Slider */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Guidance Scale: {config.guidanceScale.toFixed(1)}
              <span className="text-xs text-muted-foreground ml-2">
                (How strictly to follow the prompt)
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={config.guidanceScale}
              onChange={(e) => handleGuidanceScaleChange(parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Creative (1.0)</span>
              <span>Balanced (7.5)</span>
              <span>Strict (20.0)</span>
            </div>
          </div>

          {/* Seed Control */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Random Seed
              <span className="text-xs text-muted-foreground ml-2">
                (Optional - For reproducible results)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={config.seed ?? ''}
                onChange={(e) => onChange({ ...config, seed: parseInt(e.target.value) || undefined })}
                placeholder="Random"
                disabled={disabled}
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomSeed}
                disabled={disabled}
              >
                Random
              </Button>
              {config.seed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSeed}
                  disabled={disabled}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            disabled={disabled}
            className="w-full"
          >
            Reset to Model Defaults
          </Button>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={disabled || !isValid || isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Generating...
          </>
        ) : (
          <>
            🎨 Generate {config.numImages > 1 ? `${config.numImages} Images` : 'Image'}
          </>
        )}
      </Button>

      {!config.modelId && (
        <p className="text-sm text-yellow-500 text-center">
          Please select a model first
        </p>
      )}

      {!(config.prompt || '').trim() && config.modelId && (
        <p className="text-sm text-yellow-500 text-center">
          Please enter an image description
        </p>
      )}
    </div>
  );
}
