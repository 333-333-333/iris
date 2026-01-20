/**
 * Vision service adapter using Groq with Llama 4 Vision
 * 
 * Implements IVisionService using Groq's ultra-fast inference with Llama 4 Scout/Maverick.
 * 
 * @remarks
 * Features:
 * - Ultra-low latency (~200-400ms vs 1-2s de Gemini)
 * - Multimodal: texto + imágenes
 * - Free tier generoso (14,400 requests/día)
 * - Tool use, JSON mode, multi-turn conversations
 * - OCR y análisis visual avanzado
 * 
 * Ideal para:
 * - Q&A sobre imágenes (color, talla, precio, marca)
 * - Descripciones en lenguaje natural
 * - Análisis en tiempo real
 * 
 * @public
 */

import {
  IVisionService,
  AnalyzeImageOptions,
  ModelInfo,
  QuestionResult,
  QuestionContext,
} from '../../../application/ports/IVisionService';
import { SceneDescription } from '../../../domain/entities/SceneDescription';
import { DetectedObject } from '../../../domain/entities/DetectedObject';
import Groq from 'groq-sdk';
import * as FileSystem from 'expo-file-system/legacy';

export interface GroqVisionAdapterConfig {
  /** API key de Groq */
  apiKey: string;
  /** Modelo de visión (default: llama-4-scout) */
  model?: 'meta-llama/llama-4-scout-17b-16e-instruct' | 'meta-llama/llama-4-maverick-17b-128e-instruct';
  /** Temperatura (0-2, default: 0.7) */
  temperature?: number;
  /** Máximo de tokens (default: 1024) */
  maxTokens?: number;
}

/**
 * Cloud-based vision service using Groq Llama 4 Vision
 * 
 * @public
 */
export class GroqVisionAdapter implements IVisionService {
  private groq: Groq;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private isInitialized = false;

  /**
   * Creates an instance of GroqVisionAdapter
   * 
   * @param config - Configuración de Groq
   */
  constructor(config: GroqVisionAdapterConfig) {
    this.groq = new Groq({
      apiKey: config.apiKey,
    });
    
    this.model = config.model || 'meta-llama/llama-4-scout-17b-16e-instruct';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 1024;
  }

  /**
   * Initializes the Groq vision model
   * 
   * For cloud-based Groq, this just validates configuration.
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async preloadModels(): Promise<void> {
    if (this.isInitialized) {
      console.log('[GroqVisionAdapter] Model already initialized');
      return;
    }

    try {
      console.log('[GroqVisionAdapter] Initializing Groq Llama 4 Vision...');
      console.log('[GroqVisionAdapter] Model:', this.model);
      
      this.isInitialized = true;
      console.log('[GroqVisionAdapter] ✓ Groq initialized successfully');
    } catch (error) {
      console.error('[GroqVisionAdapter] ✗ Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Analyzes an image and returns natural language description
   * 
   * Sends image to Groq API for analysis with Llama 4 Vision.
   * 
   * @param imageUri - Path to image file to analyze
   * @param options - Analysis options
   * @returns Promise resolving to scene description
   */
  async analyzeImage(
    imageUri: string,
    options: AnalyzeImageOptions = {}
  ): Promise<SceneDescription> {
    if (!this.isInitialized) {
      await this.preloadModels();
    }

    const { language = 'es' } = options;

    try {
      console.log('[GroqVisionAdapter] Analyzing image:', imageUri);

      // Leer imagen como base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });

      // Crear el prompt en español o inglés
      const prompt = language === 'es'
        ? 'Describe esta imagen en UNA oración corta para una persona con discapacidad visual. Di solo los objetos principales que ves. Máximo 12 palabras.'
        : 'Describe this image in ONE short sentence for a visually impaired person. Only main objects. Max 12 words.';

      // Llamar a Groq con Llama 4 Vision
      const startTime = Date.now();
      
      const completion = await this.groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2, // Muy bajo para velocidad
        max_completion_tokens: 50, // MUY corto para velocidad
        top_p: 0.9, // Menor para enfoque
        stream: false,
      });

      const latency = Date.now() - startTime;
      console.log('[GroqVisionAdapter] ✓ Groq responded in', latency, 'ms');

      const naturalDescription = completion.choices[0]?.message?.content || '';

      console.log('[GroqVisionAdapter] Description generated:', naturalDescription);

      // Crear SceneDescription (sin objetos individuales, solo descripción)
      const description: SceneDescription = {
        objects: [], // Llama 4 Vision genera descripción natural, no objetos individuales
        timestamp: new Date(),
        confidence: 0.95,
        naturalDescription,
        imageUri,
      };

