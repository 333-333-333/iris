/**
 * Camera component for photo capture
 * 
 * Provides camera hardware access for taking photos on demand.
 * The component is invisible (0 opacity) but must be mounted
 * for the camera to be available.
 * 
 * Features:
 * - Auto flash enabled for better photo quality
 * - Back camera by default
 * - No continuous preview (only captures on demand)
 * 
 * @public
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ExpoCameraAdapter } from '../../infrastructure/adapters/expo/ExpoCameraAdapter';

/**
 * Props for CameraCapture component
 * 
 * @public
 */
interface CameraCaptureProps {
  /** 
   * Camera adapter to connect with the CameraView ref.
   * This should be the same adapter used by VisionServiceBridge.
   */
  cameraAdapter: ExpoCameraAdapter;
  
  /** Callback fired when camera is ready to capture */
  onReady?: () => void;
  
  /** Use front-facing camera instead of back (default: false) */
  useFrontCamera?: boolean;
}

/**
 * Invisible camera component for photo capture
 * 
 * Mounts a CameraView that's invisible but active, allowing
 * photos to be taken on demand via the adapter.
 * 
 * @param props - Component props
 * @returns React component (invisible)
 * 
 * @example
 * ```typescript
 * const { cameraAdapter } = useVisionService();
 * 
 * <CameraCapture
 *   cameraAdapter={cameraAdapter}
 *   onReady={() => console.log('Camera ready!')}
 * />
 * ```
 * 
 * @public
 */
export const CameraCapture: React.FC<CameraCaptureProps> = ({
  cameraAdapter,
  onReady,
  useFrontCamera = false,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Request permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Connect camera ref to adapter when ready
  useEffect(() => {
    // Only connect when camera is actually ready AND we have a valid ref
    if (isCameraReady && cameraRef.current && cameraAdapter) {
      console.log('[CameraCapture] ✓ Connecting camera ref to adapter');
      cameraAdapter.setCameraRef(cameraRef.current);
      onReady?.();
    }
  }, [cameraAdapter, onReady, isCameraReady]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('[CameraCapture] Cleanup - clearing camera ref');
      cameraAdapter?.setCameraRef(null);
    };
  }, [cameraAdapter]);

  // Handle camera ready event
  const handleCameraReady = () => {
    console.log('[CameraCapture] Camera hardware ready');
    setIsCameraReady(true);
  };

  // Don't render if no permission
  if (!permission?.granted) {
    console.log('[CameraCapture] Waiting for camera permission...');
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={useFrontCamera ? 'front' : 'back'}
        flash="auto"
        onCameraReady={handleCameraReady}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // Position at bottom-right corner, mostly off-screen
    // iOS requires the camera view to be "visible" to initialize
    bottom: -150,
    right: -150,
    width: 200,
    height: 200,
    // Don't use opacity:0 - iOS may not initialize camera
  },
  camera: {
    // Camera needs reasonable size to initialize on iOS
    width: 200,
    height: 200,
  },
});
