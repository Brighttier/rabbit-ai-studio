'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface GPUServerStatus {
  status: string;
  externalIP: string;
  internalIP: string;
  services: {
    ollama: boolean;
    automatic1111: boolean;
    comfyui: boolean;
  };
  instance: string;
  zone: string;
}

interface GPUServerControlProps {
  token: string;
}

export function GPUServerControl({ token }: GPUServerControlProps) {
  const [status, setStatus] = useState<GPUServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [token]);

  async function fetchStatus() {
    try {
      setError(null);
      const response = await fetch('/api/admin/gpu-server', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch server status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch server status');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'start' | 'stop') {
    if (!confirm(`Are you sure you want to ${action} the GPU server?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch('/api/admin/gpu-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        // Wait a bit for the instance to start/stop
        await new Promise(resolve => setTimeout(resolve, action === 'start' ? 10000 : 3000));
        await fetchStatus();
      } else {
        setError(data.error?.message || `Failed to ${action} server`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} server`);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="text-lg font-semibold mb-2">GPU Server Control</h3>
        <div className="text-muted-foreground">Loading server status...</div>
      </div>
    );
  }

  const isRunning = status?.status === 'RUNNING';
  const isTerminated = status?.status === 'TERMINATED';

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">GPU Server Control</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStatus}
          disabled={loading || actionLoading}
        >
          🔄 Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {status && (
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
            <div>
              <div className="font-medium">
                Status: <span className={isRunning ? 'text-green-500' : 'text-gray-500'}>{status.status}</span>
              </div>
              <div className="text-sm text-muted-foreground">{status.instance} • {status.zone}</div>
            </div>
          </div>

          {/* IP Addresses */}
          {isRunning && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">External IP</div>
                <div className="font-mono">{status.externalIP}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Internal IP</div>
                <div className="font-mono">{status.internalIP}</div>
              </div>
            </div>
          )}

          {/* Services Status */}
          {isRunning && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">AI Services</div>
              <div className="grid grid-cols-3 gap-2">
                <ServiceBadge name="Ollama" status={status.services.ollama} />
                <ServiceBadge name="Auto1111" status={status.services.automatic1111} />
                <ServiceBadge name="ComfyUI" status={status.services.comfyui} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isTerminated && (
              <Button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? 'Starting...' : '▶️ Start Server'}
              </Button>
            )}
            {isRunning && (
              <Button
                variant="destructive"
                onClick={() => handleAction('stop')}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? 'Stopping...' : '⏹️ Stop Server'}
              </Button>
            )}
          </div>

          {/* Warning */}
          <div className="text-xs text-muted-foreground">
            ⚠️ This is a preemptible instance. It may be automatically stopped by Google Cloud.
            Starting the server may take 30-60 seconds for services to become ready.
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceBadge({ name, status }: { name: string; status: boolean }) {
  return (
    <div className={`px-2 py-1 rounded text-xs text-center ${status ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
      {status ? '✓' : '✗'} {name}
    </div>
  );
}
