'use client';

import { useState, useEffect } from 'react';
import { Model, ModelType } from '@/lib/types';
import { fetchModels, getTypeIcon, getProviderDisplayName } from '@/lib/models';
import { useAuth } from '@/lib/firebase/auth';

interface ModelSelectorProps {
  value?: string;
  onChange: (modelId: string, model: Model) => void;
  type?: ModelType;
  placeholder?: string;
  disabled?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  type,
  placeholder = 'Select a model...',
  disabled = false,
}: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    loadModels();
  }, [type, token]);

  async function loadModels() {
    try {
      setLoading(true);
      setError(null);

      const params: any = { enabled: true };
      if (type) params.type = type;
      if (token) params.token = token;

      const data = await fetchModels(params);
      setModels(data);

      // Auto-select first model if no value and models available
      if (!value && data.length > 0) {
        onChange(data[0].id, data[0]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const modelId = e.target.value;
    const model = models.find(m => m.id === modelId);

    if (model) {
      onChange(modelId, model);
    }
  }

  if (loading) {
    return (
      <select disabled className="w-full px-4 py-2 rounded-md border border-input bg-background text-muted-foreground">
        <option>Loading models...</option>
      </select>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Error loading models: {error}
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No enabled models available. Please contact an administrator.
      </div>
    );
  }

  return (
    <select
      value={value || models[0]?.id}
      onChange={handleChange}
      disabled={disabled}
      className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {!value && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}

      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {getTypeIcon(model.type)} {model.displayName} ({getProviderDisplayName(model.provider)})
        </option>
      ))}
    </select>
  );
}

/**
 * Model Selector with details
 */
interface ModelSelectorWithDetailsProps extends ModelSelectorProps {
  showDetails?: boolean;
}

export function ModelSelectorWithDetails({
  showDetails = true,
  ...props
}: ModelSelectorWithDetailsProps) {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  function handleChange(modelId: string, model: Model) {
    setSelectedModel(model);
    props.onChange(modelId, model);
  }

  return (
    <div className="space-y-3">
      <ModelSelector {...props} onChange={handleChange} />

      {showDetails && selectedModel && (
        <div className="p-4 rounded-lg border border-border bg-card text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground">Provider:</span>
              <span className="ml-2 text-foreground">
                {getProviderDisplayName(selectedModel.provider)}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 text-foreground capitalize">
                {selectedModel.type}
              </span>
            </div>

            {selectedModel.config?.temperature !== undefined && (
              <div>
                <span className="text-muted-foreground">Temperature:</span>
                <span className="ml-2 text-foreground">
                  {selectedModel.config.temperature}
                </span>
              </div>
            )}

            {selectedModel.config?.maxTokens && (
              <div>
                <span className="text-muted-foreground">Max Tokens:</span>
                <span className="ml-2 text-foreground">
                  {selectedModel.config.maxTokens}
                </span>
              </div>
            )}
          </div>

          {selectedModel.description && (
            <p className="mt-3 text-muted-foreground text-xs">
              {selectedModel.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
