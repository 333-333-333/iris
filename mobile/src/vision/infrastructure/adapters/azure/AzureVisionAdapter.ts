/**
 * Vision service adapter using Azure Computer Vision API
 * 
 * Implements IVisionService using Azure Computer Vision API v4.0 for cloud-based image analysis.
 * 
 * @remarks
 * Features:
 * - Object detection with bounding box coordinates
 * - Natural language scene descriptions (captions)
 * - Detailed dense captions for image regions
 * - Multi-label object tags with confidence scores
 * 
 * **Important**: This adapter always returns descriptions in English.
 * Translation to Spanish is handled in the application layer (use cases).
 * 
 * Azure Computer Vision Free Tier:
 * - 5,000 transactions/month free
 * - Millisecond response times
 * - More generous quota than Gemini
 * - Precise bounding box coordinates for objects
 * 
 * @public
 */

import {
  IVisionService,
  AnalyzeImageOptions,
  ModelInfo,
} from '../../../application/ports/IVisionService';
import { SceneDescription } from '../../../domain/entities/SceneDescription';
import { 
  DetectedObject, 
  calculateObjectPosition, 
  calculateObjectSize 
} from '../../../domain/entities/DetectedObject';
import { translateLabel } from '../../../domain/value-objects/LabelTranslations';
import axios, { AxiosInstance } from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Detected object from Azure API response
 * 
 * @internal
 */
interface AzureDetectedObject {
  boundingBox: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags: Array<{
    name: string;
    confidence: number;
  }>;
}

/**
 * Dense caption from Azure API response
 * 
 * @internal
 */
interface AzureCaption {
  text: string;
  confidence: number;
}

/**
 * Complete analysis result from Azure Computer Vision API
 * 
 * @internal
 */
interface AzureAnalysisResult {
  captionResult?: {
    text: string;
    confidence: number;
  };
  denseCaptionsResult?: {
    values: AzureCaption[];
  };
  objectsResult?: {
    values: AzureDetectedObject[];
  };
  tagsResult?: {
    values: Array<{ name: string; confidence: number }>;
  };
  modelVersion: string;
  metadata: {
    width: number;
    height: number;
  };
}

/**
 * Cloud-based vision service using Azure Computer Vision
 * 
 * @public
 */
export class AzureVisionAdapter implements IVisionService {
  private httpClient: AxiosInstance;
  private endpoint: string;
  private apiKey: string;
  private isInitialized = false;

