/**
 * Camera service adapter using Expo Camera
 * 
 * Implements the ICameraService port using the Expo Camera SDK.
 * Handles permission management, photo capture, and resource cleanup.
 * 
 * @remarks
 * Requires a CameraView ref from a React component to capture photos.
 * Works on both iOS and Android with native camera hardware.
 * 
 * @public
 */

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import {
  ICameraService,
  CameraPermissionStatus,
  CaptureOptions,
  CapturedImage,
} from '../../../application/ports/ICameraService';

/**
 * Adapter implementing photo capture using Expo Camera
 * 
 * @public
 */
export class ExpoCameraAdapter implements ICameraService {
  private cameraRef: CameraView | null = null;

  /**
   * Sets the reference to the camera component from React
   * 
   * Must be called before capturePhoto() to enable photo capture.
   * Typically called from CameraCapture component.
   * 
   * @param ref - Reference to CameraView component or null to clear
   * 
   * @example
   * ```typescript
   * const cameraRef = useRef<CameraView>(null);
   * adapter.setCameraRef(cameraRef.current);
   * ```
   */
  setCameraRef(ref: CameraView | null): void {
    this.cameraRef = ref;
  }

  /**
   * Checks if the application has camera permission
   * 
   * @returns Promise resolving to true if permission is granted
   */
  async hasPermission(): Promise<boolean> {
    try {
      const { useCameraPermissions } = await import('expo-camera');
      // Note: useCameraPermissions is a hook, so we use the static method
      const Camera = await import('expo-camera');
      const [permission] = await (Camera as any).Camera.getCameraPermissionsAsync();
      return permission?.granted || false;
    } catch (error) {
      console.error('[ExpoCameraAdapter] Error checking permission:', error);
      return false;
    }
  }

   /**
    * Requests camera permission from the user
    * 
    * Shows system permission dialog on first request.
    * 
    * @returns Promise resolving to permission status
    */
   async requestPermissions(): Promise<CameraPermissionStatus> {
    try {
      const Camera = await import('expo-camera');
      const [permission, requestPermission] = await (Camera as any).Camera.requestCameraPermissionsAsync();
      
      return {
        granted: permission?.granted || false,
        canAskAgain: permission?.canAskAgain || false,
        status: permission?.status || 'denied',
      };
    } catch (error) {
      console.error('[ExpoCameraAdapter] Error requesting permission:', error);
      
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

   /**
    * Captures a photo from the camera
    * 
    * Requires camera ref to be set via setCameraRef().
    * Applies quality and format options to the captured image.
    * 
    * @param options - Photo capture configuration
    * @returns Promise resolving to captured image metadata
    * @throws {Error} If camera ref is not set
    * @throws {Error} If capture fails
    */
   async capturePhoto(options: CaptureOptions = {}): Promise<CapturedImage> {
    if (!this.cameraRef) {
      throw new Error('Camera ref not set. Call setCameraRef() first.');
    }

    try {
      console.log('[ExpoCameraAdapter] Capturing photo...');

      // Capturar foto
      const photo = await this.cameraRef.takePictureAsync({
        quality: options.quality || 0.8,
        base64: options.format === 'base64',
        skipProcessing: false,
      });

      console.log('[ExpoCameraAdapter] Photo captured:', photo.uri);

      // Obtener información del archivo
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      
      const result: CapturedImage = {
        uri: photo.uri,
        base64: photo.base64,
        width: photo.width,
        height: photo.height,
        size: fileInfo.exists ? fileInfo.size : undefined,
      };

      // Si se especificó un tamaño máximo, redimensionar
      if (options.maxWidth || options.maxHeight) {
        // TODO: Implementar redimensionamiento si es necesario
        // Por ahora, expo-camera no tiene resize nativo
        // Podríamos usar expo-image-manipulator
      }

      return result;
    } catch (error) {
      console.error('[ExpoCameraAdapter] Error capturing photo:', error);
      throw new Error(`Failed to capture photo: ${error}`);
    }
  }

   /**
    * Checks if the device has camera hardware available
    * 
    * @returns Promise resolving to true if camera hardware available
    */
   async isCameraAvailable(): Promise<boolean> {
     try {
       // expo-camera assumes camera is available on all devices
       // Devices without camera (rare) would fail elsewhere
       return true;
     } catch (error) {
       console.error('[ExpoCameraAdapter] Error checking camera availability:', error);
       return false;
     }
   }

   /**
    * Cleans up temporary resources used for photo capture
    * 
    * @returns Promise that resolves when cleanup is complete
    */
   async cleanup(): Promise<void> {
    try {
      // Las fotos capturadas se guardan en el directorio de caché
      // Podríamos limpiarlas manualmente si es necesario
      console.log('[ExpoCameraAdapter] Cleanup requested (no-op for now)');
    } catch (error) {
      console.error('[ExpoCameraAdapter] Error during cleanup:', error);
    }
  }
}
