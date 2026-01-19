import * as Speech from 'expo-speech';
import { SpeechSynthesizer } from '../../../application/ports/SpeechSynthesizer';

// In-memory repository for last description
class InMemoryDescriptionRepository {
  private lastDescription: string | null = null;

  async saveLastDescription(description: string): Promise<void> {
    this.lastDescription = description;
  }

  async getLastDescription(): Promise<string | null> {
    return this.lastDescription;
  }

  async clear(): Promise<void> {
    this.lastDescription = null;
  }
}

// Expo Speech Synthesizer with Spanish language support
class ExpoSpeechSynthesizer implements SpeechSynthesizer {
  private speechOptions: Speech.SpeechOptions = {
    language: 'es-ES', // Spanish language
    pitch: 1.0,
    rate: 0.9, // Slightly slower for better comprehension
    voice: undefined, // Use system default Spanish voice
    volume: 1.0,
    onStart: () => console.log('[SpeechSynthesizer] Started speaking'),
    onDone: () => console.log('[SpeechSynthesizer] Finished speaking'),
    onStopped: () => console.log('[SpeechSynthesizer] Speech stopped'),
    onError: (error) => console.error('[SpeechSynthesizer] Error:', error),
  };

  async speak(text: string): Promise<void> {
    try {
      // Stop any ongoing speech first
      await this.stop();
      
      console.log('[SpeechSynthesizer] Speaking:', text);
      
      // Speak with Spanish configuration
      Speech.speak(text, this.speechOptions);
    } catch (error) {
      console.error('[SpeechSynthesizer] Failed to speak:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await Speech.stop();
      console.log('[SpeechSynthesizer] Stopped successfully');
    } catch (error) {
      console.error('[SpeechSynthesizer] Failed to stop:', error);
      throw error;
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('[SpeechSynthesizer] Failed to check speaking status:', error);
      return false;
    }
  }

  // Additional method to get available voices (useful for debugging)
  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const spanishVoices = voices.filter(v => v.language.startsWith('es'));
      console.log('[SpeechSynthesizer] Available Spanish voices:', spanishVoices.length);
      return spanishVoices;
    } catch (error) {
      console.error('[SpeechSynthesizer] Failed to get voices:', error);
      return [];
    }
  }

  // Method to update speech options (e.g., change rate, pitch)
  setSpeechOptions(options: Partial<Speech.SpeechOptions>): void {
    this.speechOptions = { ...this.speechOptions, ...options };
    console.log('[SpeechSynthesizer] Updated speech options:', this.speechOptions);
  }
}

export { InMemoryDescriptionRepository, ExpoSpeechSynthesizer };
