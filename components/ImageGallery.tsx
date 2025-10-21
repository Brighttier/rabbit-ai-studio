'use client';

import { useState } from 'react';
import { ImageCard, GeneratedImage } from './ImageCard';
import { Button } from './ui/button';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onDownload?: (image: GeneratedImage) => void;
  onDelete?: (imageId: string) => void;
  onUsePrompt?: (prompt: string) => void;
  onClearAll?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

type SortOption = 'newest' | 'oldest' | 'resolution';
type ViewMode = 'grid' | 'list';

export function ImageGallery({
  images,
  onDownload,
  onDelete,
  onUsePrompt,
  onClearAll,
  isLoading = false,
  emptyMessage = 'No images generated yet',
}: ImageGalleryProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter images by search query
  const filteredImages = images.filter((image) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      image.prompt.toLowerCase().includes(query) ||
      image.modelName?.toLowerCase().includes(query) ||
      image.stylePreset?.toLowerCase().includes(query)
    );
  });

  // Sort images
  const sortedImages = [...filteredImages].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'oldest':
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      case 'resolution':
        return b.width * b.height - a.width * a.height;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      {images.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="flex-1 w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by prompt, model, or style..."
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2 items-center">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="resolution">Highest Resolution</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-input rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-accent'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm transition-colors border-l border-input ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-accent'
                }`}
              >
                List
              </button>
            </div>

            {/* Clear All Button */}
            {onClearAll && images.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      {images.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {filteredImages.length === images.length ? (
            <>Showing {images.length} {images.length === 1 ? 'image' : 'images'}</>
          ) : (
            <>
              Showing {filteredImages.length} of {images.length}{' '}
              {images.length === 1 ? 'image' : 'images'}
            </>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-4xl mb-2 animate-spin">⏳</div>
            <div className="text-muted-foreground">Generating images...</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && images.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🎨</div>
            <div className="text-xl font-semibold text-foreground mb-2">
              {emptyMessage}
            </div>
            <p className="text-muted-foreground">
              Enter a prompt and click generate to create your first image
            </p>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && images.length > 0 && filteredImages.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-lg font-semibold text-foreground mb-2">
              No images found
            </div>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        </div>
      )}

      {/* Image Grid/List */}
      {!isLoading && filteredImages.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-4'
          }
        >
          {sortedImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onDownload={onDownload}
              onDelete={onDelete}
              onUsePrompt={onUsePrompt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
