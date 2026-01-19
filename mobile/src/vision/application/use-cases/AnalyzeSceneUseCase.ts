/**
 * AnalyzeSceneUseCase - Caso de uso principal para análisis de escenas
 * 
 * Orquesta el flujo completo:
 * 1. Verificar permisos de cámara
 * 2. Capturar foto
 * 3. Analizar con el servicio de visión
 * 4. Retornar descripción
 * 
 * Este use case es independiente de la infraestructura (Expo, TFLite, etc.)
 */

import { ICameraService } from '../ports/ICameraService';
import { IVisionService, AnalyzeImageOptions } from '../ports/IVisionService';
import { SceneDescription } from '../../domain/entities/SceneDescription';

export interface AnalyzeSceneResult {
  success: boolean;
  description?: SceneDescription;
  error?: Error;
}

export class AnalyzeSceneUseCase {
  constructor(
    private cameraService: ICameraService,
    private visionService: IVisionService
  ) {}

  /**
   * Ejecuta el caso de uso completo
   */
  async execute(options?: AnalyzeImageOptions): Promise<SceneDescription> {
    console.log('[AnalyzeSceneUseCase] Starting scene analysis...');

    // Paso 1: Verificar que el servicio de visión esté listo
    if (!this.visionService.isReady()) {
      console.log('[AnalyzeSceneUseCase] Vision service not ready, preloading models...');
      await this.visionService.preloadModels();
    }

    // Paso 2: Verificar permisos de cámara
    const hasPermission = await this.cameraService.hasPermission();
    
    if (!hasPermission) {
      console.log('[AnalyzeSceneUseCase] Requesting camera permissions...');
      const permissionResult = await this.cameraService.requestPermissions();
      
      if (!permissionResult.granted) {
        throw new Error('Permiso de cámara denegado. Actívalo en Configuración.');
      }
    }

    // Paso 3: Capturar foto
    console.log('[AnalyzeSceneUseCase] Capturing photo...');
    const image = await this.cameraService.capturePhoto({
      quality: 0.8,
      maxWidth: 640,  // Optimizado para TFLite
      maxHeight: 640,
      format: 'uri',
    });

    console.log('[AnalyzeSceneUseCase] Photo captured:', image.uri);

    // Paso 4: Analizar imagen
    console.log('[AnalyzeSceneUseCase] Analyzing image...');
    const description = await this.visionService.analyzeImage(image.uri, {
      minConfidence: 0.5,
      maxObjects: 10,
      includeSceneType: true,
      language: 'es',
      ...options,
    });

    console.log('[AnalyzeSceneUseCase] Analysis complete:', description.naturalDescription);

    // Agregar URI de la imagen a la descripción
    description.imageUri = image.uri;

    return description;
  }

  /**
   * Ejecuta el análisis de forma segura, retornando un resultado con error handling
   */
  async executeSafe(options?: AnalyzeImageOptions): Promise<AnalyzeSceneResult> {
    try {
      const description = await this.execute(options);
      return {
        success: true,
        description,
      };
    } catch (error) {
      console.error('[AnalyzeSceneUseCase] Error:', error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Pre-carga modelos para que el primer análisis sea más rápido
   */
  async warmUp(): Promise<void> {
    console.log('[AnalyzeSceneUseCase] Warming up vision service...');
    
    if (!this.visionService.isReady()) {
      await this.visionService.preloadModels();
    }
    
    console.log('[AnalyzeSceneUseCase] Warm-up complete');
  }

  /**
   * Verifica si todos los servicios están listos
   */
  async checkReadiness(): Promise<{
    cameraAvailable: boolean;
    cameraPermission: boolean;
    visionReady: boolean;
  }> {
    const [cameraAvailable, cameraPermission, visionReady] = await Promise.all([
      this.cameraService.isCameraAvailable(),
      this.cameraService.hasPermission(),
      Promise.resolve(this.visionService.isReady()),
    ]);

    return {
      cameraAvailable,
      cameraPermission,
      visionReady,
    };
  }
}
