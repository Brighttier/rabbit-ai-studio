'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Server, CheckCircle, Loader2 } from 'lucide-react';

interface GPUServerStatus {
  status: string;
  externalIP: string;
  services: {
    ollama: boolean;
    automatic1111: boolean;
    comfyui: boolean;
  };
}

interface GPUServerStatusBannerProps {
  token?: string;
  userRole?: string;
  compact?: boolean; // For use in page headers
}

export function GPUServerStatusBanner({ token, userRole, compact = false }: GPUServerStatusBannerProps) {
  const [status, setStatus] = useState<GPUServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [token]);

  async function fetchStatus() {
    if (!token) return;

    try {
      const response = await fetch('/api/admin/gpu-server', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to fetch server status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch server status');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartServer() {
    if (!token || !isAdmin) return;

    try {
      setStarting(true);
      const response = await fetch('/api/admin/gpu-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'start' }),
      });

      const data = await response.json();

      if (data.success) {
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 10000));
        await fetchStatus();
      } else {
        alert(`Failed to start server: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to start server: ${err.message}`);
    } finally {
      setStarting(false);
    }
  }

  // Don't show anything if not authenticated
  if (!token) {
    return null;
  }

  // Loading state
  if (loading) {
    if (compact) {
      return (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking server...</span>
        </div>
      );
    }
    return null; // Don't show full banner while loading
  }

  // Error state (API failed)
  if (error) {
    if (compact) {
      return (
        <div className="inline-flex items-center gap-2 text-sm text-yellow-500">
          <AlertTriangle className="h-4 w-4" />
          <span>Status unavailable</span>
        </div>
      );
    }
    return null;
  }

  if (!status) return null;

  const isRunning = status.status === 'RUNNING';
  const allServicesReady = isRunning && status.services.ollama && status.services.automatic1111 && status.services.comfyui;
  const someServicesDown = isRunning && (!status.services.ollama || !status.services.automatic1111 || !status.services.comfyui);

  // Compact mode (for page headers)
  if (compact) {
    if (allServicesReady) {
      return (
        <div className="inline-flex items-center gap-2 text-sm text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span>Server Online</span>
        </div>
      );
    }

    if (someServicesDown || starting) {
      return (
        <div className="inline-flex items-center gap-2 text-sm text-yellow-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Starting...</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>Server Offline</span>
      </div>
    );
  }

  // Full banner mode

  // Server is running and all services are ready - show minimal success banner
  if (allServicesReady) {
    return (
      <div className="w-full max-w-5xl bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="text-sm">
              <span className="font-medium text-green-500">GPU Server Online</span>
              <span className="text-muted-foreground ml-2">• All AI services are ready</span>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/admin/models'}
              className="text-xs"
            >
              Manage
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Server is starting or some services are down
  if (someServicesDown || starting) {
    return (
      <div className="w-full max-w-5xl bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-yellow-500 mt-0.5 animate-spin" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-500">GPU Server Starting...</h3>
            <p className="text-sm text-yellow-500/80 mt-1">
              AI services are initializing. This usually takes 30-60 seconds. You can start using the platform once all services are ready.
            </p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className={status.services.ollama ? 'text-green-500' : 'text-muted-foreground'}>
                {status.services.ollama ? '✓' : '○'} Ollama
              </span>
              <span className={status.services.automatic1111 ? 'text-green-500' : 'text-muted-foreground'}>
                {status.services.automatic1111 ? '✓' : '○'} Automatic1111
              </span>
              <span className={status.services.comfyui ? 'text-green-500' : 'text-muted-foreground'}>
                {status.services.comfyui ? '✓' : '○'} ComfyUI
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Server is TERMINATED - show prominent alert
  return (
    <div className="w-full max-w-5xl bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-destructive text-lg">GPU Server is Offline</h3>
          <p className="text-sm text-destructive/80 mt-1">
            The AI generation server is currently stopped. All text, image, and video generation features are unavailable.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            💡 This is a preemptible instance that Google Cloud automatically stops for cost savings.
            {isAdmin ? ' You can start it instantly from here or the admin panel.' : ' Contact an administrator to start the server.'}
          </p>

          <div className="flex gap-3 mt-4">
            {isAdmin && (
              <Button
                onClick={handleStartServer}
                disabled={starting}
                size="sm"
                className="bg-destructive hover:bg-destructive/90"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Server...
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4 mr-2" />
                    Start Server Now
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/admin/models'}
            >
              {isAdmin ? 'Go to Admin Panel' : 'View Server Status'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
