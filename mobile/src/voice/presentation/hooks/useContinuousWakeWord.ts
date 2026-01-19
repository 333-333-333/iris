import React from 'react';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { ContinuousWakeWordService } from '../../infrastructure/services/ContinuousWakeWordService';

/**
 * Configuration options for continuous wake word detection
 * 
 * @public
 */
interface UseContinuousWakeWordOptions {
  /** Callback fired when wake word detected with transcript */
  onWakeWord: (transcript: string) => void;
  /** If true, automatically start listening on mount */
  autoStart?: boolean;
}

/**
 * Return value from continuous wake word hook
 * 
 * @public
 */
interface UseContinuousWakeWordReturn {
  /** True when wake word detection is active */
  isActive: boolean;
  /** The most recent detected transcript */
  lastTranscript: string;
  /** Error if detection failed, null otherwise */
  error: Error | null;
  /** Function to start wake word detection */
  start: () => Promise<void>;
  /** Function to stop wake word detection */
  stop: () => Promise<void>;
}

/**
 * React hook for continuous always-on wake word detection
 * 
 * Manages continuous listening for wake words using Expo speech recognition.
 * Automatically detects "iris" wake word and triggers callbacks.
 * 
 * @param options - Configuration for wake word detection
 * @returns Hook state and control functions
 * 
 * @remarks
 * This hook:
 * - Runs in continuous mode (always listening)
 * - Includes 2-second cooldown between detections
 * - Handles speech recognition lifecycle
 * - Integrates with app state management
 * 
 * **Important**: Requires microphone permission.
 * Uses device's speech recognition service (requires internet).
 * 
 * @example
 * ```typescript
 * const { isActive, lastTranscript, start, stop } = useContinuousWakeWord({
 *   onWakeWord: (text) => {
 *     console.log('Wake word detected:', text);
 *     // Trigger voice command flow
 *   },
 *   autoStart: true
 * });
 * 
 * // Control detection
 * await start();
 * await stop();
 * ```
 * 
 * @public
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
