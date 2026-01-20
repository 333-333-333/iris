export interface SceneAnalysis {
  description: string;
  objects: Array<{
    label: string;
    confidence: number;
  }>;
}

export interface QuestionAnswer {
  /** Answer to the user's question */
  answer: string;
  /** Confidence in the answer (0-1) */
  confidence: number;
}

export interface VisionService {
  /** Analyze the current scene and return description */
  analyzeScene(): Promise<SceneAnalysis>;
  
  /** Answer a question about the last captured scene */
  answerQuestion?(question: string): Promise<QuestionAnswer>;
  
  /** Check if the service is ready to analyze */
  isReady(): boolean;
  
  /** Pre-load models for faster first analysis (optional) */
  warmUp?(): Promise<void>;
}
