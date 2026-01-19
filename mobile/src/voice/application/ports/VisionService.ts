export interface SceneAnalysis {
  description: string;
  objects: Array<{
    label: string;
    confidence: number;
  }>;
}

export interface VisionService {
  analyzeScene(): Promise<SceneAnalysis>;
  isReady(): boolean;
}
