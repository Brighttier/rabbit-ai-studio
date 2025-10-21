'use client';

import { Model } from '@/lib/types';
import {
  getProviderDisplayName,
  getProviderColor,
  getTypeIcon,
  getTypeDisplayName,
  formatContextWindow,
  formatPricing,
  getModelCapabilities,
} from '@/lib/models';
import { Button } from '@/components/ui/button';

interface ModelCardProps {
  model: Model;
  onEdit?: (model: Model) => void;
  onDelete?: (model: Model) => void;
  onToggle?: (model: Model, enabled: boolean) => void;
  onTest?: (model: Model) => void;
  isAdmin?: boolean;
}

export function ModelCard({
  model,
  onEdit,
  onDelete,
  onToggle,
  onTest,
  isAdmin = false,
}: ModelCardProps) {
  const capabilities = getModelCapabilities(model);
  const providerColor = getProviderColor(model.provider);

  return (
    <div className="relative group rounded-lg border border-border bg-card p-6 hover:bg-accent/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getTypeIcon(model.type)}</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {model.displayName}
            </h3>
            <p className="text-sm text-muted-foreground">{model.name}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              model.enabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {model.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Description */}
      {model.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {model.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Provider Badge */}
        <span className={`px-2 py-1 text-xs font-medium rounded ${providerColor} text-white`}>
          {getProviderDisplayName(model.provider)}
        </span>

        {/* Type Badge */}
        <span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary">
          {getTypeDisplayName(model.type)}
        </span>

        {/* Capabilities */}
        {capabilities.slice(0, 2).map((capability) => (
          <span
            key={capability}
            className="px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground"
          >
            {capability}
          </span>
        ))}

        {capabilities.length > 2 && (
          <span className="px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground">
            +{capabilities.length - 2} more
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {model.metadata?.contextWindow && (
          <div>
            <span className="text-muted-foreground">Context:</span>
            <span className="ml-2 text-foreground">
              {formatContextWindow(model.metadata.contextWindow)}
            </span>
          </div>
        )}

        {model.metadata?.pricing && (
          <div>
            <span className="text-muted-foreground">Pricing:</span>
            <span className="ml-2 text-foreground">
              {formatPricing(model.metadata.pricing)}
            </span>
          </div>
        )}

        {model.config?.temperature !== undefined && (
          <div>
            <span className="text-muted-foreground">Temperature:</span>
            <span className="ml-2 text-foreground">{model.config.temperature}</span>
          </div>
        )}

        {model.config?.maxTokens && (
          <div>
            <span className="text-muted-foreground">Max Tokens:</span>
            <span className="ml-2 text-foreground">{model.config.maxTokens}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        {/* Test Button (Everyone) */}
        {onTest && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTest(model)}
            disabled={!model.enabled}
          >
            Test
          </Button>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <>
            {/* Toggle Button */}
            {onToggle && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggle(model, !model.enabled)}
              >
                {model.enabled ? 'Disable' : 'Enable'}
              </Button>
            )}

            {/* Edit Button */}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(model)}>
                Edit
              </Button>
            )}

            {/* Delete Button */}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(model)}
              >
                Delete
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
