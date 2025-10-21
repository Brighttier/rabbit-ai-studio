'use client';

import { useState, useEffect } from 'react';
import { Model, ModelType, ModelProvider } from '@/lib/types';
import {
  fetchModels,
  deleteModel,
  toggleModelEnabled,
  filterModels,
  sortModels,
  groupModelsByProvider,
  groupModelsByType,
} from '@/lib/models';
import { ModelCard } from './ModelCard';
import { Button } from './ui/button';

interface ModelRegistryProps {
  onEdit?: (model: Model) => void;
  onTest?: (model: Model) => void;
  onCreateNew?: () => void;
}

type ViewMode = 'grid' | 'list';
type GroupBy = 'none' | 'provider' | 'type';

import { useAuth } from '@/lib/firebase/auth';

export function ModelRegistry({
  onEdit,
  onTest,
  onCreateNew,
}: ModelRegistryProps) {
  const { token, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ModelType | 'all'>('all');
  const [providerFilter, setProviderFilter] = useState<ModelProvider | 'all'>('all');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  // View options
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [sortBy, setSortBy] = useState<'name' | 'provider' | 'type' | 'createdAt'>('name');

  // Load models
  useEffect(() => {
    loadModels();
  }, [token]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [models, searchQuery, typeFilter, providerFilter, enabledFilter, sortBy]);

  async function loadModels() {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchModels({ token: token || undefined });
      setModels(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...models];

    // Search filter
    if (searchQuery) {
      filtered = filterModels(filtered, searchQuery);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(m => m.provider === providerFilter);
    }

    // Enabled filter
    if (enabledFilter !== 'all') {
      filtered = filtered.filter(m =>
        enabledFilter === 'enabled' ? m.enabled : !m.enabled
      );
    }

    // Sort
    filtered = sortModels(filtered, sortBy);

    setFilteredModels(filtered);
  }

  async function handleToggle(model: Model, enabled: boolean) {
    try {
      await toggleModelEnabled(model.id, enabled, token || '');
      await loadModels();
    } catch (err: any) {
      alert(`Failed to toggle model: ${err.message}`);
    }
  }

  async function handleDelete(model: Model) {
    if (!confirm(`Are you sure you want to delete "${model.displayName}"?`)) {
      return;
    }

    try {
      await deleteModel(model.id, token || '');
      await loadModels();
    } catch (err: any) {
      alert(`Failed to delete model: ${err.message}`);
    }
  }

  function renderModels() {
    if (groupBy === 'none') {
      return (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredModels.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              onEdit={isAdmin ? onEdit : undefined}
              onDelete={isAdmin ? handleDelete : undefined}
              onToggle={isAdmin ? handleToggle : undefined}
              onTest={onTest}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      );
    }

    if (groupBy === 'provider') {
      const grouped = groupModelsByProvider(filteredModels);
      return (
        <div className="space-y-8">
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <div key={provider}>
              <h3 className="text-xl font-semibold mb-4 text-foreground capitalize">
                {provider}
              </h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {providerModels.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onEdit={isAdmin ? onEdit : undefined}
                    onDelete={isAdmin ? handleDelete : undefined}
                    onToggle={isAdmin ? handleToggle : undefined}
                    onTest={onTest}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (groupBy === 'type') {
      const grouped = groupModelsByType(filteredModels);
      return (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, typeModels]) => (
            <div key={type}>
              <h3 className="text-xl font-semibold mb-4 text-foreground capitalize">
                {type} Models
              </h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {typeModels.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onEdit={isAdmin ? onEdit : undefined}
                    onDelete={isAdmin ? handleDelete : undefined}
                    onToggle={isAdmin ? handleToggle : undefined}
                    onTest={onTest}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading models...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-destructive">Error: {error}</div>
        <Button onClick={loadModels} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Model Registry</h2>
          <p className="text-sm text-muted-foreground">
            {filteredModels.length} of {models.length} models
          </p>
        </div>

        {isAdmin && onCreateNew && (
          <Button onClick={onCreateNew}>
            Add New Model
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-card">
        {/* Search */}
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Filter Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="multimodal">Multimodal</option>
          </select>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value as any)}
            className="px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Providers</option>
            <option value="lmstudio">LM Studio</option>
            <option value="huggingface">Hugging Face</option>
            <option value="openrouter">OpenRouter</option>
            <option value="ollama">Ollama</option>
            <option value="vertexai">Vertex AI</option>
            <option value="custom">Custom</option>
          </select>

          {/* Status Filter */}
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value as any)}
            className="px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="name">Sort by Name</option>
            <option value="provider">Sort by Provider</option>
            <option value="type">Sort by Type</option>
            <option value="createdAt">Sort by Date</option>
          </select>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={groupBy === 'none' ? 'default' : 'outline'}
              onClick={() => setGroupBy('none')}
            >
              No Grouping
            </Button>
            <Button
              size="sm"
              variant={groupBy === 'provider' ? 'default' : 'outline'}
              onClick={() => setGroupBy('provider')}
            >
              By Provider
            </Button>
            <Button
              size="sm"
              variant={groupBy === 'type' ? 'default' : 'outline'}
              onClick={() => setGroupBy('type')}
            >
              By Type
            </Button>
          </div>
        </div>
      </div>

      {/* Models Display */}
      {filteredModels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No models found. Try adjusting your filters.
        </div>
      ) : (
        renderModels()
      )}
    </div>
  );
}
