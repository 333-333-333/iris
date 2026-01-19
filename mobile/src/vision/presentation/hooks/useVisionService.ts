/**
 * useVisionService - Hook para acceder al servicio de visión
 * 
 * Proporciona una instancia configurada del servicio de visión
 * con cámara y modelos TFLite listos para usar.
 */

import React from 'react';
import { ExpoCameraAdapter } from '../../infrastructure/adapters/expo/ExpoCameraAdapter';
import { TFLiteVisionAdapter } from '../../infrastructure/adapters/tflite/TFLiteVisionAdapter';
import { VisionServiceBridge } from '../../infrastructure/adapters/voice/VisionServiceBridge';
import { VisionService } from '../../../voice/application/ports/VisionService';

interface UseVisionServiceOptions {
  /** Si debe pre-cargar modelos al montar (recomendado) */
  preload?: boolean;
}

interface UseVisionServiceReturn {
  /** Servicio de visión listo para usar */
  visionService: VisionService;
  
  /** Si los modelos están cargados */
  isReady: boolean;
  
  /** Adaptador de cámara (por si necesitas configurarlo manualmente) */
  cameraAdapter: ExpoCameraAdapter;
}

export function useVisionService(
  options: UseVisionServiceOptions = {}
): UseVisionServiceReturn {
  const { preload = true } = options;

  // Crear adaptadores (memoizados para no recrear en cada render)
  const cameraAdapter = React.useMemo(() => new ExpoCameraAdapter(), []);
  const tfliteAdapter = React.useMemo(() => new TFLiteVisionAdapter(), []);
  const visionServiceBridge = React.useMemo(
    () => new VisionServiceBridge(cameraAdapter, tfliteAdapter),
    [cameraAdapter, tfliteAdapter]
  );

  // Estado de carga
  const [isReady, setIsReady] = React.useState(false);

  // Pre-cargar modelos al montar
  React.useEffect(() => {
    if (preload && !isReady) {
      console.log('[useVisionService] Preloading models...');
      
      visionServiceBridge
        .warmUp()
        .then(() => {
          console.log('[useVisionService] Models preloaded successfully');
          setIsReady(true);
        })
        .catch(error => {
          console.error('[useVisionService] Failed to preload models:', error);
          // No marcamos isReady=true, pero el servicio seguirá intentando cargar bajo demanda
        });
    }
  }, [preload, isReady, visionServiceBridge]);

  return {
    visionService: visionServiceBridge,
    isReady,
    cameraAdapter,
  };
}
