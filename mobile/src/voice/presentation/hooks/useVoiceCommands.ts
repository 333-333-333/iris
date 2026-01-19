import React from 'react';
import { useMachine } from '@xstate/react';
import { voiceMachine } from '../../machines/voiceMachine';
import { ParsedCommand } from '../../domain/services/WakeWordParser';
import { ProcessCommandUseCase } from '../../application/use-cases/ProcessCommand';
import { ExpoSpeechSynthesizer, InMemoryDescriptionRepository } from '../../infrastructure/adapters/simple/SimpleSpeechAdapter';
import { VisionService } from '../../application/ports/VisionService';
import { useVoiceRecognition } from './useVoiceRecognition';

/**
 * Configuration options for the useVoiceCommands hook
 * 
 * @public
 */
export interface UseVoiceCommandsOptions {
  /** If true, automatically start listening when component mounts */
  autoStart?: boolean;
  /** Callback fired when a parsed voice command is detected */
  onCommand?: (command: ParsedCommand) => void;
  /** Callback fired when scene description is generated */
  onDescription?: (description: string) => void;
  /** Callback fired when an error occurs during voice processing */
  onError?: (error: string) => void;
  /** Callback fired when any state (listening, processing, speaking) changes */
  onStatusChange?: (isListening: boolean, isProcessing: boolean, isSpeaking: boolean) => void;
  /** Service for analyzing the visual scene when describe command is issued */
  visionService?: VisionService;
}

/**
 * Return value from the useVoiceCommands hook
 * 
 * @public
 */
export interface UseVoiceCommandsReturn {
  /** True when actively listening for voice input */
  isListening: boolean;
  /** True when processing a detected command */
  isProcessing: boolean;
  /** True when synthesizing speech response */
  isSpeaking: boolean;
  /** True when an error occurred in the voice pipeline */
  hasError: boolean;
  /** The most recent voice transcription */
  transcript: string;
  /** The last generated scene description for replay */
  lastDescription: string | null;
  /** Error message if an error occurred */
  error: string | null;
  /** Function to start listening for voice commands */
  start: () => void;
  /** Function to stop listening for voice commands */
  stop: () => void;
  /** Function to retry after an error */
  retry: () => void;
  /** Internal reference to the voice machine actor (for testing) */
  voiceActor?: any;
  /** Internal reference to the voice machine (for testing) */
  voiceMachine?: any;
}

/**
 * React hook for managing voice command recognition and processing
 * 
 * Integrates voice recognition, command parsing, vision analysis, and speech synthesis
 * into a cohesive voice interaction system. Manages state transitions through an XState
 * machine and handles all voice-related callbacks.
 * 
 * @param options - Configuration options for voice command handling
 * @returns State and control interface for voice command processing
 * 
 * @example
 * ```typescript
 * const { isListening, start, stop, lastDescription, error } = useVoiceCommands({
 *   autoStart: true,
 *   visionService: myVisionService,
 *   onDescription: (desc) => console.log('Scene:', desc),
 *   onError: (err) => console.error('Voice error:', err),
 * });
 * ```
 * 
 * @public
 */
export function useVoiceCommands(options: UseVoiceCommandsOptions = {}): UseVoiceCommandsReturn {
  // Create dependencies (memoized to prevent recreating on every render)
  const repository = React.useMemo(() => new InMemoryDescriptionRepository(), []);
  const speechSynthesizer = React.useMemo(() => new ExpoSpeechSynthesizer(), []);
  
  // Use provided vision service or create a mock
  const visionService = options.visionService || {
    isReady: () => false,
    analyzeScene: async () => ({
      description: 'Servicio de visión no configurado',
      objects: [],
    }),
  };
  
  // Create use case with real vision service
  const processCommandUseCase = React.useMemo(() => new ProcessCommandUseCase({
    speechSynthesizer,
    repository,
    visionService,
  }), [speechSynthesizer, repository, visionService]);

  // Create voice machine actor
  const [state, send] = useMachine(voiceMachine);

  // Use voice recognition hook
  const voiceRecognition = useVoiceRecognition({
    language: 'es-ES',
    autoInitialize: true,
    onTranscript: (transcript, confidence) => {
      console.log('[useVoiceCommands] Received transcript:', transcript, 'Confidence:', confidence);
      
      // Send VOICE_DETECTED event to state machine
      send({
        type: 'VOICE_DETECTED',
        transcript,
        confidence,
      });
    },
    onError: (error) => {
      console.error('[useVoiceCommands] Voice recognition error:', error);
      send({ type: 'ERROR', error: error.message });
    },
  });

  // Handle state changes
  const [isListening, isProcessing, isSpeaking] = [
    state.matches('listening'),
    state.matches('processing'),
    state.matches('speaking'),
  ];

  const [transcript, lastDescription, error] = [
    state.context.transcript,
    state.context.lastDescription,
    state.context.error,
  ];

  // Callbacks
  const start = React.useCallback(() => {
    send({ type: 'START' });
    voiceRecognition.startListening();
  }, [send, voiceRecognition]);

  const stop = React.useCallback(() => {
    send({ type: 'STOP' });
    voiceRecognition.stopListening();
  }, [send, voiceRecognition]);

  const retry = React.useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  // Auto-start if configured
  const [autoStarted, setAutoStarted] = React.useState(false);

  React.useEffect(() => {
    if (options.autoStart && !autoStarted) {
      start();
      setAutoStarted(true);
    }
  }, [options.autoStart, autoStarted, start]);

  // Handle command processed from machine
  React.useEffect(() => {
    const { lastDescription, error } = state.context;

    if (lastDescription && !error) {
      options.onDescription?.(lastDescription);
      options.onStatusChange?.(isListening, isProcessing, isSpeaking);
    }

    if (error) {
      options.onError?.(error);
    }
  }, [state.value, lastDescription, error, isListening, isProcessing, isSpeaking]);

  return {
    // State
    isListening: state.matches('listening'),
    isProcessing: state.matches('processing'),
    isSpeaking: state.matches('speaking'),
    hasError: state.matches('error'),

    // Context
    transcript,
    lastDescription,
    error,

    // Actions
    start,
    stop,
    retry,

    // For testing/debugging (optional)
    voiceActor: undefined,
    voiceMachine: undefined,
  };
}
