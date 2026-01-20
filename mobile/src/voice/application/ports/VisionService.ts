export interface SceneAnalysis {
  description: string;
  objects: Array<{
    label: string;
    confidence: number;
  }>;
}

export interface VisionService {
  /** Analyze the current scene and return description */
  analyzeScene(): Promise<SceneAnalysis>;
  /** Check if the service is ready to analyze */
  isReady(): boolean;
  /** Pre-load models for faster first analysis (optional) */
  warmUp?(): Promise<void>;
}
