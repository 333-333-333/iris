/**
 * Groq Configuration
 * 
 * Usa process.env para obtener la API key de Groq.
 * Configure: Crear archivo .env con EXPO_PUBLIC_GROQ_API_KEY=tu-key
 * 
 * Groq ofrece Llama 4 Vision con:
 * - Latencia ultra-baja (~200-400ms)
 * - Free tier generoso (14,400 requests/día)
 * - Soporte multimodal (texto + imágenes)
 */

export interface GroqConfig {
  apiKey: string;
  /** Modelo de visión a usar (default: llama-4-scout) */
  visionModel?: 'llama-4-scout' | 'llama-4-maverick';
  /** Temperatura para generación (0-2, default: 0.7) */
  temperature?: number;
  /** Máximo de tokens en la respuesta (default: 1024) */
  maxTokens?: number;
}

export function getGroqApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!key) {
    throw new Error(
      '[GroqConfig] ✗ API key no encontrada!\n' +
      '1. Crea archivo .env en mobile/\n' +
      '2. Agrega: EXPO_PUBLIC_GROQ_API_KEY=tu-key\n' +
      '3. Obtén tu key gratis en: https://console.groq.com/keys\n' +
      '4. Free tier: 14,400 requests/día con Llama 4 Vision'
    );
  }

  return key;
}

export function getGroqConfig(): GroqConfig {
  return {
    apiKey: getGroqApiKey(),
    visionModel: 'llama-4-scout',  // Más rápido y preciso
    temperature: 0.2,  // Muy bajo para respuestas rápidas y determinísticas
    maxTokens: 100,    // Respuestas MUY concisas (1-2 oraciones)
  };
}

export function isValidGroqApiKey(key: string): boolean {
  // Groq API keys empiezan con "gsk_"
  return key.startsWith('gsk_') && key.length > 20;
}

/**
 * Límites del free tier de Groq
 */
export const GROQ_FREE_LIMITS = {
  requestsPerDay: 14400,
  requestsPerMinute: 30,
  tokensPerMinute: 14400,
  imagesPerRequest: 5,
  maxImageSize: '20MB',
  maxImageResolution: '33MP',  // 33 megapixels
};
