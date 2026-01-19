/**
 * Invisible camera capture component
 * 
 * Manages an active camera instance without displaying preview.
 * Keeps camera ready for rapid photo capture when needed.
 * 
 * @remarks
 * For visually impaired users, no camera preview is shown.
 * Only the capture and analysis flow is needed.
 * 
 * Component is rendered with 1x1 pixel size and 0 opacity to keep it
 * invisible while maintaining camera hardware access.
 * 
 * @public
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { ExpoCameraAdapter } from '../../infrastructure/adapters/expo/ExpoCameraAdapter';

/**
 * Props for CameraCapture component
 * 
 * @public
 */
interface CameraCaptureProps {
  /** Callback fired when camera adapter is ready to use */
  onAdapterReady?: (adapter: ExpoCameraAdapter) => void;
  
  /** Use front-facing camera instead of back (default: false) */
  useFrontCamera?: boolean;
}

/**
 * Invisible camera component maintaining camera hardware access
 * 
 * Captures the camera reference and provides adapter for photo capture.
 * Component is hidden (1x1 pixel, 0 opacity) but keeps camera active.
 * 
 * @param props - Component props
 * @returns React component (invisible)
 * 
 * @example
 * ```typescript
 * <CameraCapture
 *   useFrontCamera={false}
 *   onAdapterReady={(adapter) => {
 *     // Store adapter for later use
 *     setCameraAdapter(adapter);
 *   }}
 * />
 * ```
 * 
 * @public
 */
export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onAdapterReady,
  useFrontCamera = false,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const adapterRef = useRef<ExpoCameraAdapter>(new ExpoCameraAdapter());

  useEffect(() => {
    // Configurar el adapter con la referencia a la cámara
    if (cameraRef.current) {
      adapterRef.current.setCameraRef(cameraRef.current);
      
      // Notificar que el adapter está listo
      onAdapterReady?.(adapterRef.current);
    }
  }, [onAdapterReady]);

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={useFrontCamera ? 'front' : 'back'}
        // Mantener la cámara preparada pero oculta
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  camera: {
    width: 1,
    height: 1,
  },
});
