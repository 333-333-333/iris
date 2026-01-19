import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { SpeechSynthesizer } from '../../../application/ports/SpeechSynthesizer';

/**
 * In-memory repository for persisting recent scene descriptions
 * 
 * Simple implementation that stores the last description in memory.
 * Used for replay functionality (repeat command).
 * 
 * @public
 */
export class InMemoryDescriptionRepository {
  private lastDescription: string | null = null;

  /**
   * Saves a description for later retrieval
   * 
   * @param description - The description text to save
   */
  async saveLastDescription(description: string): Promise<void> {
    this.lastDescription = description;
  }

  /**
   * Retrieves the last saved description
   * 
   * @returns Promise resolving to saved description or null if none exists
   */
  async getLastDescription(): Promise<string | null> {
    return this.lastDescription;
  }

  /**
   * Clears the saved description
   */
  async clear(): Promise<void> {
    this.lastDescription = null;
  }
}

/**
 * Speech synthesizer using Expo Speech with Spanish language support
 * 
 * Converts text to speech using device's native speech synthesis engine.
 * Optimized for Spanish with appropriate pitch and rate settings
 * for clarity and comprehension for visually impaired users.
 * 
 * @public
 */
export class ExpoSpeechSynthesizer implements SpeechSynthesizer {
  private speechOptions: Speech.SpeechOptions = {
    language: 'es-ES', // Spanish language
    pitch: 1.1, // Slightly higher pitch for clarity
    rate: 0.85, // Slightly slower for better comprehension
    voice: undefined, // Use system default Spanish voice
    volume: 1.0, // Maximum volume (device volume still controls final output)
    onStart: () => console.log('[SpeechSynthesizer] Started speaking'),
    onDone: () => console.log('[SpeechSynthesizer] Finished speaking'),
    onStopped: () => console.log('[SpeechSynthesizer] Speech stopped'),
    onError: (error) => console.error('[SpeechSynthesizer] Error:', error),
  };

  /**
   * Synthesizes and speaks text using device speech engine
   * 
   * Stops any ongoing speech first, configures audio settings,
   * then speaks the provided text using Spanish language settings.
   * 
   * @param text - The text to speak
   * @returns Promise that resolves when speech synthesis starts
   * @throws {Error} If speech synthesis fails
   * 
   * @remarks
   * Uses increased pitch (1.1) for clarity and slower rate (0.85)
   * for better comprehension by visually impaired users.
   */
  async speak(text: string): Promise<void> {
     try {
       // Stop any ongoing speech first
       await this.stop();
       
       console.log('[SpeechSynthesizer] Speaking:', text);
       
       // Configure audio for maximum clarity
       try {
         await Audio.setAudioModeAsync({
           allowsRecordingIOS: false,
           playsInSilentModeIOS: true,
           staysActiveInBackground: false,
           shouldDuckAndroid: true,
         });
       } catch (audioError) {
         console.warn('[SpeechSynthesizer] Could not set audio mode:', audioError);
       }
       
       // Speak with Spanish configuration
       Speech.speak(text, this.speechOptions);
     } catch (error) {
       console.error('[SpeechSynthesizer] Failed to speak:', error);
       throw error;
     }
   }

   /**
    * Stops ongoing speech synthesis
    * 
    * @returns Promise that resolves when speech is stopped
    * @throws {Error} If stopping fails
    */
   async stop(): Promise<void> {
     try {
       await Speech.stop();
       console.log('[SpeechSynthesizer] Stopped successfully');
     } catch (error) {
       console.error('[SpeechSynthesizer] Failed to stop:', error);
       throw error;
     }
   }

   /**
    * Checks if speech is currently playing
    * 
    * @returns Promise resolving to true if actively speaking
    */
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
