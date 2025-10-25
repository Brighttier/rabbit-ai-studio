/**
 * FxNorm-automix Provider
 * Automatic music mixing with effects normalization
 * Sony Research - https://github.com/sony/FxNorm-automix
 */

import { BaseProvider } from './base';

export interface AutoMixRequest {
  // Stem files (can be File objects or URLs from previous separation job)
  vocals: File | string;
  drums: File | string;
  bass: File | string;
  other: File | string;

  // Or provide job_id from previous separation
  job_id?: string;

  // Output format
  outputFormat?: 'wav' | 'mp3' | 'flac';

  // Model selection (optional)
  model?: 'ours_S_La' | 'ours_S_Lb' | 'ours_S_pretrained' | 'wun_S_Lb';
}

export interface AutoMixResponse {
  success: boolean;
  job_id: string;
  mixedFile: {
    filename: string;
    path: string;
    url: string;
    format: string;
    size: number;
  };
  metadata?: {
    processingTime: number;
    model: string;
  };
}

export class FxNormProvider extends BaseProvider {
  name = 'fxnorm';
  type = 'audio' as const;
  private baseURL: string;

  constructor() {
    super({});
    this.baseURL = process.env.NEXT_PUBLIC_FXNORM_BASE_URL ||
                   process.env.DEMUCS_BASE_URL ||
                   'http://34.83.248.1:8080';
  }

  /**
   * Auto-mix stems using FxNorm-automix
   */
  async autoMix(request: AutoMixRequest): Promise<AutoMixResponse> {
    const formData = new FormData();

    // If job_id provided, use stems from previous separation
    if (request.job_id) {
      formData.append('job_id', request.job_id);
    } else {
      // Add individual stem files
      if (request.vocals instanceof File) {
        formData.append('vocals', request.vocals);
      } else {
        formData.append('vocals_url', request.vocals);
      }

      if (request.drums instanceof File) {
        formData.append('drums', request.drums);
      } else {
        formData.append('drums_url', request.drums);
      }

      if (request.bass instanceof File) {
        formData.append('bass', request.bass);
      } else {
        formData.append('bass_url', request.bass);
      }

      if (request.other instanceof File) {
        formData.append('other', request.other);
      } else {
        formData.append('other_url', request.other);
      }
    }

    // Add optional parameters
    if (request.outputFormat) {
      formData.append('output_format', request.outputFormat);
    }

    if (request.model) {
      formData.append('model', request.model);
    }

    try {
      const response = await fetch(`${this.baseURL}/api/automix`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`FxNorm API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FxNorm automix error:', error);
      throw error;
    }
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);

      if (!response.ok) {
        return { available: false, message: 'Service unavailable' };
      }

      const data = await response.json();

      return {
        available: data.services?.fxnorm === 'available',
        message: data.status,
      };
    } catch (error) {
      return {
        available: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Get available models
   */
  async listModels(): Promise<string[]> {
    return [
      'ours_S_La',
      'ours_S_Lb',
      'ours_S_pretrained',
      'wun_S_Lb',
    ];
  }

  /**
   * Clean up job files
   */
  async cleanupJob(jobId: string): Promise<void> {
    try {
      await fetch(`${this.baseURL}/api/cleanup/${jobId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Singleton instance
export const fxnormProvider = new FxNormProvider();
