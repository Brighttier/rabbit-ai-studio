'use client';

import { useState } from 'react';
import { Button } from './ui/button';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  modelName?: string;
  timestamp: Date;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
  stylePreset?: string;
}

interface ImageCardProps {
  image: GeneratedImage;
  onDownload?: (image: GeneratedImage) => void;
  onDelete?: (imageId: string) => void;
  onUsePrompt?: (prompt: string) => void;
  showActions?: boolean;
}

export function ImageCard({
  image,
  onDownload,
  onDelete,
  onUsePrompt,
  showActions = true,
}: ImageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  function handleDownload() {
    if (onDownload) {
      onDownload(image);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `generated-${image.id}.png`;
      link.click();
    }
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(image.prompt);
  }

  function handleUsePrompt() {
    if (onUsePrompt) {
      onUsePrompt(image.prompt);
    }
  }

  function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Display */}
      <div className="relative aspect-square bg-muted">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-destructive text-center p-4">
              <div className="text-4xl mb-2">⚠️</div>
              <div className="text-sm">Failed to load image</div>
            </div>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.prompt}
            className={`w-full h-full object-cover transition-opacity ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Quick Actions Overlay */}
        {showActions && imageLoaded && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-background/80 backdrop-blur-sm"
            >
              ⬇️
            </Button>
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="p-4 space-y-3">
        {/* Prompt */}
        <div>
          <p className="text-sm text-foreground line-clamp-2">
            {image.prompt}
          </p>
          {image.prompt.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Expanded Prompt */}
        {isExpanded && (
          <div className="text-sm text-foreground whitespace-pre-wrap border-t border-border pt-2">
            {image.prompt}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded-md bg-muted">
            {image.width}×{image.height}
          </span>
          {image.modelName && (
            <span className="px-2 py-1 rounded-md bg-muted">
              {image.modelName}
            </span>
          )}
          {image.stylePreset && (
            <span className="px-2 py-1 rounded-md bg-muted">
              {image.stylePreset}
            </span>
          )}
          <span className="px-2 py-1 rounded-md bg-muted">
            {formatDate(image.timestamp)}
          </span>
        </div>

        {/* Advanced Info (Expandable) */}
        {isExpanded && (
          <div className="border-t border-border pt-2 space-y-1 text-xs text-muted-foreground">
            {image.steps && (
              <div className="flex justify-between">
                <span>Steps:</span>
                <span>{image.steps}</span>
              </div>
            )}
            {image.guidanceScale && (
              <div className="flex justify-between">
                <span>Guidance Scale:</span>
                <span>{image.guidanceScale}</span>
              </div>
            )}
            {image.seed !== undefined && (
              <div className="flex justify-between">
                <span>Seed:</span>
                <span>{image.seed}</span>
              </div>
            )}
            {image.negativePrompt && (
              <div className="pt-1">
                <div className="font-medium mb-1">Negative Prompt:</div>
                <div className="text-destructive/80">{image.negativePrompt}</div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1"
            >
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="flex-1"
            >
              Copy Prompt
            </Button>
            {onUsePrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUsePrompt}
                className="flex-1"
              >
                Reuse
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(image.id)}
                className="text-destructive hover:text-destructive"
              >
                🗑️
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
