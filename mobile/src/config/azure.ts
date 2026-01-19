/**
 * Azure Services Configuration
 * 
 * Usa process.env para obtener las credenciales de Azure Computer Vision y Translator.
 * Configure: Crear archivo .env con:
 * - EXPO_PUBLIC_AZURE_CV_API_KEY=tu-key
 * - EXPO_PUBLIC_AZURE_CV_ENDPOINT=https://tu-recurso.cognitiveservices.azure.com
 * - EXPO_PUBLIC_AZURE_TRANSLATOR_API_KEY=tu-translator-key (opcional)
 * - EXPO_PUBLIC_AZURE_TRANSLATOR_REGION=eastus (opcional)
 */

export interface AzureConfig {
  apiKey: string;
  endpoint: string;
}

export interface AzureTranslatorConfig {
  apiKey: string;
  region: string;
}

export function getAzureConfig(): AzureConfig {
  const apiKey = process.env.EXPO_PUBLIC_AZURE_CV_API_KEY;
  const endpoint = process.env.EXPO_PUBLIC_AZURE_CV_ENDPOINT;
  const translatorApiKey = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_API_KEY;
  const translatorRegion = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_REGION;

  if (!apiKey) {
    throw new Error(
      '[AzureConfig] ✗ API key no encontrada!\n' +
      '1. Crea archivo .env en mobile/\n' +
      '2. Agrega: EXPO_PUBLIC_AZURE_CV_API_KEY=tu-key\n' +
      '3. Obtén tu key en: https://portal.azure.com\n' +
      '4. Necesitas crear un recurso "Computer Vision" (no OpenAI)'
    );
  }

  if (!endpoint) {
    throw new Error(
      '[AzureConfig] ✗ Endpoint no encontrado!\n' +
      '1. Agrega en .env: EXPO_PUBLIC_AZURE_CV_ENDPOINT=https://tu-recurso.cognitiveservices.azure.com\n' +
      '2. Encuentra tu endpoint en Azure Portal -> Computer Vision -> Keys and Endpoint'
    );
  }

  return {
    apiKey,
    endpoint,
  };
}

export function getAzureTranslatorConfig(): AzureTranslatorConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_API_KEY;
  const region = process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_REGION;

  if (!apiKey || !region) {
    console.log('[AzureConfig] ⚠️ Azure Translator not configured - descriptions will be in English');
    return null;
  }

  console.log('[AzureConfig] ✓ Azure Translator configured');
  return { apiKey, region };
}

export function isValidAzureConfig(config: Partial<AzureConfig>): boolean {
  return !!(
    config.apiKey && 
    config.apiKey.length > 20 &&
    config.endpoint && 
    config.endpoint.startsWith('https://')
  );
}
