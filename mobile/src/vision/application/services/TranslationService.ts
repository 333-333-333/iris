/**
 * ITranslationService - Port para servicios de traducción
 * 
 * Define el contrato para traducir texto entre idiomas.
 * Implementaciones van en la capa de infraestructura.
 * 
 * Este es un PORT (interfaz) en Clean Architecture.
 * La implementación concreta (Azure, Google, etc.) va en infrastructure/
 */

export interface ITranslationService {
  /**
   * Traduce un texto de un idioma a otro
   * @param text Texto a traducir
   * @param from Idioma origen (código ISO)
   * @param to Idioma destino (código ISO)
   * @returns Texto traducido
   */
  translate(text: string, from: string, to: string): Promise<string>;

  /**
   * Verifica si el servicio está disponible y configurado
   */
  isAvailable(): boolean;
}
