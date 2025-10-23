/**
 * ComfyUI Provider
 * Provides access to self-hosted ComfyUI for video generation
 * https://github.com/comfyanonymous/ComfyUI
 */

import { BaseProvider, ProviderError } from './base';
import { VideoGenerationRequest, VideoGenerationResponse } from '../types';

export class ComfyUIProvider extends BaseProvider {
  name = 'comfyui';
  type = 'video' as const;
  private baseURL: string;

  constructor() {
    const baseURL = process.env.COMFYUI_BASE_URL || 'http://localhost:8188';
    super({ apiUrl: baseURL, timeout: 600000 }); // 10 min timeout for video generation
    this.baseURL = baseURL;
  }

  /**
   * Generate video using ComfyUI's API
   * Two-step process:
   * 1. Generate image from prompt using Automatic1111
   * 2. Animate that image using SVD in ComfyUI
   */
  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const {
      prompt,
      inputImage,
      duration = 5,
      fps = 24,
      resolution = '720p',
      seed,
    } = request;

    try {
      let imageToAnimate = inputImage;

      let uploadedImageName: string | undefined;

      // Step 1: If no input image provided, generate one from the prompt
      if (!imageToAnimate && prompt) {
        console.log('Generating image from prompt:', prompt);
        imageToAnimate = await this.generateImageFromPrompt(prompt, resolution, seed);
      }

      // Step 2: If we have an image (generated or uploaded), upload it to ComfyUI
      if (imageToAnimate) {
        console.log('Uploading image to ComfyUI...');
        uploadedImageName = await this.uploadImageToComfyUI(imageToAnimate);
      }

      // Step 3: Create workflow with the uploaded image name (or empty frame if no image)
      const workflow = this.createVideoWorkflow({
        prompt,
        uploadedImageName,
        duration,
        fps,
        resolution,
        seed: seed || Math.floor(Math.random() * 1000000),
      });

      // Queue the prompt
      const queueResponse = await this.fetchWithRetry(`${this.baseURL}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: workflow }),
      });

      if (!queueResponse.ok) {
        const errorText = await queueResponse.text();
        throw new ProviderError(
          `ComfyUI API error: ${queueResponse.status} - ${errorText}`,
          this.name,
          queueResponse.status
        );
      }

      const queueData = await queueResponse.json();
      const promptId = queueData.prompt_id;

      // Poll for completion
      const videoUrl = await this.pollForCompletion(promptId);

      return {
        videoUrl,
        modelId: request.modelId,
        metadata: {
          duration,
          fps,
          resolution,
          seed: seed || 0,
        },
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `ComfyUI request failed: ${error.message}`,
        this.name,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Upload base64 image to ComfyUI server
   * Returns the filename that can be used in LoadImage node
   */
  private async uploadImageToComfyUI(base64Image: string): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const filename = `svd_input_${Date.now()}.png`;

      // Create form data using node's FormData (server-side only)
      const {default: FormDataNode} = await import('form-data');
      const formData = new FormDataNode();

      formData.append('image', imageBuffer, {
        filename: filename,
        contentType: 'image/png',
      });
      formData.append('subfolder', 'svd_inputs');
      formData.append('type', 'input');

      // Upload to ComfyUI
      const response = await fetch(`${this.baseURL}/upload/image`, {
        method: 'POST',
        // @ts-ignore - form-data is compatible with fetch
        body: formData,
        headers: formData.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();

      // Return the uploaded filename
      return data.name || filename;
    } catch (error: any) {
      console.error('Failed to upload image to ComfyUI:', error);
      throw new ProviderError(
        `Failed to upload image: ${error.message}`,
        this.name,
        500
      );
    }
  }

  /**
   * Generate an image from text prompt using Automatic1111
   * This image will be used as the starting frame for SVD
   */
  private async generateImageFromPrompt(
    prompt: string,
    resolution: string,
    seed?: number
  ): Promise<string> {
    const automatic1111URL = process.env.AUTOMATIC1111_BASE_URL || 'http://localhost:7860';
    const { width, height } = this.parseResolution(resolution);

    try {
      const response = await fetch(`${automatic1111URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted',
          steps: 20,
          cfg_scale: 7.0,
          width: width,
          height: height,
          seed: seed || -1,
          sampler_name: 'DPM++ 2M Karras',
        }),
      });

      if (!response.ok) {
        throw new Error(`Automatic1111 API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.images || data.images.length === 0) {
        throw new Error('No images generated');
      }

      // Return base64 image
      return `data:image/png;base64,${data.images[0]}`;
    } catch (error: any) {
      console.error('Failed to generate image from prompt:', error);
      throw new ProviderError(
        `Failed to generate initial image: ${error.message}`,
        this.name,
        500
      );
    }
  }

  /**
   * Create SVD (Stable Video Diffusion) workflow
   * This workflow animates an uploaded image or creates an empty frame
   */
  private createVideoWorkflow(params: {
    prompt: string;
    uploadedImageName?: string;
    duration: number;
    fps: number;
    resolution: string;
    seed: number;
  }): any {
    const { width, height } = this.parseResolution(params.resolution);
    // Limit frames for better performance: 14-25 frames (SVD XT 1.1 works best with these)
    const videoFrames = Math.min(25, Math.max(14, Math.floor(params.duration * (params.fps / 2))));

    if (params.uploadedImageName) {
      // Use uploaded image workflow
      return {
        // 1. Load SVD checkpoint
        '1': {
          inputs: {
            ckpt_name: 'svd_xt_1_1.safetensors',
          },
          class_type: 'ImageOnlyCheckpointLoader',
        },
        // 2. Load uploaded image
        '2': {
          inputs: {
            image: params.uploadedImageName,
          },
          class_type: 'LoadImage',
        },
        // 3. SVD conditioning
        '3': {
          inputs: {
            clip_vision: ['1', 1],
            init_image: ['2', 0],
            vae: ['1', 2],
            width: width,
            height: height,
            video_frames: videoFrames,
            motion_bucket_id: 127,
            fps: 6,
            augmentation_level: 0.0,
          },
          class_type: 'SVD_img2vid_Conditioning',
        },
        // 4. Sample video latents
        '4': {
          inputs: {
            seed: params.seed,
            steps: 20,
            cfg: 2.5,
            sampler_name: 'euler',
            scheduler: 'karras',
            denoise: 1.0,
            model: ['1', 0],
            positive: ['3', 0],
            negative: ['3', 1],
            latent_image: ['3', 2],
          },
          class_type: 'KSampler',
        },
        // 5. Decode latents to images
        '5': {
          inputs: {
            samples: ['4', 0],
            vae: ['1', 2],
          },
          class_type: 'VAEDecode',
        },
        // 6. Save as image sequence
        '6': {
          inputs: {
            images: ['5', 0],
            filename_prefix: 'svd_video',
          },
          class_type: 'SaveImage',
        },
      };
    } else {
      // Use empty frame workflow
      return {
        // 1. Load SVD checkpoint
        '1': {
          inputs: {
            ckpt_name: 'svd_xt_1_1.safetensors',
          },
          class_type: 'ImageOnlyCheckpointLoader',
        },
        // 2. Create empty/solid image as starting frame
        '2': {
          inputs: {
            width: width,
            height: height,
            batch_size: 1,
            color: 0x808080, // Mid-gray
          },
          class_type: 'EmptyImage',
        },
        // 3. SVD conditioning
        '3': {
          inputs: {
            clip_vision: ['1', 1],
            init_image: ['2', 0],
            vae: ['1', 2],
            width: width,
            height: height,
            video_frames: videoFrames,
            motion_bucket_id: 127,
            fps: 6, // SVD works best at 6fps
            augmentation_level: 0.0,
          },
          class_type: 'SVD_img2vid_Conditioning',
        },
        // 4. Sample video latents
        '4': {
          inputs: {
            seed: params.seed,
            steps: 20,
            cfg: 2.5,
            sampler_name: 'euler',
            scheduler: 'karras',
            denoise: 1.0,
            model: ['1', 0],
            positive: ['3', 0],
            negative: ['3', 1],
            latent_image: ['3', 2],
          },
          class_type: 'KSampler',
        },
        // 5. Decode latents to images
        '5': {
          inputs: {
            samples: ['4', 0],
            vae: ['1', 2],
          },
          class_type: 'VAEDecode',
        },
        // 6. Save as image sequence
        '6': {
          inputs: {
            images: ['5', 0],
            filename_prefix: 'svd_video',
          },
          class_type: 'SaveImage',
        },
      };
    }
  }

  /**
   * Parse resolution string to width/height
   */
  private parseResolution(resolution: string): { width: number; height: number } {
    const resMap: Record<string, { width: number; height: number }> = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '576x1024': { width: 576, height: 1024 },
    };

    if (resMap[resolution]) {
      return resMap[resolution];
    }

    // Try to parse custom resolution like "1920x1080"
    const match = resolution.match(/(\d+)x(\d+)/);
    if (match) {
      return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }

    // Default to 720p
    return { width: 1280, height: 720 };
  }

  /**
   * Poll ComfyUI for workflow completion
   */
  private async pollForCompletion(promptId: string, maxAttempts = 120): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(3000); // Wait 3 seconds between polls

      try {
        const historyResponse = await fetch(`${this.baseURL}/history/${promptId}`);

        if (!historyResponse.ok) {
          continue;
        }

        const history = await historyResponse.json();

        // Check if the prompt exists in history
        if (history[promptId]) {
          const promptHistory = history[promptId];

          // Check if completed
          if (promptHistory.status && promptHistory.status.completed !== undefined) {
            const outputs = promptHistory.outputs;

            // Find the saved images
            for (const nodeId in outputs) {
              const output = outputs[nodeId];
              if (output.images && output.images.length > 0) {
                // Return the first image (or we could create a GIF/video from the sequence)
                const firstImage = output.images[0];
                const filename = firstImage.filename;
                const subfolder = firstImage.subfolder || '';
                const type = firstImage.type || 'output';

                // For now, return URL to first frame
                // TODO: In production, you'd want to create a video file from the image sequence
                return `${this.baseURL}/view?filename=${filename}&subfolder=${subfolder}&type=${type}`;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling ComfyUI:', error);
      }
    }

    throw new ProviderError(
      'Video generation timed out after 6 minutes',
      this.name,
      408
    );
  }

  /**
   * Health check for ComfyUI server
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/system_stats`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('ComfyUI health check failed:', error);
      return false;
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/queue`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new ProviderError(
          'Failed to get queue status',
          this.name,
          response.status
        );
      }

      return await response.json();
    } catch (error: any) {
      throw new ProviderError(
        `Failed to get queue status: ${error.message}`,
        this.name,
        500
      );
    }
  }

  /**
   * Get system stats
   */
  async getSystemStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/system_stats`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new ProviderError(
          'Failed to get system stats',
          this.name,
          response.status
        );
      }

      return await response.json();
    } catch (error: any) {
      throw new ProviderError(
        `Failed to get system stats: ${error.message}`,
        this.name,
        500
      );
    }
  }
}
