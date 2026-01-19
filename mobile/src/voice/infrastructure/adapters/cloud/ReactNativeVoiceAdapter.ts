import Voice from '@react-native-voice/voice';
import type {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent,
} from '@react-native-voice/voice';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognizerOptions {
  language?: string;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onPartialResult?: (result: SpeechRecognitionResult) => void;
}

/**
 * ReactNativeVoiceAdapter - Cloud-based speech recognition
 * 
 * Uses device's native speech recognition (Google/Apple)
 * Requires internet connection but provides faster, more accurate results
 * than on-device models.
 */
export class ReactNativeVoiceAdapter {
  private isInitialized = false;
  private isRecording = false;
  private options: SpeechRecognizerOptions;

  constructor(options: SpeechRecognizerOptions = {}) {
    this.options = {
      language: 'es-ES', // Spanish (Spain) by default for Iris
      ...options,
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize voice recognition
   */
  async initialize(): Promise<void> {
    try {
      console.log('[ReactNativeVoiceAdapter] Initializing voice recognition...');
      
      // Voice library doesn't need explicit initialization
      // Just set the flag and let start() handle availability checks
      this.isInitialized = true;
      console.log('[ReactNativeVoiceAdapter] Voice recognition initialized successfully');
    } catch (error) {
      console.error('[ReactNativeVoiceAdapter] Failed to initialize:', error);
      throw new Error(`Failed to initialize voice recognition: ${error}`);
    }
  }

  /**
   * Set up event handlers for voice recognition
   */
  private setupEventHandlers(): void {
    // Speech started
    Voice.onSpeechStart = (event: SpeechStartEvent) => {
      console.log('[ReactNativeVoiceAdapter] Speech started');
      this.isRecording = true;
      this.options.onStart?.();
    };

    // Speech ended
    Voice.onSpeechEnd = (event: SpeechEndEvent) => {
      console.log('[ReactNativeVoiceAdapter] Speech ended');
      this.isRecording = false;
      this.options.onEnd?.();
    };

    // Final results
    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      console.log('[ReactNativeVoiceAdapter] Speech results:', event.value);
      
      if (event.value && event.value.length > 0) {
        const transcript = event.value[0];
        
        this.options.onResult?.({
          transcript,
          confidence: 0.9, // Native voice doesn't always provide confidence
          isFinal: true,
        });
      }
    };

    // Partial results (real-time transcription)
    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      console.log('[ReactNativeVoiceAdapter] Partial results:', event.value);
      
      if (event.value && event.value.length > 0) {
        const transcript = event.value[0];
        
        this.options.onPartialResult?.({
          transcript,
          confidence: 0.7, // Lower confidence for partial results
          isFinal: false,
        });
      }
    };

    // Error handling
    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      console.error('[ReactNativeVoiceAdapter] Speech error:', event.error);
      this.isRecording = false;
      
      const error = new Error(event.error?.message || 'Speech recognition error');
      this.options.onError?.(error);
    };
  }

  /**
   * Start listening for speech
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Voice recognition not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('[ReactNativeVoiceAdapter] Already recording');
      return;
    }

    try {
      console.log('[ReactNativeVoiceAdapter] Starting voice recognition...');

      await Voice.start(this.options.language || 'es-ES');
      
      console.log('[ReactNativeVoiceAdapter] Voice recognition started');
    } catch (error) {
      console.error('[ReactNativeVoiceAdapter] Failed to start listening:', error);
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    if (!this.isRecording) {
      console.warn('[ReactNativeVoiceAdapter] Not currently recording');
      return;
    }

    try {
      console.log('[ReactNativeVoiceAdapter] Stopping voice recognition...');

      await Voice.stop();
      this.isRecording = false;

      console.log('[ReactNativeVoiceAdapter] Voice recognition stopped');
    } catch (error) {
      console.error('[ReactNativeVoiceAdapter] Failed to stop listening:', error);
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Cancel current recognition session
   */
  async cancel(): Promise<void> {
    try {
      console.log('[ReactNativeVoiceAdapter] Cancelling voice recognition...');

      await Voice.cancel();
      this.isRecording = false;

      console.log('[ReactNativeVoiceAdapter] Voice recognition cancelled');
    } catch (error) {
      console.error('[ReactNativeVoiceAdapter] Failed to cancel:', error);
      throw error;
    }
  }

  /**
   * Check if currently recording
   */
  isListening(): boolean {
    return this.isRecording;
  }

  /**
   * Get available speech recognition services
   */
  async getAvailableServices(): Promise<string[]> {
    try {
      const services = await Voice.getSpeechRecognitionServices();
      console.log('[ReactNativeVoiceAdapter] Available services:', services);
      return services || [];
    } catch (error) {
      console.error('[ReactNativeVoiceAdapter] Failed to get services:', error);
      return [];
    }
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopListening();
      }

      await Voice.destroy();
      
      // Remove event handlers
      Voice.removeAllListeners();

      this.isInitialized = false;
      console.log('[ReactNativeVoiceAdapter] Resources cleaned up');
    } catch (error) {
      console.error('[ReactNativeVoiceAdapter] Failed to destroy:', error);
    }
  }

  /**
   * Update options
   */
  setOptions(options: Partial<SpeechRecognizerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
