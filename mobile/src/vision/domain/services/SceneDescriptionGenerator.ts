/**
 * SceneDescriptionGenerator - Convierte detecciones en descripciones naturales
 * 
 * Servicio de dominio que transforma datos técnicos (objetos detectados, bounding boxes)
 * en frases naturales en español para que el TTS las lea.
 * 
 * Ejemplos:
 * - Input: [person, person, chair]
 * - Output: "Veo 2 personas y una silla"
 */

import {
  DetectedObject,
  ObjectPosition,
  ObjectSize,
} from '../entities/DetectedObject';
import {
  groupObjectsByLabel,
  sortByConfidence,
} from '../entities/SceneDescription';
import {
  pluralizeLabel,
  getIndefiniteArticle,
} from '../value-objects/LabelTranslations';

export interface SceneContext {
  objects: DetectedObject[];
  sceneType?: string;
  sceneTypeEs?: string;
}

export class SceneDescriptionGenerator {
  /**
   * Genera una descripción natural de la escena
   */
  static generate(context: SceneContext): string {
    const { objects, sceneTypeEs } = context;

    // Caso 1: No hay objetos
    if (objects.length === 0) {
      return 'No detecto ningún objeto en la escena';
    }

    // Caso 2: Solo un objeto
    if (objects.length === 1) {
      return this.describeSingleObject(objects[0], sceneTypeEs);
    }

    // Caso 3: Múltiples objetos
    return this.describeMultipleObjects(objects, sceneTypeEs);
  }

  /**
   * Describe un solo objeto
   */
  private static describeSingleObject(
    obj: DetectedObject,
    sceneType?: string
  ): string {
    const article = getIndefiniteArticle(obj.labelEs);
    let description = `Veo ${article} ${obj.labelEs}`;

    // Agregar tamaño si es relevante
    if (obj.size === 'large') {
      description += ' grande';
    }

    // Agregar posición
    const positionDesc = this.describePosition(obj.position);
    if (positionDesc) {
      description += ` ${positionDesc}`;
    }

    // Agregar contexto de escena
    if (sceneType) {
      description += `, parece ser ${sceneType}`;
    }

    return description;
  }

  /**
   * Describe múltiples objetos
   */
  private static describeMultipleObjects(
    objects: DetectedObject[],
    sceneType?: string
  ): string {
    // Filtrar por confianza alta (>70%)
    const highConfidence = objects.filter(obj => obj.confidence > 0.7);
    const objectsToDescribe = highConfidence.length > 0 ? highConfidence : objects;

    // Ordenar por confianza
    const sorted = sortByConfidence(objectsToDescribe);

    // Agrupar por tipo
    const grouped = groupObjectsByLabel(sorted);

    // Construir descripción
    let description = 'Veo ';

    const parts: string[] = [];
    
    grouped.forEach((group, labelEs) => {
      const count = group.length;
      
      if (count === 1) {
        const article = getIndefiniteArticle(labelEs);
        parts.push(`${article} ${labelEs}`);
      } else {
        const plural = pluralizeLabel(labelEs);
        parts.push(`${count} ${plural}`);
      }
    });

    // Unir con comas y "y"
    description += this.joinWithCommas(parts);

    // Agregar detalles de posición para objetos principales
    const mainObject = sorted[0];
    const positionDesc = this.describePosition(mainObject.position);
    if (positionDesc && sorted.length <= 3) {
      description += `, ${mainObject.labelEs} ${positionDesc}`;
    }

    // Agregar contexto de escena
    if (sceneType) {
      description += `. Parece ser ${sceneType}`;
    }

    return description;
  }

  /**
   * Describe la posición de un objeto
   */
  private static describePosition(position: ObjectPosition): string {
    const positionMap: Record<ObjectPosition, string> = {
      'center': 'en el centro',
      'left': 'a la izquierda',
      'right': 'a la derecha',
      'top': 'arriba',
      'bottom': 'abajo',
      'top-left': 'arriba a la izquierda',
      'top-right': 'arriba a la derecha',
      'bottom-left': 'abajo a la izquierda',
      'bottom-right': 'abajo a la derecha',
    };

    return positionMap[position] || '';
  }

  /**
   * Une elementos con comas y "y" para el último
   */
  private static joinWithCommas(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} y ${items[1]}`;

    const allButLast = items.slice(0, -1).join(', ');
    const last = items[items.length - 1];
    return `${allButLast} y ${last}`;
  }

  /**
   * Genera una descripción corta (para notificaciones)
   */
  static generateShort(objects: DetectedObject[]): string {
    if (objects.length === 0) return 'Sin objetos';
    if (objects.length === 1) return objects[0].labelEs;

    const grouped = groupObjectsByLabel(objects);
    const labels = Array.from(grouped.keys());
    
    if (labels.length === 1) {
      return `${objects.length} ${pluralizeLabel(labels[0])}`;
    }

    return `${labels.length} tipos de objetos`;
  }

  /**
   * Genera una lista detallada para debug
   */
  static generateDetailed(objects: DetectedObject[]): string {
    const sorted = sortByConfidence(objects);
    
    const lines = sorted.map(obj => {
      const confidence = Math.round(obj.confidence * 100);
      const position = this.describePosition(obj.position);
      return `• ${obj.labelEs} (${confidence}%) ${position}`;
    });

    return lines.join('\n');
  }
}
