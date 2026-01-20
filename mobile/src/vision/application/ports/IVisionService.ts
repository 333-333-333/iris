/**
 * IVisionService - Puerto para el servicio de visión
 * 
 * Define el contrato para cualquier implementación de análisis de imágenes:
 * - TensorFlow Lite (local)
 * - GPT-4 Vision (cloud)
 * - Google Gemini (cloud)
 * - Mock (testing)
 */

import { SceneDescription } from '../../domain/entities/SceneDescription';

export interface AnalyzeImageOptions {
  /** Confianza mínima para incluir objetos (0-1) */
  minConfidence?: number;
  
  /** Número máximo de objetos a retornar */
  maxObjects?: number;
  
  /** Si debe clasificar el tipo de escena */
  includeSceneType?: boolean;
  
  /** Si debe analizar colores dominantes */
  includeColors?: boolean;
  
  /** Idioma para la descripción natural */
  language?: 'es' | 'en';
}

export interface ModelInfo {
  /** Nombre del modelo */
  name: string;
  
  /** Versión del modelo */
  version: string;
  
  /** Tamaño del modelo en bytes */
  size: number;
  
  /** Si el modelo está cargado en memoria */
  isLoaded: boolean;
  
  /** Tipo de modelo */
  type: 'object-detection' | 'classification' | 'segmentation';
}

export interface QuestionResult {
  /** Respuesta a la pregunta del usuario */
  answer: string;
  
  /** Confianza en la respuesta (0-1) */
  confidence: number;
  
  /** Modelo que generó la respuesta */
  sourceModel: 'groq' | 'gemini' | 'azure' | 'tflite';
}

export interface QuestionContext {
  /** Objetos detectados en la última imagen */
  detectedObjects?: import('../../domain/entities/DetectedObject').DetectedObject[];
  
  /** Descripción natural de la escena */
  sceneDescription?: string;
}

export interface IVisionService {
  /**
   * Analiza una imagen y retorna la descripción de la escena
   * 
   * @param imageUri - URI local de la imagen o base64
   * @param options - Opciones de análisis
   * @returns Descripción completa de la escena
   */
  analyzeImage(
    imageUri: string,
    options?: AnalyzeImageOptions
  ): Promise<SceneDescription>;

  /**
   * Responde una pregunta sobre una imagen basándose en contexto visual
   * 
   * @param imageUri - URI local de la imagen a analizar
   * @param question - Pregunta del usuario en lenguaje natural
   * @param context - Contexto adicional (objetos detectados, descripción previa)
   * @returns Respuesta generada por el modelo de visión
   * 
   * @example
   * ```typescript
   * const result = await visionService.answerQuestion(
   *   imageUri,
   *   "¿De qué color es la camisa?",
   *   { detectedObjects: [...], sceneDescription: "Veo una camisa..." }
   * );
   * console.log(result.answer); // "La camisa es roja"
   * ```
   */
  answerQuestion?(
    imageUri: string,
    question: string,
    context?: QuestionContext
  ): Promise<QuestionResult>;

  /**
   * Pre-carga los modelos en memoria para análisis más rápidos
   * 
   * Llamar esto al iniciar la app reduce la latencia del primer análisis
   */
  preloadModels(): Promise<void>;

  /**
   * Verifica si el servicio está listo para analizar imágenes
   */
  isReady(): boolean;

  /**
   * Obtiene información sobre los modelos cargados
   */
  getModelsInfo(): ModelInfo[];

  /**
   * Libera recursos (modelos de memoria, caché, etc.)
   */
  cleanup(): Promise<void>;
}
