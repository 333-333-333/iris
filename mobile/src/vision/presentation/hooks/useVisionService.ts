import React from 'react';
import { ExpoCameraAdapter } from '../../infrastructure/adapters/expo/ExpoCameraAdapter';
import { HybridVisionAdapter } from '../../infrastructure/adapters/hybrid/HybridVisionAdapter';
import { VisionServiceBridge } from '../../infrastructure/adapters/voice/VisionServiceBridge';
import { VisionService } from '../../../voice/application/ports/VisionService';
import { getAzureConfig, getAzureTranslatorConfig } from '../../../config/azure';
import { AzureTranslatorAdapter } from '../../infrastructure/adapters/azure/AzureTranslatorAdapter';
import { NullTranslationAdapter } from '../../infrastructure/adapters/NullTranslationAdapter';

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

  /** Hybrid vision adapter combining TFLite and cloud services */
  visionAdapter: HybridVisionAdapter;
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

  // Retrieve Azure Computer Vision configuration
  let azureConfig: { apiKey: string; endpoint: string } | undefined;
  try {
    azureConfig = getAzureConfig();
    console.log('[useVisionService] ✓ Azure Computer Vision config found');
  } catch (error: any) {
    console.warn('[useVisionService] ⚠️', error.message);
  }

  // Retrieve Azure Translator configuration (optional)
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

  // Create memoized adapters to prevent recreation on every render
  const cameraAdapter = React.useMemo(() => new ExpoCameraAdapter(), []);
  const visionAdapter = React.useMemo(
    () => new HybridVisionAdapter(azureConfig, translationService),
    [azureConfig, translationService]
  );
  const visionServiceBridge = React.useMemo(
    () => new VisionServiceBridge(cameraAdapter, visionAdapter),
    [cameraAdapter, visionAdapter]
  );

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
