/**
 * ICameraService - Puerto para el servicio de cámara
 * 
 * Define el contrato que debe cumplir cualquier implementación de cámara.
 * Esto permite cambiar la implementación (Expo Camera, react-native-camera, etc.)
 * sin afectar la lógica de negocio.
 */

export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface CaptureOptions {
  /** Calidad de la imagen (0-1) */
  quality?: number;
  
  /** Si debe usar la cámara frontal */
  useFrontCamera?: boolean;
  
  /** Formato de salida */
  format?: 'base64' | 'uri';
  
  /** Ancho máximo de la imagen */
  maxWidth?: number;
  
  /** Alto máximo de la imagen */
  maxHeight?: number;
}

export interface CapturedImage {
  /** URI de la imagen capturada */
  uri: string;
  
  /** Imagen en base64 (si se solicitó) */
  base64?: string;
  
  /** Ancho de la imagen */
  width: number;
  
  /** Alto de la imagen */
  height: number;
  
  /** Tamaño del archivo en bytes */
  size?: number;
}

export interface ICameraService {
  /**
   * Verifica si la app tiene permisos de cámara
   */
  hasPermission(): Promise<boolean>;

  /**
   * Solicita permisos de cámara al usuario
   */
  requestPermissions(): Promise<CameraPermissionStatus>;

  /**
   * Captura una foto y retorna su URI o base64
   */
  capturePhoto(options?: CaptureOptions): Promise<CapturedImage>;

  /**
   * Verifica si el dispositivo tiene cámara disponible
   */
  isCameraAvailable(): Promise<boolean>;

  /**
   * Limpia recursos temporales (archivos de caché, etc.)
   */
  cleanup(): Promise<void>;
}
