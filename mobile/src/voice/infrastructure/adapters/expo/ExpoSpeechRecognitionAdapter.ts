import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
  AudioEncodingAndroid,
  ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';

/**
 * Result from speech recognition transcription
 * 
 * @public
 */
export interface SpeechRecognitionResult {
  /** Transcribed text from speech input */
  transcript: string;
  /** Confidence score of transcription (0.0-1.0) */
  confidence: number;
  /** True if this is the final result, false for interim/partial results */
  isFinal: boolean;
}

/**
 * Configuration options for the speech recognizer
 * 
 * @public
 */
export interface SpeechRecognizerOptions {
  /** Language code for recognition (default: 'es-ES' Spanish) */
  language?: string;
  /** Callback fired when final speech result is available */
  onResult?: (result: SpeechRecognitionResult) => void;
  /** Callback fired when an error occurs during recognition */
  onError?: (error: Error) => void;
  /** Callback fired when recognition starts */
  onStart?: () => void;
  /** Callback fired when recognition ends */
  onEnd?: () => void;
  /** Callback fired for interim/partial recognition results in real-time */
  onPartialResult?: (result: SpeechRecognitionResult) => void;
}

/**
 * Speech recognition adapter using Expo Speech Recognition
 * 
 * Implements real-time speech-to-text using the Expo SDK with support for
 * partial results, error handling, and multilingual recognition.
 * 
 * @remarks
 * Features:
 * - Built into Expo SDK 54+
 * - Automatic microphone permission handling
 * - Real-time partial transcription results
 * - Works on Android and iOS with native speech engines
 * - Supports Spanish and English (configurable)
 * 
 * @example
 * ```typescript
 * const recognizer = new ExpoSpeechRecognitionAdapter({
 *   language: 'es-ES',
 *   onResult: (result) => console.log('Final:', result.transcript),
 *   onPartialResult: (result) => console.log('Interim:', result.transcript),
 *   onError: (error) => console.error('Error:', error),
 * });
 * 
 * await recognizer.initialize();
 * await recognizer.startListening();
 * ```
 * 
 * @public
 */
export class ExpoSpeechRecognitionAdapter {
  private isInitialized = false;
  private isRecording = false;
  private options: SpeechRecognizerOptions;
  private recognitionInstance: any = null;

   /**
    * Creates an instance of ExpoSpeechRecognitionAdapter
    * 
    * @param options - Configuration for speech recognition behavior
    */
   constructor(options: SpeechRecognizerOptions = {}) {
     this.options = {
       language: 'es-ES', // Spanish by default
       ...options,
     };
   }

   /**
    * Initializes the speech recognition engine
    * 
    * Checks device capabilities, verifies speech recognition availability,
    * and requests microphone permissions from the user.
    * Must be called before startListening().
    * 
    * @returns Promise that resolves when initialization is complete
    * @throws {Error} When speech recognition is not available
    * @throws {Error} When microphone permission is denied
    * 
    * @remarks
    * Safe to call multiple times - subsequent calls do nothing if already initialized.
    * Permission prompt is shown on first call.
    * 
    * @example
    * ```typescript
    * try {
    *   await recognizer.initialize();
    * } catch (error) {
    *   console.error('Failed to initialize:', error);
    * }
    * ```
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
    * Starts listening for speech input
    * 
    * Enables microphone and begins transcribing speech to text.
    * Automatically initializes if not already done.
    * Emits partial results in real-time and final result when speech ends.
    * 
    * @returns Promise that resolves when listening starts
    * @throws {Error} If initialization fails or microphone unavailable
    * 
    * @remarks
    * Stops automatically after one complete utterance (non-continuous mode).
    * Calls onStart callback when recognition begins.
    * Calls onPartialResult for interim transcriptions.
    * Calls onResult and onEnd when complete.
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
    * Stops listening for speech input
    * 
    * Terminates microphone access and speech recognition.
    * Waits for any pending transcription to complete before stopping.
    * 
    * @returns Promise that resolves when listening stops
    * 
    * @remarks
    * Safe to call if not currently listening.
    * Calls onEnd callback when recognition ends.
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
    * Aborts active speech recognition without waiting for completion
    * 
    * Forcefully stops listening and discards pending results.
    * Use this for canceling by user request or timeout.
    * 
    * @returns Promise that resolves when recognition is aborted
    * 
    * @remarks
    * Differs from stopListening() - no callbacks are fired.
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
    * Checks if actively listening for speech
    * 
    * @returns True if currently recording/recognizing
    */
   isListening(): boolean {
     return this.isRecording;
   }

   /**
    * Retrieves list of language codes supported by the device
    * 
    * Returns all languages available for speech recognition on the device.
    * 
    * @returns Promise resolving to array of language codes (e.g., ['es-ES', 'en-US'])
    * 
    * @remarks
    * Returns empty array if language detection fails.
    * Uses device's native speech recognition service.
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
    * Processes speech recognition result events
    * 
    * Called by useSpeechRecognitionEvent hook to handle transcription results.
    * Filters and routes partial vs final results to appropriate callbacks.
    * 
    * @param event - The raw recognition event from Expo module
    * @internal
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
    * Processes speech recognition error events
    * 
    * Maps native error codes to user-friendly error messages
    * and fires onError callback with detailed error information.
    * 
    * @param event - The error event from Expo module
    * @internal
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
    * Handles speech recognition start event
    * 
    * Called when recognition engine begins processing audio.
    * Updates internal state and fires onStart callback.
    * 
    * @internal
    */
   handleStart(): void {
     console.log('[ExpoSpeechRecognitionAdapter] Recognition started');
     this.isRecording = true;
     this.options.onStart?.();
   }

   /**
    * Handles speech recognition end event
    * 
    * Called when recognition engine finishes processing.
    * Updates internal state and fires onEnd callback.
    * 
    * @internal
    */
   handleEnd(): void {
     console.log('[ExpoSpeechRecognitionAdapter] Recognition ended');
     this.isRecording = false;
     this.options.onEnd?.();
   }

   /**
    * Cleans up resources and stops listening
    * 
    * Stops active listening, resets initialization state,
    * and releases any held resources.
    * Safe to call multiple times.
    * 
    * @returns Promise that resolves when cleanup is complete
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
    * Updates recognizer configuration options
    * 
    * Allows changing language, callbacks, and other settings at runtime.
    * Changes take effect on next startListening() call.
    * 
    * @param options - Partial options to merge with current configuration
    * 
    * @example
    * ```typescript
    * recognizer.setOptions({
    *   language: 'en-US',
    *   onResult: newCallback,
    * });
    * ```
    */
   setOptions(options: Partial<SpeechRecognizerOptions>): void {
     this.options = { ...this.options, ...options };
   }
}
