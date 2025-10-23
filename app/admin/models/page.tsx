'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Model } from '@/lib/types';
import { ModelRegistry } from '@/components/ModelRegistry';
import { ModelDialog } from '@/components/ModelDialog';
import { GPUServerControl } from '@/components/GPUServerControl';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminModelsPage() {
  const { user, token, userRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/signin');
      return;
    }

    if (user && !loading && userRole !== 'admin') {
      router.push('/');
      return;
    }

    setLoading(false);
  }, [user, userRole, loading, router]);

  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [testingModel, setTestingModel] = useState<Model | null>(null);

  function handleEdit(model: Model) {
    setEditingModel(model);
  }

  async function handleTest(model: Model) {
    if (!token) return;

    setTestingModel(model);

    try {
      const response = await fetch(`/api/models/${model.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: 'Hello! Please respond with a brief greeting.',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data.testResult;
        if (result.error) {
          alert(`❌ Test Failed\n\nModel: ${model.displayName}\nError: ${result.error}`);
        } else {
          if (result.type === 'text') {
            alert(`✅ Test Successful!\n\nModel: ${model.displayName}\nResponse: ${result.content}\n\nTokens Used: ${result.usage?.totalTokens || 'N/A'}`);
          } else if (result.type === 'image') {
            alert(`✅ Test Successful!\n\nModel: ${model.displayName}\nGenerated ${result.images?.length || 0} image(s)`);
          } else if (result.type === 'video') {
            alert(`✅ Test Successful!\n\nModel: ${model.displayName}\nVideo URL: ${result.videoUrl}`);
          }
        }
      } else {
        alert(`❌ Test Failed\n\nModel: ${model.displayName}\nError: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`❌ Test Failed\n\nModel: ${model.displayName}\nError: ${error.message}`);
    } finally {
      setTestingModel(null);
    }
  }

  function handleCreateNew() {
    setShowCreateDialog(true);
  }

  async function handleSaveModel(modelData: Partial<Model>) {
    if (!token) return;

    const isEdit = !!editingModel;
    const url = isEdit ? `/api/models/${editingModel.id}` : '/api/models';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(modelData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to save model');
    }

    // Refresh the page to reload models
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-destructive">Authentication required</div>
        <Button onClick={() => window.location.href = '/'}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage AI models and configurations
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="border-b border-yellow-500/20 bg-yellow-500/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-sm">
              <p className="font-semibold text-yellow-500">Admin Access</p>
              <p className="text-muted-foreground">
                You have full access to create, edit, and delete AI models. Changes affect all users.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* GPU Server Control */}
        <div className="mb-8">
          <GPUServerControl token={token!} />
        </div>

        {/* Model Registry */}
        <ModelRegistry
          onEdit={handleEdit}
          onTest={handleTest}
          onCreateNew={handleCreateNew}
        />
      </div>

      {/* Model Dialogs */}
      {(showCreateDialog || editingModel) && (
        <ModelDialog
          model={editingModel}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingModel(null);
          }}
          onSave={handleSaveModel}
        />
      )}

      {/* Footer */}
      <div className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-sm text-muted-foreground text-center">
            <p>Rabbit AI Studio - Admin Dashboard</p>
            <p className="mt-1">Phase 3: Model Registry System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
