/**
 * InMemoryContextRepository - Implementación en memoria del repositorio de contexto
 * 
 * Guarda el contexto visual en memoria (RAM).
 * 
 * Ventajas:
 * - Súper rápido (sin I/O)
 * - No requiere permisos
 * 
 * Desventajas:
 * - Se pierde al cerrar la app
 * - No persiste entre sesiones
 * 
 * Ideal para: Preguntas rápidas en la misma sesión
 */

import { IContextRepository, VisualContext } from '../../../application/ports/IContextRepository';

export class InMemoryContextRepository implements IContextRepository {
  private context: VisualContext | null = null;
  private readonly DEFAULT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos

  /**
   * Guarda el contexto en memoria
   */
  async saveContext(context: VisualContext): Promise<void> {
    console.log('[InMemoryContextRepository] Saving context:', {
      imageUri: context.imageUri,
      objects: context.detectedObjects.length,
      timestamp: context.timestamp.toISOString(),
    });
    
    this.context = context;
  }

  /**
   * Recupera el último contexto guardado
   */
  async getLastContext(): Promise<VisualContext | null> {
    if (!this.context) {
      console.log('[InMemoryContextRepository] No context stored');
      return null;
    }

    console.log('[InMemoryContextRepository] Retrieved context:', {
      imageUri: this.context.imageUri,
      age: Date.now() - this.context.timestamp.getTime(),
    });

    return this.context;
  }

  /**
   * Limpia el contexto
   */
  async clearContext(): Promise<void> {
    console.log('[InMemoryContextRepository] Clearing context');
    this.context = null;
  }

  /**
   * Verifica si el contexto es reciente
   */
  async isContextFresh(maxAgeMs: number = this.DEFAULT_MAX_AGE_MS): Promise<boolean> {
    if (!this.context) {
      return false;
    }

    const age = Date.now() - this.context.timestamp.getTime();
    const isFresh = age < maxAgeMs;

    console.log('[InMemoryContextRepository] Context freshness check:', {
      age,
      maxAge: maxAgeMs,
      isFresh,
    });

    return isFresh;
  }
}
