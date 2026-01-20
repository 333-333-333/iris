import React from 'react';
import { ExpoCameraAdapter } from '../../infrastructure/adapters/expo/ExpoCameraAdapter';
import { HybridVisionAdapter } from '../../infrastructure/adapters/hybrid/HybridVisionAdapter';
import { GroqVisionAdapter } from '../../infrastructure/adapters/groq/GroqVisionAdapter';
import { VisionServiceBridge } from '../../infrastructure/adapters/voice/VisionServiceBridge';
import { VisionService } from '../../../voice/application/ports/VisionService';
import { getAzureConfig, getAzureTranslatorConfig } from '../../../config/azure';
import { getGroqConfig } from '../../../config/groq';
import { AzureTranslatorAdapter } from '../../infrastructure/adapters/azure/AzureTranslatorAdapter';
import { NullTranslationAdapter } from '../../infrastructure/adapters/NullTranslationAdapter';
import { InMemoryContextRepository } from '../../infrastructure/adapters/storage/InMemoryContextRepository';

/**
 * Configuration options for the useVisionService hook
 * 
 * @public
 */
interface UseVisionServiceOptions {
  /** If true, preload vision models on component mount (recommended) */
  preload?: boolean;
}

/**
 * Return value from the useVisionService hook
 * 
 * @remarks
 * Provides a configured hybrid vision service that combines:
 * - TFLite COCO-SSD for on-device object detection (always available)
 * - Azure Computer Vision for rich scene descriptions (when internet available)
 * - Optional Azure Translator for multilingual descriptions
 * 
 * @public
 */
interface UseVisionServiceReturn {
  /** Configured vision service bridge ready for scene analysis */
  visionService: VisionService;

  /** True when vision models are loaded and ready for inference */
  isReady: boolean;

  /** Initialization error if models failed to preload */
  error?: Error;

  /** Camera adapter for direct hardware camera control if needed */
  cameraAdapter: ExpoCameraAdapter;

  /** Vision adapter (Groq or Hybrid depending on config) */
  visionAdapter: GroqVisionAdapter | HybridVisionAdapter;
}

/**
 * React hook for initializing and managing the vision service
 * 
 * Sets up a hybrid vision pipeline combining TensorFlow Lite for on-device processing
 * and optional Azure Computer Vision for enhanced descriptions. Automatically preloads
 * models on mount and provides readiness state.
 * 
 * @param options - Configuration options for vision service setup
 * @returns Vision service, readiness state, and underlying adapters
 * 
 * @remarks
 * The hybrid approach prioritizes privacy and speed:
 * - Always uses TensorFlow Lite for immediate on-device detection
 * - Optionally uses Azure CV when configured and internet available
 * - Includes translation support via Azure Translator if configured
 * 
 * @example
 * ```typescript
 * const { visionService, isReady, error } = useVisionService({
 *   preload: true,
 * });
 * 
 * if (isReady) {
 *   const analysis = await visionService.analyzeScene();
 * }
 * ```
 * 
 * @public
 */
export function useVisionService(
  options: UseVisionServiceOptions = {}
): UseVisionServiceReturn {
  const { preload = true } = options;

  // Retrieve Groq configuration (preferred for Q&A)
  const groqConfig = React.useMemo(() => {
    try {
      const config = getGroqConfig();
      console.log('[useVisionService] ✓ Groq config found (will be used for Q&A)');
      return config;
    } catch (error: any) {
      console.warn('[useVisionService] ⚠️ Groq not configured:', error.message);
      return undefined;
    }
  }, []);

  // Retrieve Azure Computer Vision configuration (memoized - configs don't change)
  const azureConfig = React.useMemo(() => {
    try {
      const config = getAzureConfig();
      console.log('[useVisionService] ✓ Azure Computer Vision config found');
      return config;
    } catch (error: any) {
      console.warn('[useVisionService] ⚠️', error.message);
      return undefined;
    }
  }, []);

  // Retrieve Azure Translator configuration (memoized)
  const translatorConfig = React.useMemo(() => {
    const config = getAzureTranslatorConfig();
    if (config) {
      console.log('[useVisionService] ✓ Azure Translator config found');
    }
    return config;
  }, []);

  // Create translation service using dependency injection pattern
  const translationService = React.useMemo(() => {
    if (translatorConfig) {
      return new AzureTranslatorAdapter(translatorConfig.apiKey, translatorConfig.region);
    }
    return new NullTranslationAdapter();
  }, [translatorConfig]);

  // Create memoized adapters - these should NEVER be recreated
  const cameraAdapter = React.useMemo(() => {
    console.log('[useVisionService] Creating ExpoCameraAdapter (should only happen once)');
    return new ExpoCameraAdapter();
  }, []);
  
  // Si hay Groq configurado, usarlo para Q&A. Sino, usar HybridVisionAdapter
  const visionAdapter = React.useMemo(() => {
    if (groqConfig) {
      console.log('[useVisionService] Creating GroqVisionAdapter for Q&A (should only happen once)');
      return new GroqVisionAdapter({
        apiKey: groqConfig.apiKey,
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: groqConfig.temperature,
        maxTokens: groqConfig.maxTokens,
      });
    }
    
    console.log('[useVisionService] Creating HybridVisionAdapter (should only happen once)');
    return new HybridVisionAdapter(azureConfig, translationService);
  }, [groqConfig, azureConfig, translationService]);
  
  // Context repository para Q&A (solo si hay Groq)
  const contextRepository = React.useMemo(() => {
    if (groqConfig) {
      console.log('[useVisionService] Creating InMemoryContextRepository for Q&A');
      return new InMemoryContextRepository();
    }
    return undefined;
  }, [groqConfig]);
  
  const visionServiceBridge = React.useMemo(() => {
    console.log('[useVisionService] Creating VisionServiceBridge (should only happen once)');
    return new VisionServiceBridge(cameraAdapter, visionAdapter, contextRepository);
  }, [cameraAdapter, visionAdapter, contextRepository]);

  // Track model loading state
  const [isReady, setIsReady] = React.useState(false);
  const [initError, setInitError] = React.useState<Error>();

  // Preload vision models on mount if configured
  React.useEffect(() => {
    if (preload && !isReady) {
      console.log('[useVisionService] Preloading models...');

      visionServiceBridge
        .warmUp()
        .then(() => {
          console.log('[useVisionService] ✓ Models preloaded successfully');
          setIsReady(true);
        })
        .catch(error => {
          console.error('[useVisionService] ✗ Failed to preload models:', error);
          setInitError(error);
        });
    }
  }, [preload, isReady, visionServiceBridge]);

  return {
    visionService: visionServiceBridge,
    isReady,
    error: initError,
    cameraAdapter,
    visionAdapter,
  };
}
