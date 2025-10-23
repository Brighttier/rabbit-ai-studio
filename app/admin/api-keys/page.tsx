'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ApiKey } from '@/lib/types';

export default function AdminApiKeysPage() {
  const { user, token, userRole } = useAuth();
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create API key form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(0); // 0 = never expires
  const [creating, setCreating] = useState(false);

  // Newly created key (shown only once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (userRole !== 'admin') {
      router.push('/');
      return;
    }
    loadApiKeys();
  }, [user, userRole, router]);

  async function loadApiKeys() {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setApiKeys(data.data);
      } else {
        setError(data.error?.message || 'Failed to load API keys');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !keyName.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: keyName.trim(),
          expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show the raw key (ONLY TIME IT'S SHOWN!)
        setNewlyCreatedKey(data.data.rawKey);
        setShowKeyModal(true);
        setShowCreateForm(false);
        setKeyName('');
        setExpiresInDays(0);
        await loadApiKeys();
      } else {
        alert(`Failed to create API key: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to create API key: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteApiKey(keyId: string, keyName: string) {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete API key "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys?id=${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await loadApiKeys();
      } else {
        alert(`Failed to delete API key: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to delete API key: ${err.message}`);
    }
  }

  async function handleToggleApiKey(keyId: string, currentlyEnabled: boolean) {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/api-keys?id=${keyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !currentlyEnabled }),
      });

      const data = await response.json();

      if (data.success) {
        await loadApiKeys();
      } else {
        alert(`Failed to toggle API key: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to toggle API key: ${err.message}`);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  function formatDate(date: Date | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">API Keys</h1>
            <p className="text-sm text-muted-foreground">
              Manage API keys for external applications
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
              Users
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/models')}>
              Models
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-destructive font-medium">Error: {error}</p>
          </div>
        )}

        {/* Create API Key Button */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {apiKeys.length} API key{apiKeys.length !== 1 ? 's' : ''} total
          </p>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : '+ Create New API Key'}
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6 rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Create New API Key</h2>
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., My Mobile App, Production Server"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  required
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Descriptive name to identify this API key
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Expires in (days)
                </label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0 = Never expires"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 = Never expires, 30 = 30 days, 365 = 1 year
                </p>
              </div>

              <Button type="submit" disabled={creating || !keyName.trim()}>
                {creating ? 'Creating...' : 'Create API Key'}
              </Button>
            </form>
          </div>
        )}

        {/* Newly Created Key Modal */}
        {showKeyModal && newlyCreatedKey && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full m-4">
              <h2 className="text-xl font-bold text-foreground mb-4">
                ⚠️ API Key Created Successfully
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Important:</strong> This is the only time you'll see this key. Copy it now and store it securely!
              </p>
              <div className="bg-background border border-border rounded-md p-4 mb-4 break-all font-mono text-sm">
                {newlyCreatedKey}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  className="flex-1"
                >
                  📋 Copy to Clipboard
                </Button>
                <Button
                  onClick={() => {
                    setShowKeyModal(false);
                    setNewlyCreatedKey(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  I've Saved It
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Key Preview
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Last Used
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No API keys yet. Create one to get started!
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {key.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                      {key.prefix}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {key.enabled ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(key.lastUsedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(key.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(key.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleApiKey(key.id, key.enabled)}
                      >
                        {key.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteApiKey(key.id, key.name)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Panel */}
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Using API Keys
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Authentication:</strong> Include the API key in the Authorization header:
            </p>
            <pre className="bg-background border border-border rounded-md p-3 overflow-x-auto">
              Authorization: Bearer rabbit_sk_your_api_key_here
            </pre>
            <p>
              <strong className="text-foreground">Example:</strong> Generate text with cURL:
            </p>
            <pre className="bg-background border border-border rounded-md p-3 overflow-x-auto">
{`curl -X POST https://rabbit.brighttier.com/api/generate-text \\
  -H "Authorization: Bearer rabbit_sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Hello AI", "modelId": "llama3-8b"}'`}
            </pre>
            <p>
              <strong className="text-foreground">Documentation:</strong> See API_DOCUMENTATION.md for complete examples in Python, JavaScript, and PHP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
