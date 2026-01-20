/**
 * Main voice assistant hook for Iris
 * 
 * Unifies wake word detection with command processing into a single
 * always-listening voice interface. No buttons needed - 100% voice controlled.
 * 
 * Flow:
 * 1. Continuously listens for "Iris" wake word
 * 2. When detected, parses the command from the transcript
 * 3. Executes the command (describe, repeat, help, stop, goodbye)
 * 4. Speaks the response
 * 5. Returns to listening
 * 
 * @example
 * ```typescript
 * const { state, lastDescription, error } = useIrisVoiceAssistant({
 *   visionService,
 *   onStateChange: (state) => console.log('State:', state),
 * });
 * ```
 * 
 * @public
 */

import React from 'react';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';

import { ContinuousWakeWordService } from '../../infrastructure/services/ContinuousWakeWordService';
import { WakeWordParser, ParsedCommand } from '../../domain/services/WakeWordParser';
import { ProcessCommandUseCase, ProcessCommandResult } from '../../application/use-cases/ProcessCommand';
import { VisionService } from '../../application/ports/VisionService';
import { ExpoSpeechSynthesizer, InMemoryDescriptionRepository } from '../../infrastructure/adapters/simple/SimpleSpeechAdapter';

/**
 * Voice assistant states
 */
export type IrisState = 
  | 'initializing'   // Starting up, loading models
  | 'listening'      // Waiting for "Iris" wake word
  | 'processing'     // Processing command (capturing photo, analyzing)
  | 'speaking'       // Speaking response
  | 'error';         // Error occurred

/**
 * Configuration for useIrisVoiceAssistant
 */
export interface UseIrisVoiceAssistantOptions {
  /** Vision service for scene analysis (required for describe command) */
  visionService: VisionService;
  /** Callback when state changes */
  onStateChange?: (state: IrisState) => void;
  /** Callback when command is detected */
  onCommand?: (command: ParsedCommand) => void;
  /** Callback when description is generated */
  onDescription?: (description: string) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Auto-start listening on mount (default: true) */
  autoStart?: boolean;
}

/**
 * Return value from useIrisVoiceAssistant
 */
export interface UseIrisVoiceAssistantReturn {
  /** Current assistant state */
  state: IrisState;
  /** True when listening for wake word */
  isListening: boolean;
  /** True when processing a command */
  isProcessing: boolean;
  /** True when speaking response */
  isSpeaking: boolean;
  /** True when in error state */
  hasError: boolean;
  /** Last transcript heard */
  lastTranscript: string;
  /** Last description generated */
  lastDescription: string | null;
  /** Error message if any */
  error: string | null;
  /** Manually start listening (usually auto-started) */
  start: () => Promise<void>;
  /** Stop listening */
  stop: () => Promise<void>;
}

/**
 * Main hook for Iris voice assistant
 * 
 * Provides a unified, always-listening voice interface that:
 * - Detects wake word ("Iris")
 * - Parses and executes commands
 * - Handles vision analysis
 * - Speaks responses
 */
