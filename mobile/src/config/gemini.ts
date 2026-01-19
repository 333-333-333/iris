/**
 * Gemini Configuration
 * 
 * Usa process.env para obtener la API key.
 * Configure: Crear archivo .env con EXPO_PUBLIC_GEMINI_API_KEY=tu-key
 */

export function getGeminiApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!key) {
    throw new Error(
      '[GeminiConfig] ✗ API key no encontrada!\n' +
      '1. Crea archivo .env en mobile/\n' +
      '2. Agrega: EXPO_PUBLIC_GEMINI_API_KEY=tu-key\n' +
      '3. Obtén tu key gratis en: https://aistudio.google.com/apikey'
    );
  }

  return key;
}

export function isValidGeminiApiKey(key: string): boolean {
  return key.startsWith('AIza') && key.length > 20;
}
