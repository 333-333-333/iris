import React from 'react';
import { ExpoSpeechRecognitionAdapter, SpeechRecognitionResult } from '../../infrastructure/adapters/expo/ExpoSpeechRecognitionAdapter';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';

// Using ExpoSpeechRecognitionAdapter for real voice recognition
type VoiceAdapter = ExpoSpeechRecognitionAdapter;

interface UseVoiceRecognitionOptions {
  language?: string;
  onTranscript?: (transcript: string, confidence: number) => void;
  onError?: (error: Error) => void;
  autoInitialize?: boolean;
}

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isInitialized: boolean;
  transcript: string;
  confidence: number;
  error: Error | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  initialize: () => Promise<void>;
}

/**
 * Hook for voice recognition using cloud-based speech recognition
 * 
 * This hook manages the lifecycle of voice recognition, including:
 * - Initialization
 * - Starting/stopping listening
 * - Error handling
 * - Transcript management
 * 
 * Usage:
 * ```tsx
 * const { isListening, transcript, startListening, stopListening } = useVoiceRecognition({
 *   onTranscript: (text, confidence) => {
 *     console.log('Transcript:', text, 'Confidence:', confidence);
 *   },
 * });
 * ```
 */
export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [confidence, setConfidence] = React.useState(0);
  const [error, setError] = React.useState<Error | null>(null);

  // Create adapter instance (memoized)
  const adapter = React.useMemo(() => {
    return new ExpoSpeechRecognitionAdapter({
      language: options.language || 'es-ES',
      
      onStart: () => {
        console.log('[useVoiceRecognition] Started listening');
        setIsListening(true);
        setError(null);
      },

      onEnd: () => {
        console.log('[useVoiceRecognition] Stopped listening');
        setIsListening(false);
      },

      onResult: (result: SpeechRecognitionResult) => {
        console.log('[useVoiceRecognition] Final result:', result.transcript);
        setTranscript(result.transcript);
        setConfidence(result.confidence);
        options.onTranscript?.(result.transcript, result.confidence);
      },

      onPartialResult: (result: SpeechRecognitionResult) => {
        console.log('[useVoiceRecognition] Partial result:', result.transcript);
        setTranscript(result.transcript);
        setConfidence(result.confidence);
      },

      onError: (err: Error) => {
        console.error('[useVoiceRecognition] Error:', err);
        setError(err);
        setIsListening(false);
        options.onError?.(err);
      },
    });
  }, [options.language]);

  // Listen to speech recognition events from Expo
  useSpeechRecognitionEvent('start', () => {
    adapter.handleStart();
  });

  useSpeechRecognitionEvent('end', () => {
    adapter.handleEnd();
  });

  useSpeechRecognitionEvent('result', (event) => {
    adapter.handleResult(event);
  });

  useSpeechRecognitionEvent('error', (event) => {
    adapter.handleError(event);
  });

  // Initialize on mount if autoInitialize is true
  React.useEffect(() => {
    if (options.autoInitialize) {
      initialize();
    }

    // Cleanup on unmount
    return () => {
      adapter.destroy();
    };
  }, []);

  /**
   * Initialize voice recognition
   */
  const initialize = React.useCallback(async () => {
    try {
      await adapter.initialize();
      setIsInitialized(true);
      console.log('[useVoiceRecognition] Initialized successfully');
    } catch (err) {
      const error = err as Error;
      console.error('[useVoiceRecognition] Initialization failed:', error);
      setError(error);
      throw error;
    }
  }, [adapter]);

  /**
   * Start listening for speech
   */
  const startListening = React.useCallback(async () => {
    try {
      if (!isInitialized) {
        await initialize();
      }

      setTranscript('');
      setConfidence(0);
      setError(null);

      await adapter.startListening();
    } catch (err) {
      const error = err as Error;
      console.error('[useVoiceRecognition] Failed to start listening:', error);
      setError(error);
      throw error;
    }
  }, [isInitialized, adapter, initialize]);

  /**
   * Stop listening
   */
  const stopListening = React.useCallback(async () => {
    try {
      await adapter.stopListening();
    } catch (err) {
      const error = err as Error;
      console.error('[useVoiceRecognition] Failed to stop listening:', error);
      setError(error);
      throw error;
    }
  }, [adapter]);

  return {
    isListening,
    isInitialized,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    initialize,
  };
}
