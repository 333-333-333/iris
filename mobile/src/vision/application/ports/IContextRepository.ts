/**
 * IContextRepository - Puerto para almacenar contexto visual
 * 
 * Permite guardar y recuperar el contexto de la última imagen analizada
 * para poder responder preguntas sobre ella sin re-capturar.
 * 
 * Implementaciones:
 * - InMemoryContextRepository (rápido, volátil)
 * - AsyncStorageContextRepository (persistente, más lento)
 */

import { DetectedObject } from '../../domain/entities/DetectedObject';

/**
 * Contexto visual de una imagen analizada
 */
export interface VisualContext {
  /** URI de la imagen capturada */
  imageUri: string;
  
  /** Objetos detectados en la imagen */
  detectedObjects: DetectedObject[];
  
  /** Descripción natural generada */
  sceneDescription: string;
  
  /** Momento en que se capturó */
  timestamp: Date;
  
  /** Confianza promedio de las detecciones */
  confidence: number;
}

/**
 * Repositorio para almacenar y recuperar contexto visual
 */
export interface IContextRepository {
  /**
   * Guarda el contexto de la última imagen analizada
   * 
   * @param context - Contexto visual a guardar
   */
  saveContext(context: VisualContext): Promise<void>;
  
  /**
   * Recupera el último contexto guardado
   * 
   * @returns Contexto visual o null si no hay ninguno
   */
  getLastContext(): Promise<VisualContext | null>;
  
  /**
   * Limpia el contexto guardado
   */
  clearContext(): Promise<void>;
  
  /**
   * Verifica si el contexto está "fresco" (no expirado)
   * 
   * @param maxAgeMs - Edad máxima en milisegundos (default: 5 minutos)
   * @returns true si el contexto es reciente
   */
  isContextFresh(maxAgeMs?: number): Promise<boolean>;
}
