import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
  AudioEncodingAndroid,
  ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';

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
 * ExpoSpeechRecognitionAdapter - Speech recognition using Expo SDK
 * 
 * Uses expo-speech-recognition which is simpler and better integrated
 * with Expo than @react-native-voice/voice.
 * 
 * Features:
 * - Built into Expo SDK 54+
 * - Automatic permission handling
 * - Real-time transcription (partial results)
 * - Works on Android and iOS
 */
export class ExpoSpeechRecognitionAdapter {
  private isInitialized = false;
  private isRecording = false;
  private options: SpeechRecognizerOptions;
  private recognitionInstance: any = null;

  constructor(options: SpeechRecognizerOptions = {}) {
    this.options = {
      language: 'es-ES', // Spanish by default
      ...options,
    };
  }

  /**
   * Initialize speech recognition
   */
  async initialize(): Promise<void> {
    try {
      console.log('[ExpoSpeechRecognitionAdapter] Initializing...');

      // Check if speech recognition is available
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      
      if (!available) {
        throw new Error('Speech recognition not available on this device');
      }

      // Request permissions
      const { status, granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (!granted) {
        throw new Error('Microphone permission denied');
      }

      this.isInitialized = true;
      console.log('[ExpoSpeechRecognitionAdapter] Initialized successfully');
    } catch (error) {
      console.error('[ExpoSpeechRecognitionAdapter] Initialization failed:', error);
      throw new Error(`Failed to initialize speech recognition: ${error}`);
    }
  }

  /**
   * Start listening for speech
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isRecording) {
      console.warn('[ExpoSpeechRecognitionAdapter] Already recording');
      return;
    }

    try {
      console.log('[ExpoSpeechRecognitionAdapter] Starting speech recognition...');

      // Start recognition
      await ExpoSpeechRecognitionModule.start({
        lang: this.options.language || 'es-ES',
        interimResults: true, // Enable partial results
        maxAlternatives: 1,
        continuous: false, // Stop after one utterance
        // Android specific
        recordingOptions: {
          persist: false,
        },
      });

      this.isRecording = true;
      this.options.onStart?.();
      
      console.log('[ExpoSpeechRecognitionAdapter] Speech recognition started');
    } catch (error) {
      console.error('[ExpoSpeechRecognitionAdapter] Failed to start:', error);
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    if (!this.isRecording) {
      console.warn('[ExpoSpeechRecognitionAdapter] Not currently recording');
      return;
    }

    try {
      console.log('[ExpoSpeechRecognitionAdapter] Stopping speech recognition...');

      await ExpoSpeechRecognitionModule.stop();
      
      this.isRecording = false;
      this.options.onEnd?.();

      console.log('[ExpoSpeechRecognitionAdapter] Speech recognition stopped');
    } catch (error) {
      console.error('[ExpoSpeechRecognitionAdapter] Failed to stop:', error);
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Cancel current recognition
   */
  async cancel(): Promise<void> {
    try {
      console.log('[ExpoSpeechRecognitionAdapter] Cancelling...');
      
      await ExpoSpeechRecognitionModule.abort();
      
      this.isRecording = false;
      console.log('[ExpoSpeechRecognitionAdapter] Cancelled');
    } catch (error) {
      console.error('[ExpoSpeechRecognitionAdapter] Failed to cancel:', error);
      throw error;
    }
  }

  /**
   * Check if currently listening
   */
  isListening(): boolean {
    return this.isRecording;
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    try {
      const result = await ExpoSpeechRecognitionModule.getSupportedLocales({ androidRecognitionServicePackage: undefined });
      console.log('[ExpoSpeechRecognitionAdapter] Supported languages:', result);
      return result.locales || [];
    } catch (error) {
      console.error('[ExpoSpeechRecognitionAdapter] Failed to get languages:', error);
      return [];
    }
  }

  /**
   * Set up event handler for results
   * This should be called from a React component using useSpeechRecognitionEvent
   */
  handleResult(event: any): void {
    if (!event.results || event.results.length === 0) {
      return;
    }

    const result = event.results[0];
    const transcript = result.transcript || '';
    const isFinal = result.isFinal || false;
    const confidence = result.confidence || 0.9;

    console.log(
      '[ExpoSpeechRecognitionAdapter]',
      isFinal ? 'Final result:' : 'Partial result:',
      transcript
    );

    const speechResult: SpeechRecognitionResult = {
      transcript,
      confidence,
      isFinal,
    };

    if (isFinal) {
      this.options.onResult?.(speechResult);
      this.isRecording = false;
      this.options.onEnd?.();
    } else {
      this.options.onPartialResult?.(speechResult);
    }
  }

  /**
   * Handle error events
   */
  handleError(event: any): void {
    const errorCode = event.error;
    let errorMessage = 'Speech recognition error';

    // Handle both enum values and string error codes
    switch (errorCode) {
      case 'no-match':
      case 'no-speech':
        errorMessage = 'No speech was detected';
        break;
      case 'aborted':
        errorMessage = 'Speech recognition was aborted';
        break;
      case 'audio-capture':
        errorMessage = 'Audio capture failed';
        break;
      case 'network':
        errorMessage = 'Network error occurred';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone permission not granted';
        break;
      case 'service-not-allowed':
        errorMessage = 'Speech recognition service not allowed';
        break;
      case 'bad-grammar':
        errorMessage = 'Speech grammar error';
        break;
      case 'language-not-supported':
        errorMessage = 'Language not supported';
        break;
      default:
        errorMessage = `Speech recognition error: ${errorCode}`;
    }

    console.error('[ExpoSpeechRecognitionAdapter]', errorMessage);
    
    this.isRecording = false;
    this.options.onError?.(new Error(errorMessage));
  }

  /**
   * Handle start event
   */
  handleStart(): void {
    console.log('[ExpoSpeechRecognitionAdapter] Recognition started');
    this.isRecording = true;
    this.options.onStart?.();
  }

  /**
   * Handle end event
   */
  handleEnd(): void {
    console.log('[ExpoSpeechRecognitionAdapter] Recognition ended');
    this.isRecording = false;
    this.options.onEnd?.();
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopListening();
      }
      
      this.isInitialized = false;
      console.log('[ExpoSpeechRecognitionAdapter] Resources cleaned up');
    } catch (error) {
      console.error('[ExpoSpeechRecognitionAdapter] Failed to destroy:', error);
    }
  }

  /**
   * Update options
   */
  setOptions(options: Partial<SpeechRecognizerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
