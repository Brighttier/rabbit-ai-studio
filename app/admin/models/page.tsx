'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Model } from '@/lib/types';
import { ModelRegistry } from '@/components/ModelRegistry';
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

  function handleEdit(model: Model) {
    // TODO: Open edit modal/form
    console.log('Edit model:', model);
    alert(`Edit functionality coming soon!\n\nModel: ${model.displayName}`);
  }

  function handleTest(model: Model) {
    // TODO: Open test interface
    console.log('Test model:', model);
    alert(`Test functionality coming soon!\n\nModel: ${model.displayName}\nType: ${model.type}`);
  }

  function handleCreateNew() {
    // TODO: Open create form
    alert('Create new model functionality coming soon!');
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
        <ModelRegistry
          onEdit={handleEdit}
          onTest={handleTest}
          onCreateNew={handleCreateNew}
        />
      </div>

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
