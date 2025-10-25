'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth';
import { StemSeparation } from '@/components/StemSeparation';
import { AudioMastering } from '@/components/AudioMastering';
import AutoMix from '@/components/AutoMix';
import { AudioGallery } from '@/components/AudioGallery';
import { AudioComparison } from '@/components/AudioComparison';
import { GPUServerStatusBanner } from '@/components/GPUServerStatusBanner';
import {
  loadAudioHistory,
  saveAudioHistory,
  addSeparationToHistory,
  addMasteringToHistory,
  removeFromHistory,
  clearAudioHistory,
  loadAudioConfig,
  saveAudioConfig,
  AudioHistory,
} from '@/lib/audio';
import { ProcessedAudio, AudioFile, AudioSeparationResponse, AudioMasteringResponse } from '@/lib/types';

type Tab = 'separation' | 'mastering' | 'automix';

export default function AudioPage() {
  const { user, token, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('separation');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<AudioHistory>({ separations: [], masterings: [] });
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('htdemucs');

  // Latest processed audio for comparison
  const [latestSeparation, setLatestSeparation] = useState<{
    original: AudioFile;
    stems: AudioFile[];
  } | null>(null);

  const [latestMastering, setLatestMastering] = useState<{
    original: AudioFile;
    mastered: AudioFile;
  } | null>(null);

  // Initialize
  useEffect(() => {
    // Load history from local storage
    const savedHistory = loadAudioHistory();
    if (savedHistory) {
      setHistory(savedHistory);
    }

    // Load saved config
    const savedConfig = loadAudioConfig();
    if (savedConfig?.separationModelId) {
      setSelectedModelId(savedConfig.separationModelId);
    }

    // Fetch available models (would normally come from /api/models?type=audio)
    // For now, use default Demucs model
    setModels([
      {
        id: 'htdemucs',
        name: 'htdemucs',
        displayName: 'Hybrid Transformer Demucs',
        description: 'Best quality model (recommended)',
      },
    ]);
  }, []);

  // Save config when model changes
  useEffect(() => {
    if (selectedModelId) {
      saveAudioConfig({ separationModelId: selectedModelId });
    }
  }, [selectedModelId]);

  // Handle successful separation
  const handleSeparationSuccess = (response: AudioSeparationResponse, originalFile: string) => {
    // Create processed audio entry
    const processedAudio: ProcessedAudio = {
      id: response.jobId,
      type: 'separation',
      originalFile,
      outputFiles: response.stems,
      timestamp: new Date(),
      metadata: {
        model: response.model,
        stems: response.stems.map(s => s.name as any),
      },
    };

    // Add to history
    addSeparationToHistory(processedAudio);

    // Update local state
    setHistory((prev) => ({
      ...prev,
      separations: [processedAudio, ...prev.separations],
    }));

    // Set for comparison (use first stem as "original" placeholder)
    setLatestSeparation({
      original: response.stems[0], // Would ideally be the original file
      stems: response.stems,
    });

    // Show success message
    setSuccessMessage(`Successfully separated ${response.stems.length} stems!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle successful mastering
  const handleMasteringSuccess = (
    response: AudioMasteringResponse,
    targetFile: string,
    referenceFile: string
  ) => {
    // Create processed audio entry
    const processedAudio: ProcessedAudio = {
      id: response.jobId,
      type: 'mastering',
      originalFile: targetFile,
      outputFiles: [response.mastered],
      timestamp: new Date(),
      metadata: {
        targetFile,
        referenceFile,
      },
    };

    // Add to history
    addMasteringToHistory(processedAudio);

    // Update local state
    setHistory((prev) => ({
      ...prev,
      masterings: [processedAudio, ...prev.masterings],
    }));

    // Set for comparison (would need to keep original file)
    setLatestMastering({
      original: response.mastered, // Placeholder - would ideally be the original target
      mastered: response.mastered,
    });

    // Show success message
    setSuccessMessage('Audio mastered successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle error
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  // Handle delete
  const handleDelete = (id: string, type: 'separation' | 'mastering') => {
    if (confirm('Are you sure you want to delete this item?')) {
      removeFromHistory(id, type);

      setHistory((prev) => ({
        separations: type === 'separation'
          ? prev.separations.filter(item => item.id !== id)
          : prev.separations,
        masterings: type === 'mastering'
          ? prev.masterings.filter(item => item.id !== id)
          : prev.masterings,
      }));
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearAudioHistory();
      setHistory({ separations: [], masterings: [] });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to use audio processing features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Audio Processing</h1>
            <p className="text-sm text-muted-foreground">
              Stem separation with Demucs and mastering with Matchering
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/chat')}>
              Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/image')}>
              Images
            </Button>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/video')}>
              Videos
            </Button>
            {userRole === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => (window.location.href = '/admin/models')}>
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/')}>
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Server Status Indicator */}
      {token && (
        <div className="border-b border-border bg-card px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <GPUServerStatusBanner token={token} userRole={userRole || undefined} compact={true} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Processing Forms */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="rounded-lg border border-border bg-card p-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setActiveTab('separation')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                      activeTab === 'separation'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Separation
                  </button>
                  <button
                    onClick={() => setActiveTab('mastering')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                      activeTab === 'mastering'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Mastering
                  </button>
                  <button
                    onClick={() => setActiveTab('automix')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                      activeTab === 'automix'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Auto-Mix
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'separation' && token && (
                  <StemSeparation
                    modelId={selectedModelId}
                    models={models}
                    onSuccess={handleSeparationSuccess}
                    onError={handleError}
                    token={token}
                  />
                )}

                {activeTab === 'mastering' && token && (
                  <AudioMastering
                    onSuccess={handleMasteringSuccess}
                    onError={handleError}
                    token={token}
                  />
                )}

                {activeTab === 'automix' && token && (
                  <AutoMix />
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Latest Comparison */}
              {activeTab === 'separation' && latestSeparation && latestSeparation.stems.length > 1 && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Latest Separation</h3>
                  <div className="space-y-3">
                    {latestSeparation.stems.map((stem, idx) => (
                      <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-2 capitalize">{stem.name}</div>
                        <audio controls className="w-full">
                          <source src={stem.url} type={`audio/${stem.format}`} />
                        </audio>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'mastering' && latestMastering && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <AudioComparison
                    audioA={latestMastering.original}
                    audioB={latestMastering.mastered}
                    labelA="Original"
                    labelB="Mastered"
                  />
                </div>
              )}

              {/* History */}
              <div className="rounded-lg border border-border bg-card p-6">
                <AudioGallery
                  items={activeTab === 'separation' ? history.separations : history.masterings}
                  onDelete={(id) => handleDelete(id, activeTab)}
                  onClearAll={handleClearAll}
                  emptyMessage={
                    activeTab === 'separation'
                      ? 'No stem separations yet'
                      : 'No mastered audio yet'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Panel */}
      <div className="max-w-7xl mx-auto p-4 mt-6 mb-12">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            {activeTab === 'separation' ? 'Stem Separation Tips' : 'Audio Mastering Tips'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            {activeTab === 'separation' ? (
              <>
                <div>
                  <div className="font-medium text-foreground mb-1">🎵 Best Quality</div>
                  <p>Use WAV or FLAC source files for best separation results</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">⏱️ Processing Time</div>
                  <p>Separation takes ~1.5× the duration of your audio (GPU accelerated)</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">🎸 Stems</div>
                  <p>Extract vocals, drums, bass, and other instruments separately</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="font-medium text-foreground mb-1">🎯 Reference Track</div>
                  <p>Choose a professionally mastered track in a similar genre</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">⚡ Fast Processing</div>
                  <p>Mastering typically completes in 10-30 seconds</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">🔊 Output</div>
                  <p>Your track will match the sonic characteristics of the reference</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