      return description;
    } catch (error: any) {
      console.error('[GroqVisionAdapter] Analysis failed:', error);

      // Manejar errores específicos de Groq
      if (error?.message?.includes('rate limit') || error?.status === 429) {
        throw new Error('Has alcanzado el límite de requests de Groq. Intenta más tarde.');
      }

      if (error?.status === 401 || error?.status === 403) {
        throw new Error('API key de Groq inválida. Verifica tu configuración.');
      }

      if (error?.message?.includes('image')) {
        throw new Error('Error al procesar la imagen. Verifica que sea un formato válido (JPEG/PNG) y menor a 20MB.');
      }

      throw new Error(`Error al analizar imagen con Groq: ${error.message}`);
    }
  }

  /**
   * Responde una pregunta sobre una imagen usando contexto visual
   * 
   * Usa Llama 4 Vision para entender la pregunta y generar una respuesta
   * basada en la imagen y el contexto proporcionado.
   * 
   * @param imageUri - Path a la imagen a analizar
   * @param question - Pregunta del usuario en lenguaje natural
   * @param context - Contexto adicional (objetos detectados, descripción previa)
   * @returns Promise con la respuesta generada
   */
  async answerQuestion(
    imageUri: string,
    question: string,
    context?: QuestionContext
  ): Promise<QuestionResult> {
    if (!this.isInitialized) {
      await this.preloadModels();
    }

    try {
      console.log('[GroqVisionAdapter] Answering question:', question);

      // Leer imagen como base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });

      // Construir prompt con contexto
      const prompt = this.buildQuestionPrompt(question, context);
      console.log('[GroqVisionAdapter] Prompt:', prompt);

      // Llamar a Groq con la imagen y la pregunta
      const startTime = Date.now();

      const completion = await this.groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,  // Muy bajo para velocidad y precisión
        max_completion_tokens: 40,  // MUY corto para velocidad (1 oración)
        top_p: 0.9,  // Menor para enfoque
        stream: false,
      });

      const latency = Date.now() - startTime;
      console.log('[GroqVisionAdapter] ✓ Question answered in', latency, 'ms');

      const answer = completion.choices[0]?.message?.content?.trim() || '';

      console.log('[GroqVisionAdapter] Answer generated:', answer);

      return {
        answer,
        confidence: 0.95,
        sourceModel: 'groq',
      };
    } catch (error: any) {
      console.error('[GroqVisionAdapter] Question answering failed:', error);

      // Manejar errores específicos
      if (error?.message?.includes('rate limit') || error?.status === 429) {
        throw new Error('Has alcanzado el límite de requests de Groq. Intenta más tarde.');
      }

      if (error?.status === 401 || error?.status === 403) {
        throw new Error('API key de Groq inválida.');
      }

      throw new Error(`Error al responder pregunta con Groq: ${error.message}`);
    }
  }

  /**
   * Construye el prompt para responder preguntas con contexto
   * 
   * @param question - Pregunta del usuario
   * @param context - Contexto visual (objetos detectados, descripción previa)
   * @returns Prompt optimizado para Llama 4 Vision
   * @internal
   */
  private buildQuestionPrompt(
    question: string,
    context?: QuestionContext
  ): string {
    let prompt = `Eres un asistente visual para personas con discapacidad visual.

Usuario pregunta: "${question}"

`;

    // Agregar contexto si existe
    if (context?.sceneDescription) {
      prompt += `Contexto previo: Ya describí esta escena como: "${context.sceneDescription}"\n\n`;
    }

    if (context?.detectedObjects && context.detectedObjects.length > 0) {
      const objects = context.detectedObjects
        .map(obj => obj.labelEs || obj.label)
        .join(', ');
      prompt += `Objetos detectados: ${objects}\n\n`;
    }

    // Instrucciones específicas
    prompt += `INSTRUCCIONES:
- Responde en español en UNA SOLA ORACIÓN (máximo 15 palabras)
- Si la pregunta es sobre texto visible, léelo exactamente como aparece
- Si no puedes determinar algo, di "No lo veo claro"
- Sé DIRECTO, sin introducción
- NO repitas la pregunta

Respuesta directa:`;

    return prompt;
  }

  /**
   * Verifica si el servicio está listo
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Obtiene información sobre los modelos cargados
   */
  getModelsInfo(): ModelInfo[] {
    return [
      {
        name: 'Llama 4 Vision (Groq)',
        version: '4.0',
        size: 0, // Cloud-based, no ocupa espacio local
        isLoaded: this.isInitialized,
        type: 'object-detection',
      },
    ];
  }

  /**
   * Libera recursos (no hay mucho que limpiar en cloud)
   */
  async cleanup(): Promise<void> {
    console.log('[GroqVisionAdapter] Cleanup (no-op for cloud service)');
    this.isInitialized = false;
  }
}
