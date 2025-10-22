'use client';

import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import {
  MessageCircle,
  ImageIcon,
  Film,
  Zap,
  Lock,
  Server,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Rabbit AI Studio
          </h1>
          <p className="text-xl text-muted-foreground">
            Multi-Model AI Platform for Text, Image & Video Generation
          </p>
        </div>

        {/* Warning Banner */}
        <div className="w-full max-w-2xl bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-12">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-500">Internal Use Only</h3>
              <p className="text-sm text-yellow-500/80">
                This platform is for internal use. All generated content and models are unrestricted and uncensored.
                Use responsibly.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Grid - Show only when authenticated */}
        {!loading && user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12">
            <Link href="/chat" className="block group">
              <Card className="p-6 h-full transition-colors hover:border-primary">
                <div className="space-y-2">
                  <MessageCircle className="h-10 w-10 text-blue-500" />
                  <h3 className="text-xl font-semibold">Text Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with unrestricted AI models. Multiple models available for different use cases.
                  </p>
                </div>
              </Card>
            </Link>

            <Link href="/image" className="block group">
              <Card className="p-6 h-full transition-colors hover:border-primary">
                <div className="space-y-2">
                  <ImageIcon className="h-10 w-10 text-purple-500" />
                  <h3 className="text-xl font-semibold">Image Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Create images with multiple AI models. Stable Diffusion and more.
                  </p>
                </div>
              </Card>
            </Link>

            <Link href="/video" className="block group">
              <Card className="p-6 h-full transition-colors hover:border-primary">
                <div className="space-y-2">
                  <Film className="h-10 w-10 text-green-500" />
                  <h3 className="text-xl font-semibold">Video Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate short videos using Stable Video Diffusion. Self-hosted for unlimited use.
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="flex gap-3">
            <Zap className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Fast Generation</h4>
              <p className="text-sm text-muted-foreground">
                Optimized for speed with self-hosted models and efficient routing.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Lock className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Secure Access</h4>
              <p className="text-sm text-muted-foreground">
                Firebase authentication and role-based access control.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Server className="h-6 w-6 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Self-Hosted</h4>
              <p className="text-sm text-muted-foreground">
                Host your own models for unlimited, cost-effective generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
