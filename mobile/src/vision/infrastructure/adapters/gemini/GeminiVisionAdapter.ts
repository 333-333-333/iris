/**
 * Vision service adapter using Google Gemini Vision API
 * 
 * Implements IVisionService using Google's Gemini 2.0 Flash model
 * for natural language scene descriptions via cloud API.
 * 
 * @remarks
 * Uses Google Generative AI to analyze images and generate
 * human-friendly descriptions optimized for visually impaired users.
 * 
 * Free Tier Limits:
 * - 1,500 requests per day
 * - 15 requests per minute
 * - No credit card required
 * 
 * Note: This adapter only provides natural descriptions (no object detection).
 * For object detection with coordinates, use AzureVisionAdapter or TFLiteVisionAdapter.
 * 
 * @public
 */

import {
  IVisionService,
  AnalyzeImageOptions,
  ModelInfo,
} from '../../../application/ports/IVisionService';
import { SceneDescription } from '../../../domain/entities/SceneDescription';
import { DetectedObject } from '../../../domain/entities/DetectedObject';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { File as ExpoFile } from 'expo-file-system';

/**
 * Gemini Vision API adapter with natural language descriptions
 * 
 * @public
 */
export class GeminiVisionAdapter implements IVisionService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private isInitialized = false;

  /**
   * Creates an instance of GeminiVisionAdapter
   * 
   * @param apiKey - Google Generative AI API key from console.cloud.google.com
   */
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Initializes the Gemini vision model
   * 
   * For cloud-based Gemini, this just initializes the API client.
   * No local models need to be preloaded.
   * 
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} If API key is invalid or initialization fails
   */
  async preloadModels(): Promise<void> {
    if (this.isInitialized) {
      console.log('[GeminiVisionAdapter] Model already initialized');
      return;
    }

    try {
      console.log('[GeminiVisionAdapter] Initializing Gemini 2.0 Flash...');
      
      // Usar Gemini 2.0 Flash (el más rápido y gratis)
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
      });

      this.isInitialized = true;
      console.log('[GeminiVisionAdapter] ✓ Gemini initialized successfully');
    } catch (error) {
      console.error('[GeminiVisionAdapter] ✗ Failed to initialize:', error);
      throw error;
    }
  }

   /**
    * Analyzes an image and returns natural language description
    * 
    * Sends image to Gemini API for analysis and generates
    * descriptive text optimized for accessibility.
    * 
    * @param imageUri - Path to image file to analyze
    * @param options - Analysis options (language support for prompts)
    * @returns Promise resolving to scene description
    * @throws {Error} If image analysis fails
    * @throws {Error} If API rate limits exceeded
    * @throws {Error} If API key is invalid
    * 
    * @remarks
    * Returns only natural descriptions (no individual object detection).
    * Prompts are customized for Spanish or English based on options.
    * Descriptions are optimized for visually impaired users.
    * 
    * @example
    * ```typescript
    * const description = await adapter.analyzeImage(
    *   'file:///path/to/image.jpg',
    *   { language: 'es' }
    * );
    * console.log(description.naturalDescription);
    * ```
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
      console.log('[GeminiVisionAdapter] Analyzing image:', imageUri);

      // Leer imagen como base64
      const file = new ExpoFile(imageUri);
      const base64 = await file.base64();

      // Crear el prompt en español o inglés
      const prompt = language === 'es'
        ? 'Describe esta imagen de forma clara y concisa para una persona con discapacidad visual. Enfócate en: qué objetos hay, dónde están ubicados, y qué está sucediendo en la escena. Responde en español de forma natural y útil.'
        : 'Describe this image clearly and concisely for a visually impaired person. Focus on: what objects are present, where they are located, and what is happening in the scene. Respond naturally and helpfully.';

      // Llamar a Gemini
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64,
          },
        },
      ]);

      const response = await result.response;
      const naturalDescription = response.text();

      console.log('[GeminiVisionAdapter] Description generated:', naturalDescription);

      // Crear SceneDescription (sin objetos individuales, solo descripción)
      const description: SceneDescription = {
        objects: [], // Gemini no retorna objetos individuales
        timestamp: new Date(),
        confidence: 0.95, // Gemini suele ser muy confiable
        naturalDescription,
        imageUri,
      };

      return description;
    } catch (error: any) {
      console.error('[GeminiVisionAdapter] Analysis failed:', error);
      
      // Manejar errores específicos de la API
      if (error?.message?.includes('quota')) {
        throw new Error('Has alcanzado el límite de requests gratuitos de Gemini. Intenta más tarde.');
      }
      
      if (error?.message?.includes('API key')) {
        throw new Error('API key de Gemini inválida. Verifica tu configuración.');
      }

      throw new Error(`Error al analizar imagen con Gemini: ${error.message}`);
    }
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
        name: 'Gemini 2.0 Flash',
        version: '2.0',
        size: 0, // Cloud-based, no ocupa espacio local
        isLoaded: this.isInitialized,
        type: 'image-captioning',
      },
    ];
  }

  /**
   * Libera recursos (no hay mucho que limpiar en cloud)
   */
  async cleanup(): Promise<void> {
    console.log('[GeminiVisionAdapter] Cleanup (no-op for cloud service)');
    this.isInitialized = false;
  }
}
