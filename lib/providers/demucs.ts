/**
 * Demucs Provider
 * Provides access to Demucs stem separation service
 * https://github.com/adefossez/demucs
 */

import { BaseProvider, ProviderError } from './base';
import { AudioSeparationRequest, AudioSeparationResponse, AudioFile } from '../types';

export class DemucsProvider extends BaseProvider {
  name = 'demucs';
  type = 'audio' as const;
  private baseURL: string;

  constructor() {
    const baseURL = process.env.DEMUCS_BASE_URL || process.env.NEXT_PUBLIC_DEMUCS_BASE_URL || 'http://localhost:8080';
    super({ apiUrl: baseURL, timeout: 300000 }); // 5 minute timeout for audio processing
    this.baseURL = baseURL;
  }

  /**
   * Separate audio into stems using Demucs
   */
  async separateAudio(request: AudioSeparationRequest): Promise<AudioSeparationResponse> {
    const {
      audioFile,
      modelId,
      stems,
      outputFormat = 'wav',
    } = request;

    try {
      // Prepare form data
      const formData = new FormData();

      // Add audio file
      if (audioFile instanceof File) {
        formData.append('file', audioFile);
      } else {
        // If it's a URL or base64, we need to fetch it first
        throw new ProviderError(
          'Only File objects are supported for audio separation',
          this.name,
          400
        );
      }

      // Add parameters
      formData.append('model', modelId || 'htdemucs');
      if (stems && stems.length > 0) {
        formData.append('stems', stems.join(','));
      }
      formData.append('output_format', outputFormat);

      // Make request to Demucs service
      const response = await this.fetchWithRetry(`${this.baseURL}/api/separate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(
          `Demucs API error: ${response.status} - ${errorText}`,
          this.name,
          response.status
        );
      }

      const data = await response.json();

      // Transform response to match our interface
      const stemFiles: AudioFile[] = data.stems.map((stem: any) => ({
        name: stem.name,
        url: `${this.baseURL}${data.download_base}/${stem.filename}`,
        format: stem.format,
        size: stem.size,
      }));

      return {
        success: true,
        jobId: data.job_id,
        model: data.model,
        stems: stemFiles,
        downloadBase: `${this.baseURL}${data.download_base}`,
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Demucs request failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * List available Demucs models
   */
  async listModels(): Promise<any[]> {
    try {
      const response = await this.fetchWithRetry(`${this.baseURL}/api/models`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new ProviderError(
          'Failed to list Demucs models',
          this.name,
          response.status
        );
      }

      const data = await response.json();
      return data.models || [];
    } catch (error: any) {
      throw new ProviderError(
        `Failed to list models: ${error.message}`,
        this.name,
        500
      );
    }
  }

  /**
   * Health check for Demucs service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Demucs health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup job files on the server
   */
  async cleanupJob(jobId: string): Promise<void> {
    try {
      await this.fetchWithRetry(`${this.baseURL}/api/cleanup/${jobId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn(`Failed to cleanup job ${jobId}:`, error);
      // Don't throw - cleanup is best-effort
    }
  }
}
