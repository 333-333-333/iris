/**
 * DetectedObject - Entidad que representa un objeto detectado en una imagen
 * 
 * Parte del Domain Layer - Lógica de negocio pura sin dependencias externas
 */

export interface BoundingBox {
  x: number;      // Posición X (0-1, normalizado)
  y: number;      // Posición Y (0-1, normalizado)
  width: number;  // Ancho (0-1, normalizado)
  height: number; // Alto (0-1, normalizado)
}

export type ObjectPosition = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type ObjectSize = 'large' | 'medium' | 'small';

export interface DetectedObject {
  /** Etiqueta en inglés (original del modelo) */
  label: string;
  
  /** Etiqueta traducida al español */
  labelEs: string;
  
  /** Confianza de la detección (0-1) */
  confidence: number;
  
  /** Caja delimitadora del objeto */
  boundingBox: BoundingBox;
  
  /** Posición relativa en la imagen */
  position: ObjectPosition;
  
  /** Tamaño relativo del objeto */
  size: ObjectSize;
}

/**
 * Calcula la posición relativa de un objeto en la imagen
 */
export function calculateObjectPosition(box: BoundingBox): ObjectPosition {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Dividir imagen en 9 regiones (3x3)
  const isLeft = centerX < 0.33;
  const isRight = centerX > 0.66;
  const isTop = centerY < 0.33;
  const isBottom = centerY > 0.66;
  const isCenter = !isLeft && !isRight && !isTop && !isBottom;

  if (isCenter) return 'center';
  if (isTop && isLeft) return 'top-left';
  if (isTop && isRight) return 'top-right';
  if (isBottom && isLeft) return 'bottom-left';
  if (isBottom && isRight) return 'bottom-right';
  if (isTop) return 'top';
  if (isBottom) return 'bottom';
  if (isLeft) return 'left';
  if (isRight) return 'right';

  return 'center';
}

/**
 * Calcula el tamaño relativo de un objeto
 */
export function calculateObjectSize(box: BoundingBox): ObjectSize {
  const area = box.width * box.height;

  if (area > 0.3) return 'large';   // Ocupa >30% de la imagen
  if (area > 0.1) return 'medium';  // Ocupa 10-30%
  return 'small';                    // Ocupa <10%
}
