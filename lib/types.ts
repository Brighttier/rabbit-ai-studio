// User Types
export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Model Types
export type ModelProvider =
  | 'lmstudio'
  | 'huggingface'
  | 'openrouter'
  | 'ollama'
  | 'vertexai'
  | 'replicate'
  | 'automatic1111'
  | 'comfyui'
  | 'demucs'
  | 'matchering'
  | 'custom';

export type ModelType = 'text' | 'image' | 'video' | 'audio' | 'multimodal';

export interface Model {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  provider: ModelProvider;
  type: ModelType;
  endpointURL: string;
  apiKeyRef?: string; // Reference to secret in environment or Secret Manager
  enabled: boolean;
  config?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    defaultSystemPrompt?: string;
    // Image model configs
    negativePrompt?: string;
    guidanceScale?: number;
    steps?: number;
    // Video model configs
    duration?: number;
    fps?: number;
    resolution?: string;
    frames?: number;
  };
  metadata?: {
    contextWindow?: number;
    capabilities?: string[];
    pricing?: {
      input: number;
      output: number;
    };
    modelFile?: string; // For LM Studio/Ollama models
    uncensored?: boolean; // Flag for uncensored models
  };
  createdAt: Date;
  updatedAt: Date;
}

// Session Types
export type SessionType = 'chat' | 'image' | 'video' | 'audio' | 'multimodal';

export interface Session {
  id: string;
  userId: string;
  type: SessionType;
  title: string;
  modelId: string;
  modelName: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    messageCount?: number;
    totalTokens?: number;
  };
}

// Message Types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    finishReason?: string;
  };
}

// Generation Request/Response Types
export interface TextGenerationRequest {
  prompt: string;
  modelId: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface TextGenerationResponse {
  content: string;
  modelId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  steps?: number;
  seed?: number;
  stylePreset?: string;
}

export interface ImageGenerationResponse {
  images: string[]; // URLs or base64
  modelId: string;
  metadata?: {
    width: number;
    height: number;
    seed?: number;
    steps?: number;
    guidanceScale?: number;
    stylePreset?: string;
  };
}

export interface VideoGenerationRequest {
  prompt: string;
  modelId: string;
  inputImage?: string; // For image-to-video models
  duration?: number; // In seconds
  fps?: number; // Frames per second
  resolution?: string; // e.g., '720p', '1080p', '576x1024'
  seed?: number;
}

export interface VideoGenerationResponse {
  videoUrl: string; // URL to generated video
  modelId: string;
  metadata?: {
    duration: number;
    fps: number;
    resolution: string;
    seed?: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// API Key Types
export interface ApiKey {
  id: string;
  keyHash: string; // SHA-256 hash of the actual API key
  userId: string; // Owner of the API key
  name: string; // Descriptive name for the key
  prefix: string; // First 8 chars of key (for display: rabbit_sk_XXXXXX...)
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null; // Optional expiration
  enabled: boolean;
}

// Audio Processing Types
export type AudioFormat = 'wav' | 'mp3' | 'flac' | 'm4a';
export type StemType = 'vocals' | 'drums' | 'bass' | 'other';

export interface AudioFile {
  name: string;
  url: string;
  format: AudioFormat;
  size: number;
  duration?: number;
}

export interface AudioSeparationRequest {
  audioFile: File | string;
  modelId: string;
  stems?: StemType[];
  outputFormat?: AudioFormat;
}

export interface AudioSeparationResponse {
  success: boolean;
  jobId: string;
  model: string;
  stems: AudioFile[];
  downloadBase: string;
}

export interface AudioMasteringRequest {
  targetFile: File | string;
  referenceFile: File | string;
  outputFormat?: AudioFormat;
}

export interface AudioMasteringResponse {
  success: boolean;
  jobId: string;
  mastered: AudioFile;
  downloadUrl: string;
}

export interface ProcessedAudio {
  id: string;
  type: 'separation' | 'mastering';
  originalFile: string;
  outputFiles: AudioFile[];
  timestamp: Date;
  metadata?: {
    model?: string;
    stems?: StemType[];
    targetFile?: string;
    referenceFile?: string;
  };
}

// Log Types
export interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}
