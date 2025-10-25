'use client';

import { ProcessedAudio } from '@/lib/types';
import { AudioPlayer } from './AudioPlayer';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { downloadAllStems, formatFileSize } from '@/lib/audio';

interface AudioGalleryProps {
  items: ProcessedAudio[];
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  emptyMessage?: string;
}

export function AudioGallery({
  items,
  onDelete,
  onClearAll,
  emptyMessage = 'No processed audio yet',
}: AudioGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-2">{emptyMessage}</div>
        <div className="text-sm text-muted-foreground">
          Upload and process audio files to see them here
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {items[0].type === 'separation' ? 'Stem Separations' : 'Mastered Audio'}
        </h3>
        {onClearAll && items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Gallery Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-border rounded-lg p-4 bg-card"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {item.originalFile}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.timestamp.toLocaleString()}
                  {item.metadata?.model && ` • Model: ${item.metadata.model}`}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {item.type === 'separation' && item.outputFiles.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAllStems(item.outputFiles, item.id)}
                    title="Download all stems"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    All ({item.outputFiles.length})
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Metadata */}
            {item.metadata && (
              <div className="mb-3 text-sm text-muted-foreground">
                {item.type === 'separation' && item.metadata.stems && (
                  <span>Stems: {item.metadata.stems.join(', ')}</span>
                )}
                {item.type === 'mastering' && item.metadata.referenceFile && (
                  <span>Reference: {item.metadata.referenceFile}</span>
                )}
              </div>
            )}

            {/* Audio Files */}
            <div className="space-y-3">
              {item.outputFiles.map((audioFile, index) => (
                <div key={index}>
                  {item.type === 'separation' && item.outputFiles.length > 1 && (
                    <div className="text-sm font-medium mb-1 capitalize">
                      {audioFile.name}
                    </div>
                  )}
                  <AudioPlayer
                    audioFile={audioFile}
                    showDownload={true}
                    showWaveform={false}
                    compact={true}
                  />
                </div>
              ))}
            </div>

            {/* Total Size */}
            <div className="mt-3 text-sm text-muted-foreground text-right">
              Total size: {formatFileSize(
                item.outputFiles.reduce((sum, file) => sum + file.size, 0)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
