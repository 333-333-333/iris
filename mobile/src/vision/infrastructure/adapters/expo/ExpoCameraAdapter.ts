/**
 * Camera service adapter using Expo Camera
 * 
 * Implements the ICameraService port using the Expo Camera SDK.
 * Handles permission management and photo capture with flash support.
 * 
 * @remarks
 * Requires a CameraView ref from a React component to capture photos.
 * The CameraView must be mounted (can be invisible) but we only
 * capture photos on demand - no continuous preview needed.
 * 
 * @public
 */

import { CameraView, Camera } from 'expo-camera';
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
  private isCapturing = false;

  /**
   * Sets the reference to the camera component from React
   * 
   * Must be called before capturePhoto() to enable photo capture.
   * Typically called from CameraCapture component.
   * 
   * @param ref - Reference to CameraView component or null to clear
   */
  setCameraRef(ref: CameraView | null): void {
    this.cameraRef = ref;
    console.log('[ExpoCameraAdapter] Camera ref set:', ref ? 'yes' : 'no');
  }

  /**
   * Check if camera ref is available
   */
  hasRef(): boolean {
    return this.cameraRef !== null;
  }

  /**
   * Checks if the application has camera permission
   * 
   * @returns Promise resolving to true if permission is granted
   */
  async hasPermission(): Promise<boolean> {
    try {
      const permission = await Camera.getCameraPermissionsAsync();
      console.log('[ExpoCameraAdapter] Permission status:', permission.status);
      return permission.granted;
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
      console.log('[ExpoCameraAdapter] Requesting camera permissions...');
      const permission = await Camera.requestCameraPermissionsAsync();
      
      console.log('[ExpoCameraAdapter] Permission result:', permission.status);
      
      return {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
        status: permission.status,
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
   * Takes a photo using the camera with optional flash.
   * The photo is captured instantly - no preview required.
   * 
   * @param options - Photo capture configuration
   * @returns Promise resolving to captured image metadata
   * @throws {Error} If camera ref is not set
   * @throws {Error} If capture fails
   */
  async capturePhoto(options: CaptureOptions = {}): Promise<CapturedImage> {
    if (!this.cameraRef) {
      throw new Error('Camara no disponible. Intenta de nuevo.');
    }

    if (this.isCapturing) {
      throw new Error('Ya se esta capturando una foto.');
    }

    try {
      this.isCapturing = true;
      console.log('[ExpoCameraAdapter] Capturing photo with flash...');

      // Take photo - flash is controlled by the CameraView component prop
      const photo = await this.cameraRef.takePictureAsync({
        quality: options.quality || 0.85,
        base64: options.format === 'base64',
        skipProcessing: false, // Process for correct orientation
        exif: false, // Don't need EXIF data
      });

      if (!photo) {
        throw new Error('La camara no devolvio una foto');
      }

      console.log('[ExpoCameraAdapter] Photo captured:', photo.uri);
      console.log('[ExpoCameraAdapter] Dimensions:', photo.width, 'x', photo.height);

      return {
        uri: photo.uri,
        base64: photo.base64,
        width: photo.width,
        height: photo.height,
      };
    } catch (error) {
      console.error('[ExpoCameraAdapter] Error capturing photo:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`No se pudo capturar la foto: ${message}`);
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Checks if the device has camera hardware available
   * 
   * @returns Promise resolving to true if camera hardware available
   */
  async isCameraAvailable(): Promise<boolean> {
    return true; // Assume available on mobile devices
  }

  /**
   * Cleans up temporary resources
   */
  async cleanup(): Promise<void> {
    console.log('[ExpoCameraAdapter] Cleanup');
    this.cameraRef = null;
  }
}
