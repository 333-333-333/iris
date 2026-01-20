/**
 * AnswerQuestionUseCase - Caso de uso para responder preguntas sobre imágenes
 * 
 * Orquesta el flujo:
 * 1. Verificar que hay contexto visual reciente
 * 2. Llamar al servicio de visión para responder la pregunta
 * 3. Retornar respuesta generada
 * 
 * Este use case permite hacer preguntas específicas sobre la última imagen
 * capturada sin necesidad de volver a tomar una foto.
 */

import { IVisionService, QuestionResult } from '../ports/IVisionService';
import { IContextRepository } from '../ports/IContextRepository';

export interface AnswerQuestionOptions {
  /** Edad máxima del contexto en milisegundos (default: 5 minutos) */
  maxContextAge?: number;
  
  /** Si debe lanzar error cuando no hay contexto (default: true) */
  throwOnMissingContext?: boolean;
}

export class AnswerQuestionUseCase {
  private readonly DEFAULT_MAX_CONTEXT_AGE = 5 * 60 * 1000; // 5 minutos

  constructor(
    private visionService: IVisionService,
    private contextRepository: IContextRepository
  ) {}

  /**
   * Ejecuta el caso de uso para responder una pregunta
   * 
   * @param question - Pregunta del usuario en lenguaje natural
   * @param options - Opciones de ejecución
   * @returns Resultado con la respuesta generada
   * @throws {Error} Si no hay contexto visual reciente
   * @throws {Error} Si el servicio de visión no soporta Q&A
   * @throws {Error} Si falla la generación de respuesta
   */
  async execute(
    question: string,
    options: AnswerQuestionOptions = {}
  ): Promise<QuestionResult> {
    const {
      maxContextAge = this.DEFAULT_MAX_CONTEXT_AGE,
      throwOnMissingContext = true,
    } = options;

    console.log('[AnswerQuestionUseCase] Processing question:', question);

    // Paso 1: Verificar que el servicio soporta Q&A
    if (!this.visionService.answerQuestion) {
      throw new Error(
        'El servicio de visión actual no soporta responder preguntas. ' +
        'Usa GeminiVisionAdapter o AzureVisionAdapter.'
      );
    }

    // Paso 2: Recuperar contexto visual
    const context = await this.contextRepository.getLastContext();

    if (!context) {
      const errorMsg = 'No hay contexto visual disponible. Di "describe" primero para capturar una imagen.';
      console.log('[AnswerQuestionUseCase]', errorMsg);
      
      if (throwOnMissingContext) {
        throw new Error(errorMsg);
      }
      
      return {
        answer: errorMsg,
        confidence: 0,
        sourceModel: 'gemini',
      };
    }

    // Paso 3: Verificar que el contexto no esté expirado
    const isFresh = await this.contextRepository.isContextFresh(maxContextAge);

    if (!isFresh) {
      const age = Date.now() - context.timestamp.getTime();
      const ageMinutes = Math.floor(age / 60000);
      
      const errorMsg = `El contexto visual es muy antiguo (${ageMinutes} minutos). ` +
                       'Di "describe" para capturar una nueva imagen.';
      console.log('[AnswerQuestionUseCase]', errorMsg);
      
      if (throwOnMissingContext) {
        throw new Error(errorMsg);
      }
      
      return {
        answer: errorMsg,
        confidence: 0,
        sourceModel: 'gemini',
      };
    }

    // Paso 4: Responder pregunta usando el contexto
    console.log('[AnswerQuestionUseCase] Using context:', {
      imageUri: context.imageUri,
      objects: context.detectedObjects.length,
      age: Date.now() - context.timestamp.getTime(),
    });

    const result = await this.visionService.answerQuestion(
      context.imageUri,
      question,
      {
        detectedObjects: context.detectedObjects,
        sceneDescription: context.sceneDescription,
      }
    );

    console.log('[AnswerQuestionUseCase] Answer:', result.answer);

    return result;
  }

  /**
   * Ejecuta el caso de uso de forma segura, retornando error en lugar de lanzarlo
   */
  async executeSafe(
    question: string,
    options: AnswerQuestionOptions = {}
  ): Promise<{ success: boolean; result?: QuestionResult; error?: string }> {
    try {
      const result = await this.execute(question, options);
      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('[AnswerQuestionUseCase] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Verifica si hay contexto disponible para responder preguntas
   */
  async hasAvailableContext(maxAge?: number): Promise<boolean> {
    const context = await this.contextRepository.getLastContext();
    if (!context) {
      return false;
    }

    return this.contextRepository.isContextFresh(maxAge);
  }

  /**
   * Obtiene información sobre el contexto actual
   */
  async getContextInfo(): Promise<{
    available: boolean;
    age?: number;
    objectsCount?: number;
  }> {
    const context = await this.contextRepository.getLastContext();

    if (!context) {
      return { available: false };
    }

    const age = Date.now() - context.timestamp.getTime();

    return {
      available: true,
      age,
      objectsCount: context.detectedObjects.length,
    };
  }
}
