import React from 'react';
import { useMachine } from '@xstate/react';
import { voiceMachine } from '../../machines/voiceMachine';
import { ParsedCommand } from '../../domain/services/WakeWordParser';
import { ProcessCommandUseCase } from '../../application/use-cases/ProcessCommand';
import { ExpoSpeechSynthesizer, InMemoryDescriptionRepository } from '../../infrastructure/adapters/simple/SimpleSpeechAdapter';
import { VisionService } from '../../application/ports/VisionService';
import { useVoiceRecognition } from './useVoiceRecognition';

export interface UseVoiceCommandsOptions {
  autoStart?: boolean;
  onCommand?: (command: ParsedCommand) => void;
  onDescription?: (description: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (isListening: boolean, isProcessing: boolean, isSpeaking: boolean) => void;
  /** Servicio de visión para análisis de imágenes */
  visionService?: VisionService;
}

export interface UseVoiceCommandsReturn {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  hasError: boolean;
  transcript: string;
  lastDescription: string | null;
  error: string | null;
  start: () => void;
  stop: () => void;
  retry: () => void;
  voiceActor?: any;
  voiceMachine?: any;
}

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
