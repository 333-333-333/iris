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
