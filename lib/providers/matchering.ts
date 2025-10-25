/**
 * Matchering Provider
 * Provides access to Matchering audio mastering service
 * https://github.com/sergree/matchering
 */

import { BaseProvider, ProviderError } from './base';
import { AudioMasteringRequest, AudioMasteringResponse, AudioFile } from '../types';

export class MatcheringProvider extends BaseProvider {
  name = 'matchering';
  type = 'audio' as const;
  private baseURL: string;

  constructor() {
    const baseURL = process.env.MATCHERING_BASE_URL || process.env.NEXT_PUBLIC_MATCHERING_BASE_URL || 'http://localhost:8080';
    super({ apiUrl: baseURL, timeout: 120000 }); // 2 minute timeout for mastering
    this.baseURL = baseURL;
  }

  /**
   * Master audio using Matchering
   */
  async masterAudio(request: AudioMasteringRequest): Promise<AudioMasteringResponse> {
    const {
      targetFile,
      referenceFile,
      outputFormat = 'wav',
    } = request;

    try {
      // Prepare form data
      const formData = new FormData();

      // Add target file
      if (targetFile instanceof File) {
        formData.append('target', targetFile);
      } else {
        throw new ProviderError(
          'Only File objects are supported for target audio',
          this.name,
          400
        );
      }

      // Add reference file
      if (referenceFile instanceof File) {
        formData.append('reference', referenceFile);
      } else {
        throw new ProviderError(
          'Only File objects are supported for reference audio',
          this.name,
          400
        );
      }

      // Add output format
      formData.append('output_format', outputFormat);

      // Make request to Matchering service
      const response = await this.fetchWithRetry(`${this.baseURL}/api/master`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderError(
          `Matchering API error: ${response.status} - ${errorText}`,
          this.name,
          response.status
        );
      }

      const data = await response.json();

      // Transform response to match our interface
      const masteredFile: AudioFile = {
        name: data.mastered.filename,
        url: `${this.baseURL}${data.download_url}`,
        format: data.mastered.format,
        size: data.mastered.size,
      };

      return {
        success: true,
        jobId: data.job_id,
        mastered: masteredFile,
        downloadUrl: `${this.baseURL}${data.download_url}`,
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Matchering request failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Health check for Matchering service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Matchering health check failed:', error);
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
