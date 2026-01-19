/**
 * Camera service port defining the hardware abstraction layer
 * 
 * This port defines the contract for any camera implementation.
 * Allows switching implementations (Expo Camera, react-native-camera, etc.)
 * without affecting business logic.
 */

/**
 * Status of camera permissions on the device
 * 
 * @public
 */
export interface CameraPermissionStatus {
  /** True if app has camera permission */
  granted: boolean;
  /** True if user can be prompted again for permission */
  canAskAgain: boolean;
  /** Current permission status state */
  status: 'granted' | 'denied' | 'undetermined';
}

/**
 * Configuration options for capturing a photo
 * 
 * @public
 */
export interface CaptureOptions {
  /** Image quality from 0 (lowest) to 1 (highest, default: 0.9) */
  quality?: number;
  
  /** Use front-facing camera instead of back camera (default: false) */
  useFrontCamera?: boolean;
  
  /** Output format for the image (default: 'uri') */
  format?: 'base64' | 'uri';
  
  /** Maximum width for the captured image in pixels */
  maxWidth?: number;
  
  /** Maximum height for the captured image in pixels */
  maxHeight?: number;
}

/**
 * Metadata and data for a captured photo
 * 
 * @public
 */
export interface CapturedImage {
  /** File URI or path to the captured image */
  uri: string;
  
  /** Base64-encoded image data if format: 'base64' was requested */
  base64?: string;
  
  /** Width of the captured image in pixels */
  width: number;
  
  /** Height of the captured image in pixels */
  height: number;
  
  /** Size of the image file in bytes */
  size?: number;
}

/**
 * Camera service port for hardware abstraction
 * 
 * Defines the interface that all camera implementations must follow.
 * Implementations may use Expo Camera, react-native-camera, or other providers.
 * 
 * @remarks
 * This is a port in Clean Architecture terms - an interface defining
 * how business logic interacts with external camera hardware.
 * 
 * @public
 */
export interface ICameraService {
  /**
   * Checks if the app currently has camera permission
   * 
   * @returns Promise resolving to true if permission is granted
   * @throws {Error} If permission status cannot be determined
   */
  hasPermission(): Promise<boolean>;

  /**
   * Requests camera permission from the user
   * 
   * Shows the system permission dialog if permission is not yet determined.
   * 
   * @returns Promise resolving to the permission status after request
   * 
   * @remarks
   * On iOS, this shows the system permission prompt once.
   * On Android, it may show multiple times if user denies.
   * 
   * @example
   * ```typescript
   * const status = await cameraService.requestPermissions();
   * if (status.granted) {
   *   const image = await cameraService.capturePhoto();
   * }
   * ```
   */
  requestPermissions(): Promise<CameraPermissionStatus>;

  /**
   * Captures a photo from the device camera
   * 
   * Returns image metadata and data in the requested format (URI or Base64).
   * 
   * @param options - Configuration for photo capture
   * @returns Promise resolving to captured image metadata and data
   * @throws {Error} If camera is not available or permission denied
   * @throws {Error} If capture fails or user cancels photo picker
   * 
   * @remarks
   * Requires camera permission to be granted beforehand.
   * Base64 encoding may impact performance for large images.
   * 
   * @example
   * ```typescript
   * const image = await cameraService.capturePhoto({
   *   quality: 0.8,
   *   maxWidth: 1024,
   *   format: 'uri',
   * });
   * console.log(`Captured ${image.width}x${image.height} image`);
   * ```
   */
  capturePhoto(options?: CaptureOptions): Promise<CapturedImage>;

  /**
   * Checks if the device has a camera available
   * 
   * Returns false if device lacks camera hardware (rare on modern phones).
   * 
   * @returns Promise resolving to true if camera hardware is available
   * 
   * @remarks
   * This is different from hasPermission() - it checks hardware availability,
   * not permission status.
   */
  isCameraAvailable(): Promise<boolean>;

  /**
   * Cleans up temporary resources used by the camera service
   * 
   * Removes cached image files and releases temporary memory.
   * Call this before app shutdown or when camera use is complete.
   * 
   * @returns Promise that resolves when cleanup is complete
   * 
   * @remarks
   * Safe to call multiple times. Does not affect camera permission state.
   */
  cleanup(): Promise<void>;
}
