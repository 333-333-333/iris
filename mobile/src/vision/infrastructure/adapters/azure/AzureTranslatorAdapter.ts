/**
 * AzureTranslatorAdapter - Cliente para Azure Translator API
 * 
 * Traduce texto de inglés a español usando Azure Translator
 * Free tier: 2 millones de caracteres/mes
 * 
 * Docs: https://learn.microsoft.com/en-us/azure/ai-services/translator/reference/v3-0-translate
 */

import axios, { AxiosInstance } from 'axios';
import { ITranslationService } from '../../../application/services/TranslationService';

interface TranslationResponse {
  translations: Array<{
    text: string;
    to: string;
  }>;
}

export class AzureTranslatorAdapter implements ITranslationService {
  private httpClient: AxiosInstance;
  private apiKey: string;
  private region: string;
  private endpoint = 'https://api.cognitive.microsofttranslator.com';

  constructor(apiKey: string, region: string) {
    this.apiKey = apiKey;
    this.region = region;

    this.httpClient = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos
    });
  }

  /**
   * Traduce texto de inglés a español
   */
  async translate(text: string, from: string = 'en', to: string = 'es'): Promise<string> {
    try {
      console.log('[AzureTranslator] Translating:', text);

      const response = await this.httpClient.post<TranslationResponse[]>(
        '/translate',
        [{ text }],
        {
          params: {
            'api-version': '3.0',
            from,
            to,
          },
        }
      );

      const translated = response.data[0]?.translations[0]?.text || text;
      console.log('[AzureTranslator] Translated:', translated);

      return translated;
    } catch (error: any) {
      console.error('[AzureTranslator] Translation failed:', error);

      if (error?.response) {
        console.error('[AzureTranslator] Response status:', error.response.status);
        console.error('[AzureTranslator] Response data:', JSON.stringify(error.response.data, null, 2));
      }

      // Si falla la traducción, devolver texto original
      console.warn('[AzureTranslator] Returning original text due to error');
      return text;
    }
  }

  /**
   * Traduce múltiples textos en una sola request (más eficiente)
   */
  async translateBatch(texts: string[], from: string = 'en', to: string = 'es'): Promise<string[]> {
    try {
      console.log('[AzureTranslator] Translating batch:', texts.length, 'items');

      const response = await this.httpClient.post<TranslationResponse[]>(
        '/translate',
        texts.map(text => ({ text })),
        {
          params: {
            'api-version': '3.0',
            from,
            to,
          },
        }
      );

      return response.data.map(item => item.translations[0]?.text || '');
    } catch (error: any) {
      console.error('[AzureTranslator] Batch translation failed:', error);
      return texts; // Devolver originales si falla
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    return !!(this.apiKey && this.region);
  }
}
