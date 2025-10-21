'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth';

interface SystemStats {
  totalUsers: number;
  totalSessions: number;
  totalImages: number;
  totalMessages: number;
  activeModels: number;
  apiHealth: {
    text: boolean;
    image: boolean;
    models: boolean;
  };
}

interface UsageStats {
  textGenerations: number;
  imageGenerations: number;
  totalTokens: number;
  averageResponseTime: number;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  async function loadDashboardData() {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to load dashboard data');
      }

      setSystemStats(data.data.systemStats);
      setUsageStats(data.data.usageStats);
    } catch (err: any) {
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  const seedModels = async () => {
    if (!token) return;
    
    setSeeding(true);
    setSeedError(null);

    try {
      const response = await fetch('/api/admin/seed-models', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to seed models');
      }

      alert('Models seeded successfully!');
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Link href="/admin/models">
            <Button>Manage Models</Button>
          </Link>
          <Button 
            onClick={seedModels} 
            disabled={seeding}
            variant="secondary"
          >
            {seeding ? 'Seeding Models...' : 'Seed Models'}
          </Button>
        </div>
      </div>

      {seedError && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error seeding models: {seedError}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-2 animate-spin">⏳</div>
              <div className="text-muted-foreground">Loading dashboard...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && !error && systemStats && usageStats && (
          <div className="space-y-6">
            {/* System Status Cards */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">👥</div>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {systemStats.totalUsers}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Users</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">💬</div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {systemStats.totalSessions}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Chat Sessions</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">🎨</div>
                    <span className="text-xs text-muted-foreground">Generated</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {systemStats.totalImages}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Images</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">🤖</div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {systemStats.activeModels}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">AI Models</div>
                </div>
              </div>
            </div>

            {/* API Health Status */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">API Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xl">💬</div>
                      <div>
                        <div className="font-medium text-foreground">Text Generation</div>
                        <div className="text-xs text-muted-foreground">/api/generate-text</div>
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        systemStats.apiHealth.text ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xl">🎨</div>
                      <div>
                        <div className="font-medium text-foreground">Image Generation</div>
                        <div className="text-xs text-muted-foreground">/api/generate-image</div>
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        systemStats.apiHealth.image ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xl">🤖</div>
                      <div>
                        <div className="font-medium text-foreground">Model Registry</div>
                        <div className="text-xs text-muted-foreground">/api/models</div>
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        systemStats.apiHealth.models ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Usage Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="text-sm text-muted-foreground mb-1">Text Generations</div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatNumber(usageStats.textGenerations)}
                  </div>
                  <div className="text-xs text-green-500 mt-2">+12% from last week</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="text-sm text-muted-foreground mb-1">Image Generations</div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatNumber(usageStats.imageGenerations)}
                  </div>
                  <div className="text-xs text-green-500 mt-2">+8% from last week</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Tokens</div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatNumber(usageStats.totalTokens)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Across all sessions</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="text-sm text-muted-foreground mb-1">Avg Response Time</div>
                  <div className="text-2xl font-bold text-foreground">
                    {usageStats.averageResponseTime}s
                  </div>
                  <div className="text-xs text-green-500 mt-2">-0.3s from last week</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/admin/models">
                  <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer">
                    <div className="text-3xl mb-2">🤖</div>
                    <div className="font-medium text-foreground mb-1">Manage Models</div>
                    <div className="text-sm text-muted-foreground">
                      Add, edit, or remove AI models
                    </div>
                  </div>
                </Link>

                <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer opacity-50">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-medium text-foreground mb-1">User Management</div>
                  <div className="text-sm text-muted-foreground">Coming soon in Phase 6</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer opacity-50">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-medium text-foreground mb-1">Analytics</div>
                  <div className="text-sm text-muted-foreground">Coming soon in Phase 6</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer opacity-50">
                  <div className="text-3xl mb-2">⚙️</div>
                  <div className="font-medium text-foreground mb-1">System Settings</div>
                  <div className="text-sm text-muted-foreground">Coming soon in Phase 6</div>
                </div>
              </div>
            </div>

            {/* Recent Activity section removed until we implement activity tracking */}
          </div>
        )}
      </div>
    </div>
  );
}
