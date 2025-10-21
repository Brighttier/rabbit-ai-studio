'use client';

import { useState } from 'react';
import { Model } from '@/lib/types';
import { ModelSelectorWithDetails } from './ModelSelector';
import { Button } from './ui/button';

export interface ChatConfig {
  modelId: string;
  model?: Model;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
}

interface ChatSettingsProps {
  config: ChatConfig;
  onChange: (config: ChatConfig) => void;
  token?: string;
  disabled?: boolean;
}

export function ChatSettings({
  config,
  onChange,
  token,
  disabled = false,
}: ChatSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleModelChange(modelId: string, model: Model) {
    onChange({
      ...config,
      modelId,
      model,
      // Update defaults from model config
      temperature: model.config?.temperature ?? config.temperature,
      maxTokens: model.config?.maxTokens ?? config.maxTokens,
      systemPrompt: model.config?.defaultSystemPrompt ?? config.systemPrompt,
    });
  }

  function handleSystemPromptChange(value: string) {
    onChange({ ...config, systemPrompt: value });
  }

  function handleTemperatureChange(value: number) {
    onChange({ ...config, temperature: value });
  }

  function handleMaxTokensChange(value: number) {
    onChange({ ...config, maxTokens: value });
  }

  function handleStreamChange(value: boolean) {
    onChange({ ...config, stream: value });
  }

  function resetToDefaults() {
    if (config.model) {
      onChange({
        ...config,
        temperature: config.model.config?.temperature ?? 0.7,
        maxTokens: config.model.config?.maxTokens ?? 2048,
        systemPrompt: config.model.config?.defaultSystemPrompt ?? '',
      });
    }
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Model Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            AI Model
          </label>
          <ModelSelectorWithDetails
            value={config.modelId}
            onChange={handleModelChange}
            type="text"
            disabled={disabled}
            showDetails={true}
          />
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
          <div className="space-y-4 pt-2">
            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                System Prompt
                <span className="text-xs text-muted-foreground ml-2">
                  (Optional - Sets the assistant's behavior)
                </span>
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => handleSystemPromptChange(e.target.value)}
                placeholder="You are a helpful AI assistant..."
                disabled={disabled}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
              />
            </div>

            {/* Temperature Slider */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Temperature: {config.temperature.toFixed(2)}
                <span className="text-xs text-muted-foreground ml-2">
                  (Lower = more focused, Higher = more creative)
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Precise (0.0)</span>
                <span>Balanced (1.0)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>

            {/* Max Tokens Slider */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Tokens: {config.maxTokens}
                <span className="text-xs text-muted-foreground ml-2">
                  (~{Math.round(config.maxTokens * 0.75)} words)
                </span>
              </label>
              <input
                type="range"
                min="128"
                max="8192"
                step="128"
                value={config.maxTokens}
                onChange={(e) => handleMaxTokensChange(parseInt(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Short (128)</span>
                <span>Medium (2048)</span>
                <span>Long (8192)</span>
              </div>
            </div>

            {/* Streaming Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Streaming Response
                </label>
                <p className="text-xs text-muted-foreground">
                  Show response as it's being generated
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.stream}
                  onChange={(e) => handleStreamChange(e.target.checked)}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors">
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
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
      </div>
    </div>
  );
}
