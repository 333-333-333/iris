/**
 * Hybrid vision service combining local and cloud analysis
 * 
 * Combines on-device TensorFlow Lite detection with optional cloud-based Azure Computer Vision
 * for enhanced scene descriptions. Works offline with local detection,
 * seamlessly upgrades descriptions when internet connection available.
 * 
 * @remarks
 * Strategy:
 * 1. Always runs on-device detection (TFLite COCO-SSD) - fast, offline-capable
 * 2. If internet available: Enriches with detailed captions from Azure
 * 3. If offline: Returns local detection results with generated descriptions
 * 
 * Benefits:
 * - Works reliably offline
 * - Rich descriptions when online
 * - Fast real-time detection
 * - Privacy-respecting by default
 * 
 * @public
 */

import {
  IVisionService,
  AnalyzeImageOptions,
  ModelInfo,
} from '../../../application/ports/IVisionService';
import { SceneDescription } from '../../../domain/entities/SceneDescription';
import { TFLiteVisionAdapter } from '../tflite/TFLiteVisionAdapter';
import { AzureVisionAdapter } from '../azure/AzureVisionAdapter';
import { ITranslationService } from '../../../application/services/TranslationService';
import { NullTranslationAdapter } from '../NullTranslationAdapter';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hybrid vision adapter with fallback strategy
 * 
 * @public
 */
export class HybridVisionAdapter implements IVisionService {
  private tfliteAdapter: TFLiteVisionAdapter;
  private azureAdapter: AzureVisionAdapter | null = null;
  private translationService: ITranslationService;
  private useAzure: boolean;

  /**
   * Creates an instance of HybridVisionAdapter
   * 
   * @param azureConfig - Optional Azure Computer Vision configuration
   * @param translationService - Optional service for translating descriptions
   * 
   * @remarks
   * Azure configuration is optional. If not provided, only local detection is used.
   * Translation service uses Null Object Pattern if not provided.
   */
  constructor(
    azureConfig?: { apiKey: string; endpoint: string },
    translationService?: ITranslationService
  ) {
    this.tfliteAdapter = new TFLiteVisionAdapter();
    this.translationService = translationService || new NullTranslationAdapter(); // Null Object Pattern
    
    if (azureConfig) {
      this.azureAdapter = new AzureVisionAdapter(
        azureConfig.apiKey,
        azureConfig.endpoint
      );
      this.useAzure = true;
      console.log('[HybridVisionAdapter] Azure Computer Vision enabled');
    } else {
      this.useAzure = false;
      console.log('[HybridVisionAdapter] Azure Computer Vision disabled (no config)');
    }

    if (this.translationService.isAvailable()) {
      console.log('[HybridVisionAdapter] Translation service enabled');
    } else {
      console.log('[HybridVisionAdapter] Translation service not available - descriptions will be in English');
    }
  }

  /**
   * Preloads and initializes vision models
   * 
   * Always loads TensorFlow Lite models for on-device detection.
   * Optionally initializes Azure cloud service if configured.
   * 
   * @returns Promise that resolves when all models are ready
   * @throws {Error} If local TFLite models fail to load
   */
  async preloadModels(): Promise<void> {
    console.log('[HybridVisionAdapter] Preloading models...');
    
    // SIEMPRE cargar TFLite (on-device)
    await this.tfliteAdapter.preloadModels();
    
    // Cargar Azure si está habilitado
    if (this.azureAdapter) {
      try {
        await this.azureAdapter.preloadModels();
      } catch (error) {
        console.warn('[HybridVisionAdapter] Azure initialization failed, will use TFLite only:', error);
        this.useAzure = false;
      }
    }
    
    console.log('[HybridVisionAdapter] ✓ Models preloaded');
  }

   /**
    * Analyzes image using hybrid local-cloud strategy
    * 
    * Performs on-device TFLite detection and optionally enriches with Azure analysis.
    * Automatically detects network connectivity and uses best available service.
    * 
    * @param imageUri - Path to image to analyze
    * @param options - Analysis configuration options
    * @returns Promise resolving to scene description
    * 
    * @remarks
    * Always returns results from local TFLite detection.
    * When online, Azure description is merged into results.
    * When offline, local generated description is used.
    * 
    * @example
    * ```typescript
    * const description = await adapter.analyzeImage(
    *   'file:///path/image.jpg',
    *   { language: 'es' }
    * );
    * // Works offline with local detection
    * // Uses Azure descriptions when online
    * ```
    */
   async analyzeImage(
     imageUri: string,
     options: AnalyzeImageOptions = {}
   ): Promise<SceneDescription> {
    console.log('[HybridVisionAdapter] Analyzing image...');

    // 1. SIEMPRE ejecutar detección local primero (rápido)
    const localResult = await this.tfliteAdapter.analyzeImage(imageUri, options);
    console.log('[HybridVisionAdapter] Local detection:', localResult.objects.length, 'objects');

    // 2. Si Azure está habilitado Y hay conexión, enriquecer
    if (this.useAzure && this.azureAdapter) {
      const isConnected = await this.checkConnection();
      
      if (isConnected) {
        try {
          console.log('[HybridVisionAdapter] Online - using Azure Computer Vision for rich description');
          const azureResult = await this.azureAdapter.analyzeImage(imageUri, options);
          
          // Azure retorna descripción en inglés - traducir si es necesario
          let translatedDescription = azureResult.naturalDescription;
          const targetLanguage = options.language || 'es'; // Default a español
          
          console.log('[HybridVisionAdapter] Translation check:', {
            language: targetLanguage,
            translatorAvailable: this.translationService.isAvailable(),
            originalText: azureResult.naturalDescription,
          });
          
          if (targetLanguage === 'es' && this.translationService.isAvailable()) {
            try {
              translatedDescription = await this.translationService.translate(
                azureResult.naturalDescription,
                'en',
                'es'
              );
              console.log('[HybridVisionAdapter] ✓ Description translated:', translatedDescription);
            } catch (error) {
              console.warn('[HybridVisionAdapter] Translation failed:', error);
            }
          } else {
            console.log('[HybridVisionAdapter] Skipping translation:', {
              reason: targetLanguage !== 'es' ? 'not Spanish' : 'translator not available',
            });
          }
          
          // Combinar: objetos de TFLite + descripción traducida de Azure
          return {
            ...localResult,
            naturalDescription: translatedDescription,
            confidence: Math.max(localResult.confidence, azureResult.confidence),
          };
        } catch (error) {
          console.warn('[HybridVisionAdapter] Azure failed, using local description:', error);
          // Fallback a descripción local
        }
      } else {
        console.log('[HybridVisionAdapter] Offline - using local description only');
      }
    }

    // 3. Retornar resultado local
    return localResult;
  }

  /**
   * Verifica si hay conexión a internet
   */
  private async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable !== false;
    } catch (error) {
      console.warn('[HybridVisionAdapter] Could not check connection:', error);
      return false;
    }
  }

  /**
   * Verifica si el servicio está listo
   */
  isReady(): boolean {
    return this.tfliteAdapter.isReady();
  }

  /**
   * Obtiene información sobre los modelos cargados
   */
  getModelsInfo(): ModelInfo[] {
    const models = [...this.tfliteAdapter.getModelsInfo()];
    
    if (this.azureAdapter) {
      models.push(...this.azureAdapter.getModelsInfo());
    }
    
    return models;
  }

  /**
   * Libera recursos
   */
  async cleanup(): Promise<void> {
    console.log('[HybridVisionAdapter] Cleaning up...');
    await this.tfliteAdapter.cleanup();
    
    if (this.azureAdapter) {
      await this.azureAdapter.cleanup();
    }
  }
}
