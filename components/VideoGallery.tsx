import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SortDesc, LayoutGrid, Trash2 } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { GeneratedVideo } from '@/lib/videos';

export interface VideoGalleryProps {
  videos: GeneratedVideo[];
  onDownload?: (video: GeneratedVideo) => void;
  onDelete?: (videoId: string) => void;
  onClearAll?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function VideoGallery({
  videos,
  onDownload,
  onDelete,
  onClearAll,
  isLoading,
  emptyMessage = 'No videos yet'
}: VideoGalleryProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Filter videos by search term
  const filteredVideos = videos.filter(video => 
    video.prompt.toLowerCase().includes(search.toLowerCase())
  );

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return sortBy === 'newest' 
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });

  return (
    <div>
      {/* Gallery Header */}
      {videos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(value: 'newest' | 'oldest') => setSortBy(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SortDesc size={16} className="mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear All */}
          {onClearAll && (
            <Button variant="outline" size="icon" onClick={onClearAll}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      )}

      {/* Gallery Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted aspect-[9/16] rounded-lg mb-2" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : sortedVideos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? 'No videos match your search' : emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {sortedVideos.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {sortedVideos.length} {sortedVideos.length === 1 ? 'video' : 'videos'}
          {search && ` matching "${search}"`}
        </div>
      )}
    </div>
  );
}