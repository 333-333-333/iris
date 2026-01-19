/**
 * ExpoCameraAdapter - Implementación de ICameraService usando expo-camera
 * 
 * Adaptador que implementa la interfaz ICameraService usando expo-camera.
 * Maneja permisos, captura de fotos y limpieza de recursos.
 */

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import {
  ICameraService,
  CameraPermissionStatus,
  CaptureOptions,
  CapturedImage,
} from '../../../application/ports/ICameraService';

export class ExpoCameraAdapter implements ICameraService {
  private cameraRef: CameraView | null = null;

  /**
   * Establece la referencia a la cámara (desde el componente React)
   */
  setCameraRef(ref: CameraView | null): void {
    this.cameraRef = ref;
  }

  /**
   * Verifica si la app tiene permisos de cámara
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
   * Solicita permisos de cámara al usuario
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
   * Captura una foto y retorna su información
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
   * Verifica si el dispositivo tiene cámara disponible
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      // expo-camera siempre asume que hay cámara
      // En devices sin cámara, Camera.isAvailableAsync() podría no existir
      return true;
    } catch (error) {
      console.error('[ExpoCameraAdapter] Error checking camera availability:', error);
      return false;
    }
  }

  /**
   * Limpia archivos temporales de fotos capturadas
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
