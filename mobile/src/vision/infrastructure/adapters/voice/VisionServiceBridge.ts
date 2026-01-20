/**
 * VisionServiceBridge - Adaptador que conecta el Vision Module con el Voice Module
 * 
 * Este bridge implementa el puerto VisionService del módulo de voice,
 * pero usa internamente el AnalyzeSceneUseCase del módulo de vision.
 * 
 * Esto mantiene la separación de módulos y permite que voice no dependa
 * directamente de la implementación de vision.
 */

import { VisionService, SceneAnalysis, QuestionAnswer } from '../../../../voice/application/ports/VisionService';
import { AnalyzeSceneUseCase } from '../../../application/use-cases/AnalyzeSceneUseCase';
import { AnswerQuestionUseCase } from '../../../application/use-cases/AnswerQuestionUseCase';
import { ICameraService } from '../../../application/ports/ICameraService';
import { IVisionService } from '../../../application/ports/IVisionService';
import { IContextRepository } from '../../../application/ports/IContextRepository';

export class VisionServiceBridge implements VisionService {
  private analyzeSceneUseCase: AnalyzeSceneUseCase;
  private answerQuestionUseCase?: AnswerQuestionUseCase;
  private visionService: IVisionService;

  constructor(
    cameraService: ICameraService,
    visionService: IVisionService,
    contextRepository?: IContextRepository
  ) {
    this.visionService = visionService;
    this.analyzeSceneUseCase = new AnalyzeSceneUseCase(
      cameraService,
      visionService,
      contextRepository
    );
    
    // Solo crear AnswerQuestionUseCase si hay contextRepository
    if (contextRepository) {
      this.answerQuestionUseCase = new AnswerQuestionUseCase(
        visionService,
        contextRepository
      );
    }
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
   * Responde una pregunta sobre la última escena capturada
   * 
   * Implementa el contrato del módulo voice, pero delega
   * al AnswerQuestionUseCase del módulo vision
   * 
   * @param question - Pregunta del usuario
   * @returns Respuesta generada
   */
  async answerQuestion(question: string): Promise<QuestionAnswer> {
    try {
      console.log('[VisionServiceBridge] Answering question:', question);

      if (!this.answerQuestionUseCase) {
        throw new Error('Q&A no está configurado. Se necesita un ContextRepository.');
      }

      // Ejecutar el use case
      const result = await this.answerQuestionUseCase.execute(question);

      // Convertir al formato esperado por voice
      const answer: QuestionAnswer = {
        answer: result.answer,
        confidence: result.confidence,
      };

      console.log('[VisionServiceBridge] Answer:', answer.answer);

      return answer;
    } catch (error) {
      console.error('[VisionServiceBridge] Question failed:', error);
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