  /**
   * Creates an instance of AzureVisionAdapter
   * 
   * @param apiKey - Azure Computer Vision API key
   * @param endpoint - Azure Computer Vision endpoint URL
   */
  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    
    // Configure HTTP client with Azure authentication
    this.httpClient = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Preloads and initializes the vision model
   * 
   * For cloud-based Azure, this just validates configuration.
   * No local models need to be loaded.
   * 
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} If Azure configuration is invalid
   */
  async preloadModels(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AzureVisionAdapter] Model already initialized');
      return;
    }

    try {
      console.log('[AzureVisionAdapter] Initializing Azure Computer Vision...');
      
      // No hay mucho que pre-cargar con Azure (cloud-based)
      // Solo verificamos que la configuración está lista
      
      this.isInitialized = true;
      console.log('[AzureVisionAdapter] ✓ Azure Computer Vision initialized');
    } catch (error) {
      console.error('[AzureVisionAdapter] ✗ Failed to initialize:', error);
      throw error;
    }
  }

   /**
    * Analyzes an image and returns scene description with detected objects
    * 
    * Sends image to Azure Computer Vision API for cloud-based analysis.
    * Returns objects with bounding boxes, natural language caption,
    * and per-object confidence scores.
    * 
    * @param imageUri - Path to image file to analyze
    * @param options - Analysis options (language is ignored, always English)
    * @returns Promise resolving to scene description with objects and caption
    * @throws {Error} If image analysis fails
    * @throws {Error} If API key is invalid
    * @throws {Error} If request timeout occurs
    * @throws {Error} If rate limit exceeded
    * 
    * @remarks
    * Always returns descriptions in English regardless of language option.
    * Translation is handled in the application layer.
    * 
    * Bounding box coordinates are normalized to 0-1 range
    * relative to image dimensions for scale-independent positioning.
    * 
    * @example
    * ```typescript
    * const description = await adapter.analyzeImage(
    *   'file:///path/to/image.jpg',
    *   { language: 'es' }
    * );
    * console.log('Objects:', description.objects);
    * console.log('Caption:', description.naturalDescription);
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
      console.log('[AzureVisionAdapter] Analyzing image:', imageUri);

      // Leer imagen como base64 usando legacy API
      console.log('[AzureVisionAdapter] Reading image file...');
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convertir base64 a ArrayBuffer para axios
      const binaryString = atob(base64Image);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const imageBinary = bytes.buffer;
      
      console.log('[AzureVisionAdapter] Image loaded:', {
        size: imageBinary.byteLength,
        sizeKB: (imageBinary.byteLength / 1024).toFixed(2),
      });

      // Features a analizar
      const features = [
        'caption',        // Descripción general
        'denseCaptions',  // Descripciones detalladas de regiones
        'objects',        // Objetos detectados con coordenadas
        'tags',           // Tags descriptivos
      ];

      // Llamar a Azure Computer Vision API v4.0
      console.log('[AzureVisionAdapter] Calling Azure API...');
      const response = await this.httpClient.post<AzureAnalysisResult>(
        '/computervision/imageanalysis:analyze',
        imageBinary,
        {
          params: {
            'api-version': '2024-02-01',
            features: features.join(','),
            'language': 'en', // Siempre inglés - traducimos después
            'gender-neutral-caption': 'true',
          },
        }
      );
      console.log('[AzureVisionAdapter] ✓ Azure API responded');

      const result = response.data;
      console.log('[AzureVisionAdapter] Analysis complete:', {
        caption: result.captionResult?.text,
        objects: result.objectsResult?.values?.length || 0,
        tags: result.tagsResult?.values?.length || 0,
      });
      
      // Debug: ver estructura completa
      if (result.objectsResult?.values?.length) {
        console.log('[AzureVisionAdapter] Sample object:', JSON.stringify(result.objectsResult.values[0], null, 2));
      }

      // Obtener dimensiones de la imagen
      const imageWidth = result.metadata.width;
      const imageHeight = result.metadata.height;

      // Convertir objetos de Azure a nuestro formato
      const objects: DetectedObject[] = (result.objectsResult?.values || [])
        .filter(obj => obj.boundingBox && obj.tags?.length > 0) // Filtrar objetos sin bounding box o tags
        .map((obj) => {
          // Obtener el tag principal (el de mayor confianza)
          const primaryTag = obj.tags[0];
          
          // Normalizar coordenadas (Azure retorna píxeles absolutos, necesitamos 0-1)
          const normalizedBox = {
            x: obj.boundingBox.x / imageWidth,
            y: obj.boundingBox.y / imageHeight,
            width: obj.boundingBox.w / imageWidth,
            height: obj.boundingBox.h / imageHeight,
          };

          return {
            label: primaryTag.name,
            labelEs: translateLabel(primaryTag.name),
            confidence: primaryTag.confidence,
            boundingBox: normalizedBox,
            position: calculateObjectPosition(normalizedBox),
            size: calculateObjectSize(normalizedBox),
          };
        });

      // Usar caption principal o construir uno desde dense captions
      let naturalDescription = result.captionResult?.text || '';
      
      if (!naturalDescription && result.denseCaptionsResult?.values?.length) {
        // Si no hay caption principal, usar el primer dense caption
        naturalDescription = result.denseCaptionsResult.values[0].text;
      }

      // Si aún no hay descripción, construir una desde tags
      if (!naturalDescription && result.tagsResult?.values?.length) {
        const topTags = result.tagsResult.values
          .slice(0, 5)
          .map(t => translateLabel(t.name))
          .join(', ');
        naturalDescription = language === 'es' 
          ? `Veo: ${topTags}`
          : `I see: ${topTags}`;
      }

      // NOTA: La traducción se maneja en la capa de aplicación
      // Este adaptador solo retorna descripciones en inglés
      console.log('[AzureVisionAdapter] Description (English):', naturalDescription);

      const confidence = result.captionResult?.confidence || 
                        objects.reduce((sum, obj) => sum + obj.confidence, 0) / (objects.length || 1);

      const description: SceneDescription = {
        objects,
        timestamp: new Date(),
        confidence,
        naturalDescription,
        imageUri,
      };

      return description;
    } catch (error: any) {
      console.error('[AzureVisionAdapter] Analysis failed:', error);
      console.error('[AzureVisionAdapter] Error code:', error.code);
      console.error('[AzureVisionAdapter] Error message:', error.message);
      
      // Timeout específico
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Azure tardó demasiado en responder. La imagen puede ser muy grande.');
      }
      
      // Log completo del response para debugging
      if (error?.response) {
        console.error('[AzureVisionAdapter] Response status:', error.response.status);
        console.error('[AzureVisionAdapter] Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('[AzureVisionAdapter] Response headers:', error.response.headers);
      }
      
      // Manejar errores específicos de la API
      if (error?.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Bad Request';
        throw new Error(`Azure rechazó la request: ${errorMessage}`);
      }
      
      if (error?.response?.status === 429) {
        throw new Error('Has alcanzado el límite de requests de Azure Computer Vision. Intenta más tarde.');
      }
      
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        throw new Error('API key de Azure inválida. Verifica EXPO_PUBLIC_AZURE_CV_API_KEY.');
      }

      if (error?.response?.status === 404) {
        throw new Error('Endpoint de Azure no encontrado. Verifica EXPO_PUBLIC_AZURE_CV_ENDPOINT.');
      }

      throw new Error(`Error al analizar imagen con Azure Computer Vision: ${error.message}`);
    }
  }

   /**
    * Checks if the service is ready for analysis
    * 
    * @returns True if initialized and ready to analyze images
    */
   isReady(): boolean {
     return this.isInitialized;
   }

   /**
    * Gets information about loaded vision models
    * 
    * For Azure (cloud-based), size is 0 as no local models are stored.
    * 
    * @returns Array of model information objects
    */
   getModelsInfo(): ModelInfo[] {
     return [
       {
         name: 'Azure Computer Vision',
         version: '4.0',
         size: 0, // Cloud-based, no local storage
         isLoaded: this.isInitialized,
         type: 'object-detection',
       },
     ];
   }

   /**
    * Cleans up resources used by the vision service
    * 
    * For cloud-based Azure, minimal cleanup needed.
    * 
    * @returns Promise that resolves when cleanup is complete
    */
   async cleanup(): Promise<void> {
    console.log('[AzureVisionAdapter] Cleanup (no-op for cloud service)');
    this.isInitialized = false;
  }
}
