/**
 * NullTranslationAdapter - Implementación nula del servicio de traducción
 * 
 * Usa el patrón Null Object para evitar chequeos de null en el código.
 * Cuando no hay traductor configurado, esta implementación simplemente
 * retorna el texto original sin traducir.
 */

import { ITranslationService } from '../../application/services/TranslationService';

export class NullTranslationAdapter implements ITranslationService {
  async translate(text: string): Promise<string> {
    console.log('[NullTranslationAdapter] No translator configured, returning original text');
    return text;
  }

  isAvailable(): boolean {
    return false;
  }
}
