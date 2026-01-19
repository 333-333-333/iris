/**
 * VisionServiceBridge - Adaptador que conecta el Vision Module con el Voice Module
 * 
 * Este bridge implementa el puerto VisionService del módulo de voice,
 * pero usa internamente el AnalyzeSceneUseCase del módulo de vision.
 * 
 * Esto mantiene la separación de módulos y permite que voice no dependa
 * directamente de la implementación de vision.
 */

import { VisionService, SceneAnalysis } from '../../../../voice/application/ports/VisionService';
import { AnalyzeSceneUseCase } from '../../../application/use-cases/AnalyzeSceneUseCase';
import { ICameraService } from '../../../application/ports/ICameraService';
import { IVisionService } from '../../../application/ports/IVisionService';

export class VisionServiceBridge implements VisionService {
  private analyzeSceneUseCase: AnalyzeSceneUseCase;
  private visionService: IVisionService;

  constructor(
    cameraService: ICameraService,
    visionService: IVisionService
  ) {
    this.visionService = visionService;
    this.analyzeSceneUseCase = new AnalyzeSceneUseCase(
      cameraService,
      visionService
    );
  }

  /**
   * Analiza la escena actual y retorna la descripción
   * 
   * Implementa el contrato del módulo voice, pero delega
   * al use case del módulo vision
   */
  async analyzeScene(): Promise<SceneAnalysis> {
    try {
      console.log('[VisionServiceBridge] Analyzing scene...');

      // Ejecutar el use case
      const sceneDescription = await this.analyzeSceneUseCase.execute();

      // Convertir SceneDescription al formato esperado por voice
      const analysis: SceneAnalysis = {
        description: sceneDescription.naturalDescription,
        objects: sceneDescription.objects.map(obj => ({
          label: obj.labelEs,
          confidence: obj.confidence,
        })),
      };

      console.log('[VisionServiceBridge] Analysis complete:', analysis.description);

      return analysis;
    } catch (error) {
      console.error('[VisionServiceBridge] Analysis failed:', error);
      
      // En caso de error, retornar análisis fallido
      throw error;
    }
  }

  /**
   * Verifica si el servicio de visión está listo
   */
  isReady(): boolean {
    return this.visionService.isReady();
  }

  /**
   * Pre-carga modelos (opcional, llamar al iniciar app)
   */
  async warmUp(): Promise<void> {
    await this.analyzeSceneUseCase.warmUp();
  }
}
