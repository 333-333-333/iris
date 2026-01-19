import React from 'react';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { ContinuousWakeWordService } from '../../infrastructure/services/ContinuousWakeWordService';

interface UseContinuousWakeWordOptions {
  onWakeWord: (transcript: string) => void;
  autoStart?: boolean;
}

interface UseContinuousWakeWordReturn {
  isActive: boolean;
  lastTranscript: string;
  error: Error | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Hook for continuous wake word detection
 * 
 * Manages the lifecycle of continuous wake word listening,
 * including automatic restarts and error handling.
 * 
 * Usage:
 * ```tsx
 * const { isActive, lastTranscript } = useContinuousWakeWord({
 *   onWakeWord: (text) => console.log('Detected:', text),
 *   autoStart: true
 * });
 * ```
 */
export function useContinuousWakeWord(
  options: UseContinuousWakeWordOptions
): UseContinuousWakeWordReturn {
  const [isActive, setIsActive] = React.useState(false);
  const [lastTranscript, setLastTranscript] = React.useState('');
  const [error, setError] = React.useState<Error | null>(null);
  const serviceRef = React.useRef<ContinuousWakeWordService | null>(null);

  // Get service instance
  React.useEffect(() => {
    serviceRef.current = ContinuousWakeWordService.getInstance();
  }, []);

  // Handle wake word detection
  const handleWakeWord = React.useCallback((transcript: string) => {
    console.log('[useContinuousWakeWord] Wake word detected:', transcript);
    setLastTranscript(transcript);
    options.onWakeWord(transcript);
  }, [options.onWakeWord]);

  // Listen to speech recognition events
  useSpeechRecognitionEvent('result', (event) => {
    serviceRef.current?.handleResult(event);
  });

  useSpeechRecognitionEvent('error', (event) => {
    serviceRef.current?.handleError(event);
  });

  useSpeechRecognitionEvent('end', () => {
    serviceRef.current?.handleEnd();
  });

  // Start wake word detection
  const start = React.useCallback(async () => {
    try {
      setError(null);
      await serviceRef.current?.start(handleWakeWord);
      setIsActive(true);
      console.log('[useContinuousWakeWord] Started successfully');
    } catch (err) {
      const error = err as Error;
      console.error('[useContinuousWakeWord] Failed to start:', error);
      setError(error);
      setIsActive(false);
      throw error;
    }
  }, [handleWakeWord]);

  // Stop wake word detection
  const stop = React.useCallback(async () => {
    try {
      await serviceRef.current?.stop();
      setIsActive(false);
      console.log('[useContinuousWakeWord] Stopped successfully');
    } catch (err) {
      const error = err as Error;
      console.error('[useContinuousWakeWord] Failed to stop:', error);
      setError(error);
      throw error;
    }
  }, []);

  // Auto-start on mount
  React.useEffect(() => {
    if (options.autoStart) {
      start();
    }

    // Cleanup on unmount
    return () => {
      stop();
    };
  }, []);

  return {
    isActive,
    lastTranscript,
    error,
    start,
    stop,
  };
}
