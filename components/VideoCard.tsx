import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, Clock, Film, Settings } from 'lucide-react';
import { GeneratedVideo } from '@/lib/videos';

export interface VideoCardProps {
  video: GeneratedVideo;
  onDownload?: (video: GeneratedVideo) => void;
  onDelete?: (videoId: string) => void;
}

export function VideoCard({ video, onDownload, onDelete }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const createdAt = video.createdAt instanceof Date 
    ? video.createdAt 
    : new Date(video.createdAt);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Video Player */}
        <div className="relative bg-black aspect-[9/16]">
          <video
            src={video.videoUrl}
            controls
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      </CardContent>

      <CardHeader className="p-4">
        {/* Prompt */}
        <p className="text-sm text-foreground line-clamp-2 mb-2">
          {video.prompt}
        </p>

        {/* Video Details */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Clock size={14} />
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </TooltipTrigger>
              <TooltipContent>
                {createdAt.toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Film size={14} />
                {video.duration}s • {video.fps}fps
              </TooltipTrigger>
              <TooltipContent>
                Resolution: {video.resolution}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Settings size={14} />
                {video.modelName || 'Unknown model'}
              </TooltipTrigger>
              <TooltipContent>
                Model ID: {video.modelId}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {onDownload && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onDownload(video)}
          >
            <Download size={16} className="mr-1" />
            Download
          </Button>
        )}

        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(video.id)}
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}