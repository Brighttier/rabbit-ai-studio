'use client';

import { useState, useEffect } from 'react';
import { Model, ModelType, ModelProvider } from '@/lib/types';
import { Button } from './ui/button';

interface ModelDialogProps {
  model?: Model | null; // If provided, edit mode; otherwise, create mode
  onClose: () => void;
  onSave: (model: Partial<Model>) => Promise<void>;
}

export function ModelDialog({ model, onClose, onSave }: ModelDialogProps) {
  const isEditMode = !!model;

  const [formData, setFormData] = useState({
    name: model?.name || '',
    displayName: model?.displayName || '',
    description: model?.description || '',
    provider: (model?.provider || 'ollama') as ModelProvider,
    type: (model?.type || 'text') as ModelType,
    endpointURL: model?.endpointURL || '',
    enabled: model?.enabled ?? true,
    // Config
    temperature: model?.config?.temperature || 0.7,
    maxTokens: model?.config?.maxTokens || 2048,
    defaultSystemPrompt: model?.config?.defaultSystemPrompt || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.name || !formData.displayName || !formData.endpointURL) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const modelData: Partial<Model> = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        provider: formData.provider,
        type: formData.type,
        endpointURL: formData.endpointURL,
        enabled: formData.enabled,
        config: {
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          defaultSystemPrompt: formData.defaultSystemPrompt || undefined,
        },
      };

      await onSave(modelData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save model');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditMode ? 'Edit Model' : 'Add New Model'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Model Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., dolphin-mixtral:8x7b"
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Internal model identifier (used in API calls)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Display Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                placeholder="e.g., Dolphin Mixtral 8x7B"
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the model..."
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>
          </div>

          {/* Provider & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Provider <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.provider}
                onChange={(e) => handleChange('provider', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
                required
              >
                <option value="ollama">Ollama</option>
                <option value="automatic1111">Automatic1111</option>
                <option value="comfyui">ComfyUI</option>
                <option value="huggingface">Hugging Face</option>
                <option value="openrouter">OpenRouter</option>
                <option value="replicate">Replicate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Type <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
                required
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="multimodal">Multimodal</option>
              </select>
            </div>
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Endpoint URL <span className="text-destructive">*</span>
            </label>
            <input
              type="url"
              value={formData.endpointURL}
              onChange={(e) => handleChange('endpointURL', e.target.value)}
              placeholder="e.g., http://34.127.26.165:11434"
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Base URL for the model provider API
            </p>
          </div>

          {/* Configuration (for text models) */}
          {formData.type === 'text' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Model Configuration</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Temperature</label>
                  <input
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                    min="1"
                    max="8192"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Default System Prompt</label>
                <textarea
                  value={formData.defaultSystemPrompt}
                  onChange={(e) => handleChange('defaultSystemPrompt', e.target.value)}
                  placeholder="You are a helpful AI assistant..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
            </div>
          )}

          {/* Enabled Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="enabled" className="text-sm font-medium">
              Enable model (users can see and use this model)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : (isEditMode ? 'Update Model' : 'Create Model')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
