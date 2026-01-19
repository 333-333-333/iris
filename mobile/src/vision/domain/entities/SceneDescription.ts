/**
 * SceneDescription - Entidad principal que describe una escena completa
 * 
 * Agrega toda la información extraída de una imagen:
 * - Objetos detectados
 * - Tipo de escena (opcional)
 * - Descripción en lenguaje natural
 */

import { DetectedObject } from './DetectedObject';

export interface SceneDescription {
  /** Lista de objetos detectados en la escena */
  objects: DetectedObject[];
  
  /** Tipo de escena detectado (ej: "kitchen", "living_room") */
  sceneType?: string;
  
  /** Tipo de escena en español */
  sceneTypeEs?: string;
  
  /** Colores dominantes en la escena (opcional) */
  dominantColors?: string[];
  
  /** Momento en que se capturó la descripción */
  timestamp: Date;
  
  /** Confianza promedio de las detecciones (0-1) */
  confidence: number;
  
  /** Descripción en lenguaje natural (español) */
  naturalDescription: string;
  
  /** URI de la imagen analizada (opcional) */
  imageUri?: string;
}

/**
 * Calcula la confianza promedio de un conjunto de objetos
 */
export function calculateAverageConfidence(objects: DetectedObject[]): number {
  if (objects.length === 0) return 0;
  
  const sum = objects.reduce((acc, obj) => acc + obj.confidence, 0);
  return sum / objects.length;
}

/**
 * Filtra objetos por confianza mínima
 */
export function filterByConfidence(
  objects: DetectedObject[],
  minConfidence: number = 0.5
): DetectedObject[] {
  return objects.filter(obj => obj.confidence >= minConfidence);
}

/**
 * Agrupa objetos por tipo
 */
export function groupObjectsByLabel(objects: DetectedObject[]): Map<string, DetectedObject[]> {
  const groups = new Map<string, DetectedObject[]>();
  
  objects.forEach(obj => {
    const existing = groups.get(obj.labelEs) || [];
    groups.set(obj.labelEs, [...existing, obj]);
  });
  
  return groups;
}

/**
 * Ordena objetos por confianza (mayor a menor)
 */
export function sortByConfidence(objects: DetectedObject[]): DetectedObject[] {
  return [...objects].sort((a, b) => b.confidence - a.confidence);
}