export function useIrisVoiceAssistant(
  options: UseIrisVoiceAssistantOptions
): UseIrisVoiceAssistantReturn {
  const { visionService, autoStart = true } = options;

  // State
  const [state, setState] = React.useState<IrisState>('initializing');
  const [lastTranscript, setLastTranscript] = React.useState('');
  const [lastDescription, setLastDescription] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Services (memoized)
  const wakeWordServiceRef = React.useRef<ContinuousWakeWordService | null>(null);
  const wakeWordParser = React.useMemo(() => new WakeWordParser('iris'), []);
  const speechSynthesizer = React.useMemo(() => new ExpoSpeechSynthesizer(), []);
  const repository = React.useMemo(() => new InMemoryDescriptionRepository(), []);
  
  const processCommandUseCase = React.useMemo(() => new ProcessCommandUseCase({
    speechSynthesizer,
    visionService,
    repository,
  }), [speechSynthesizer, visionService, repository]);

  // Refs for callbacks (to avoid stale closures)
  const stateRef = React.useRef(state);
  stateRef.current = state;

  /**
   * Update state and notify callback
   */
  const updateState = React.useCallback((newState: IrisState) => {
    setState(newState);
    options.onStateChange?.(newState);
  }, [options.onStateChange]);

  /**
   * Handle wake word detected with transcript
   */
  const handleWakeWord = React.useCallback(async (transcript: string) => {
    console.log('[useIrisVoiceAssistant] Wake word detected:', transcript);
    setLastTranscript(transcript);
    setError(null);

    // Parse the command
    const parsed = wakeWordParser.parse(transcript, 0.8); // Assume decent confidence
    
    if (!parsed) {
      console.log('[useIrisVoiceAssistant] No valid command parsed');
      return;
    }

    console.log('[useIrisVoiceAssistant] Command parsed:', parsed.intent.type);
    options.onCommand?.(parsed);

    // Process the command
    updateState('processing');

    try {
      const result = await processCommandUseCase.execute(parsed);
      
      if (result.success) {
        if (result.description) {
          setLastDescription(result.description);
          options.onDescription?.(result.description);
        }
        
        // Speech is handled by ProcessCommandUseCase
        updateState('speaking');
        
        // Wait for speech to finish, then return to listening
        // ExpoSpeechSynthesizer uses expo-speech which we can monitor
        Speech.speak('', {
          onDone: () => {
            // This is a hack - we speak empty to get callback timing
            // The actual speech was done by processCommandUseCase
          },
        });
        
        // For now, estimate speech duration and return to listening
        const estimatedDuration = (result.description?.length || 50) * 50; // ~50ms per char
        setTimeout(() => {
          if (stateRef.current === 'speaking') {
            updateState('listening');
          }
        }, Math.min(estimatedDuration, 10000)); // Max 10 seconds
        
      } else {
        setError(result.error || 'Error desconocido');
        options.onError?.(result.error || 'Error desconocido');
        updateState('error');
        
        // Return to listening after error
        setTimeout(() => {
          if (stateRef.current === 'error') {
            setError(null);
            updateState('listening');
          }
        }, 3000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error procesando comando';
      console.error('[useIrisVoiceAssistant] Error:', errorMsg);
      setError(errorMsg);
      options.onError?.(errorMsg);
      updateState('error');
      
      // Return to listening after error
      setTimeout(() => {
        if (stateRef.current === 'error') {
          setError(null);
          updateState('listening');
        }
      }, 3000);
    }
  }, [wakeWordParser, processCommandUseCase, updateState, options]);

  // Initialize wake word service
  React.useEffect(() => {
    wakeWordServiceRef.current = ContinuousWakeWordService.getInstance();
  }, []);

  // Listen to speech recognition events (for ContinuousWakeWordService)
  useSpeechRecognitionEvent('result', (event) => {
    wakeWordServiceRef.current?.handleResult(event);
  });

  useSpeechRecognitionEvent('error', (event) => {
    wakeWordServiceRef.current?.handleError(event);
  });

  useSpeechRecognitionEvent('end', () => {
    wakeWordServiceRef.current?.handleEnd();
  });

  /**
   * Start listening for wake word
   */
  const start = React.useCallback(async () => {
    try {
      console.log('[useIrisVoiceAssistant] Starting...');
      setError(null);
      
      await wakeWordServiceRef.current?.start(handleWakeWord);
      updateState('listening');
      
      console.log('[useIrisVoiceAssistant] Started successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al iniciar';
      console.error('[useIrisVoiceAssistant] Failed to start:', errorMsg);
      setError(errorMsg);
      updateState('error');
      throw err;
    }
  }, [handleWakeWord, updateState]);

  /**
   * Stop listening
   */
  const stop = React.useCallback(async () => {
    try {
      console.log('[useIrisVoiceAssistant] Stopping...');
      await wakeWordServiceRef.current?.stop();
      updateState('initializing');
    } catch (err) {
      console.error('[useIrisVoiceAssistant] Failed to stop:', err);
    }
  }, [updateState]);

  // Auto-start on mount
  React.useEffect(() => {
    if (autoStart) {
      // Small delay to allow vision service to initialize
      const timer = setTimeout(() => {
        start();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return {
    state,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    isSpeaking: state === 'speaking',
    hasError: state === 'error',
    lastTranscript,
    lastDescription,
    error,
    start,
    stop,
  };
}
