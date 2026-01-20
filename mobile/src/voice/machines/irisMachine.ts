/**
 * Iris Voice Assistant State Machine
 * 
 * Orchestrates the complete voice assistant lifecycle:
 * 1. initializing: Load models, request permissions, setup camera
 * 2. listening: Continuous wake word detection ("Iris")
 * 3. processing: Capture photo, analyze scene, generate description
 * 4. speaking: Text-to-speech response
 * 5. error: Handle failures with auto-recovery
 * 
 * The machine coordinates all async operations and ensures proper sequencing.
 * 
 * @example
 * ```typescript
 * const [snapshot, send] = useMachine(irisMachine, {
 *   input: { visionService, cameraAdapter, speechSynthesizer }
 * });
 * ```
 * 
 * @public
 */

import { setup, assign, fromPromise, fromCallback } from 'xstate';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import { WakeWordParser, ParsedCommand } from '../domain/services/WakeWordParser';
import { IntentType } from '../domain/value-objects/CommandIntent';
import { VisionService, SceneAnalysis } from '../application/ports/VisionService';
import { ICameraService } from '../../vision/application/ports/ICameraService';

// ============================================================================
// Types
// ============================================================================

/**
 * External services injected into the machine
 */
export interface IrisMachineInput {
  visionService: VisionService;
  cameraService: ICameraService;
}

/**
 * Machine context (state data)
 */
export interface IrisMachineContext {
  // Services (injected)
  visionService: VisionService | null;
  cameraService: ICameraService | null;
  
  // State data
  transcript: string;
  parsedCommand: ParsedCommand | null;
  lastDescription: string | null;
  error: string | null;
  retryCount: number;
  
  // Readiness flags
  visionReady: boolean;
  cameraReady: boolean;
  permissionsGranted: boolean;
}

/**
 * Machine events
 */
export type IrisMachineEvent =
  // Initialization events
  | { type: 'VISION_READY' }
  | { type: 'CAMERA_READY' }
  | { type: 'PERMISSIONS_GRANTED' }
  | { type: 'INIT_FAILED'; error: string }
  
  // Wake word events
  | { type: 'WAKE_WORD_DETECTED'; transcript: string; command: ParsedCommand }
  | { type: 'SPEECH_PARTIAL'; transcript: string }
  
  // Processing events
  | { type: 'ANALYSIS_COMPLETE'; description: string; analysis: SceneAnalysis }
  | { type: 'ANALYSIS_FAILED'; error: string }
  
  // Speaking events
  | { type: 'SPEECH_STARTED' }
  | { type: 'SPEECH_DONE' }
  
  // Control events
  | { type: 'STOP' }
  | { type: 'RETRY' }
  | { type: 'ERROR'; error: string };

// ============================================================================
// Actors (Async Operations)
// ============================================================================

/**
 * Actor: Initialize all services
 * Runs vision preload and camera permissions in parallel
 */
const initializeActor = fromPromise<
  { visionReady: boolean; cameraReady: boolean; permissionsGranted: boolean },
  { visionService: VisionService | null; cameraService: ICameraService | null }
>(async ({ input }) => {
  console.log('[irisMachine] Initializing services...');
  
  const { visionService, cameraService } = input;
  
  // Run initialization tasks in parallel
  const results = await Promise.all([
    // 1. Warmup vision service (preload models)
    (async () => {
      if (visionService) {
        try {
          await visionService.warmUp?.();
          console.log('[irisMachine] ✓ Vision service ready');
          return true;
        } catch (error) {
          console.error('[irisMachine] ✗ Vision warmup failed:', error);
          return false;
        }
      }
      return false;
    })(),
    
    // 2. Request camera permissions
    (async () => {
      if (cameraService) {
        try {
          const result = await cameraService.requestPermissions();
          console.log('[irisMachine] ✓ Camera permissions:', result.granted);
          return result.granted;
        } catch (error) {
          console.error('[irisMachine] ✗ Camera permissions failed:', error);
          return false;
        }
      }
      return false;
    })(),
    
    // 3. Request microphone permissions
    (async () => {
      try {
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        console.log('[irisMachine] ✓ Microphone permissions:', granted);
        return granted;
      } catch (error) {
        console.error('[irisMachine] ✗ Microphone permissions failed:', error);
        return false;
      }
    })(),
  ]);
  
  return {
    visionReady: results[0],
    cameraReady: results[1],
    permissionsGranted: results[1] && results[2], // camera + mic
  };
});

/**
 * Actor: Continuous wake word listening
 * Uses expo-speech-recognition in continuous mode
 */
const wakeWordListenerActor = fromCallback<
  IrisMachineEvent,
  { wakeWordParser: WakeWordParser }
>(({ sendBack, input }) => {
  console.log('[irisMachine] Starting wake word listener...');
  
  const { wakeWordParser } = input;
  let isListening = false;
  let lastWakeWordTime = 0;
  const COOLDOWN_MS = 2000;

  // Start continuous listening
  const startListening = async () => {
    if (isListening) return;
    
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'es-ES',
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
      });
      isListening = true;
      console.log('[irisMachine] Wake word listener active');
    } catch (error) {
      console.error('[irisMachine] Failed to start listening:', error);
      sendBack({ type: 'ERROR', error: 'No se pudo iniciar el microfono' });
    }
  };

  // Handle speech results
  const handleResult = (event: any) => {
    if (!event.results || event.results.length === 0) return;
    
    const result = event.results[0];
    const transcript = (result.transcript || '').trim();
    const confidence = result.confidence || 0.8;
    const isFinal = result.isFinal || false;
    
    // Send partial transcript for UI feedback
    if (!isFinal && transcript) {
      sendBack({ type: 'SPEECH_PARTIAL', transcript });
    }
    
    // Check for wake word
    const parsed = wakeWordParser.parse(transcript, confidence);
    if (parsed) {
      const now = Date.now();
      if (now - lastWakeWordTime < COOLDOWN_MS) {
        return; // Cooldown active
      }
      lastWakeWordTime = now;
      
      console.log('[irisMachine] Wake word detected:', transcript);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Stop listening before processing
      ExpoSpeechRecognitionModule.stop();
      isListening = false;
      
      sendBack({ 
        type: 'WAKE_WORD_DETECTED', 
        transcript,
        command: parsed,
      });
    }
  };

  // Handle errors
  const handleError = (event: any) => {
    const errorCode = event.error;
    console.warn('[irisMachine] Speech recognition error:', errorCode);
    
    // Recoverable errors - restart
    if (['no-speech', 'no-match'].includes(errorCode)) {
      return;
    }
    
    // Non-recoverable errors
    if (['not-allowed', 'service-not-allowed'].includes(errorCode)) {
      sendBack({ type: 'ERROR', error: 'Permiso de microfono denegado' });
      return;
    }
  };

  // Handle end of recognition
  const handleEnd = () => {
    console.log('[irisMachine] Speech recognition ended');
    isListening = false;
    
    // Auto-restart if we should still be listening
    setTimeout(() => {
      startListening();
    }, 500);
  };

  // Setup event listeners
  const resultSubscription = ExpoSpeechRecognitionModule.addListener('result', handleResult);
  const errorSubscription = ExpoSpeechRecognitionModule.addListener('error', handleError);
  const endSubscription = ExpoSpeechRecognitionModule.addListener('end', handleEnd);

  // Start listening
  startListening();

  // Cleanup
  return () => {
    console.log('[irisMachine] Stopping wake word listener...');
    resultSubscription.remove();
    errorSubscription.remove();
    endSubscription.remove();
    ExpoSpeechRecognitionModule.stop();
  };
});

/**
 * Actor: Analyze scene (capture + vision)
 */
const analyzeSceneActor = fromPromise<
  { description: string; analysis: SceneAnalysis },
  { visionService: VisionService }
>(async ({ input }) => {
  console.log('[irisMachine] Analyzing scene...');
  
  const { visionService } = input;
  
  // The visionService.analyzeScene() handles:
  // 1. Camera capture
  // 2. Vision model inference
  // 3. Description generation
  const analysis = await visionService.analyzeScene();
  
  console.log('[irisMachine] Analysis complete:', analysis.description);
  
  return {
    description: analysis.description,
    analysis,
  };
});

/**
 * Actor: Answer question about the scene
 */
const answerQuestionActor = fromPromise<
  { answer: string },
  { visionService: VisionService; question: string }
>(async ({ input }) => {
  console.log('[irisMachine] Answering question:', input.question);
  
  const { visionService, question } = input;
  
  // Check if vision service supports Q&A
  if (!visionService.answerQuestion) {
    throw new Error('El servicio de vision actual no soporta responder preguntas.');
  }
  
  // Answer the question
  const result = await visionService.answerQuestion(question);
  
  console.log('[irisMachine] Answer:', result.answer);
  
  return {
    answer: result.answer,
  };
});

/**
 * Actor: Speak text using TTS
 */
const speakActor = fromPromise<void, { text: string }>(async ({ input }) => {
  console.log('[irisMachine] Speaking:', input.text.substring(0, 50) + '...');
  
  return new Promise((resolve, reject) => {
    Speech.speak(input.text, {
      language: 'es-ES',
      pitch: 1.0,
      rate: 1.0,
      onDone: () => {
        console.log('[irisMachine] Speech done');
        resolve();
      },
      onError: (error) => {
        console.error('[irisMachine] Speech error:', error);
        reject(error);
      },
    });
  });
});

// ============================================================================
// Machine Definition
// ============================================================================

const wakeWordParser = new WakeWordParser('iris');

/**
 * Main Iris voice assistant state machine
 */
export const irisMachine = setup({
  types: {
    context: {} as IrisMachineContext,
    events: {} as IrisMachineEvent,
    input: {} as IrisMachineInput,
  },
  
  actors: {
    initialize: initializeActor,
    wakeWordListener: wakeWordListenerActor,
    analyzeScene: analyzeSceneActor,
    answerQuestion: answerQuestionActor,
    speak: speakActor,
  },
  
  actions: {
    // Context updates
    setTranscript: assign({
      transcript: ({ event }) => 
        event.type === 'WAKE_WORD_DETECTED' || event.type === 'SPEECH_PARTIAL'
          ? event.transcript 
          : '',
    }),
    
    setParsedCommand: assign({
      parsedCommand: ({ event }) =>
        event.type === 'WAKE_WORD_DETECTED' ? event.command : null,
    }),
    
    // Note: setDescription is not used - we use inline assign in analyzing.onDone
    // because the event.output pattern is different from regular events
    
    setError: assign({
      error: ({ event }) => {
        if (event.type === 'ERROR') return event.error;
        if (event.type === 'ANALYSIS_FAILED') return event.error;
        if (event.type === 'INIT_FAILED') return event.error;
        return null;
      },
    }),
    
    clearError: assign({
      error: null,
    }),
    
    clearTranscript: assign({
      transcript: '',
    }),
    
    // setInitResults is not used - we use inline assign in onDone
    
    incrementRetry: assign({
      retryCount: ({ context }) => context.retryCount + 1,
    }),
    
    resetRetry: assign({
      retryCount: 0,
    }),
    
    // Side effects
    hapticFeedback: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    
    speakFeedback: (_, params: { message: string }) => {
      Speech.speak(params.message, {
        language: 'es-ES',
        pitch: 1.0,
        rate: 1.2, // Slightly faster for feedback
      });
    },
    
    logState: ({ context }, params: { state: string }) => {
      console.log(`[irisMachine] State: ${params.state}`, {
        visionReady: context.visionReady,
        cameraReady: context.cameraReady,
        transcript: context.transcript,
      });
    },
  },
  
  guards: {
    allServicesReady: ({ context }) => 
      context.visionReady && context.cameraReady && context.permissionsGranted,
    
    isDescribeCommand: ({ context }) =>
      context.parsedCommand?.intent.type === IntentType.DESCRIBE,
    
    isHelpCommand: ({ context }) =>
      context.parsedCommand?.intent.type === IntentType.HELP,
    
    isRepeatCommand: ({ context }) =>
      context.parsedCommand?.intent.type === IntentType.REPEAT,
    
    isQuestionCommand: ({ context }) =>
      context.parsedCommand?.intent.type === IntentType.QUESTION,
    
    hasLastDescription: ({ context }) =>
      context.lastDescription !== null,
    
    canRetry: ({ context }) =>
      context.retryCount < 3,
  },
}).createMachine({
  id: 'iris',
  initial: 'initializing',
  
  context: ({ input }) => ({
    // Services
    visionService: input.visionService,
    cameraService: input.cameraService,
    
    // State
    transcript: '',
    parsedCommand: null,
    lastDescription: null,
    error: null,
    retryCount: 0,
    
    // Readiness
    visionReady: false,
    cameraReady: false,
    permissionsGranted: false,
  }),

  states: {
    // =========================================================================
    // INITIALIZING: Load models, request permissions
    // =========================================================================
    initializing: {
      entry: { type: 'logState', params: { state: 'initializing' } },
      
      invoke: {
        src: 'initialize',
        input: ({ context }) => ({
          visionService: context.visionService,
          cameraService: context.cameraService,
        }),
        onDone: {
          target: 'checkingReadiness',
          actions: assign({
            visionReady: ({ event }) => event.output.visionReady,
            cameraReady: ({ event }) => event.output.cameraReady,
            permissionsGranted: ({ event }) => event.output.permissionsGranted,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
          }),
        },
      },
    },

    // =========================================================================
    // CHECKING READINESS: Verify all services are ready
    // =========================================================================
    checkingReadiness: {
      entry: { type: 'logState', params: { state: 'checkingReadiness' } },
      
      always: [
        {
          guard: 'allServicesReady',
          target: 'listening',
        },
        {
          target: 'error',
          actions: assign({
            error: ({ context }) => {
              const issues = [];
              if (!context.visionReady) issues.push('vision');
              if (!context.cameraReady) issues.push('camara');
              if (!context.permissionsGranted) issues.push('permisos');
              return `Servicios no disponibles: ${issues.join(', ')}`;
            },
          }),
        },
      ],
    },

    // =========================================================================
    // LISTENING: Wake word detection active
    // =========================================================================
    listening: {
      entry: [
        { type: 'logState', params: { state: 'listening' } },
        'clearError',
        'clearTranscript',
        'hapticFeedback',
      ],
      
      invoke: {
        src: 'wakeWordListener',
        input: { wakeWordParser },
      },
      
      on: {
        SPEECH_PARTIAL: {
          actions: 'setTranscript',
        },
        
        WAKE_WORD_DETECTED: {
          target: 'processing',
          actions: ['setTranscript', 'setParsedCommand'],
        },
        
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
        
        STOP: {
          target: 'stopped',
        },
      },
    },

    // =========================================================================
    // PROCESSING: Execute command (analyze scene, etc.)
    // =========================================================================
    processing: {
      entry: { type: 'logState', params: { state: 'processing' } },
      
      always: [
        // Route based on command type
        {
          guard: 'isDescribeCommand',
          target: 'analyzing',
        },
        {
          guard: 'isHelpCommand',
          target: 'speakingHelp',
        },
        {
          guard: 'isRepeatCommand',
          target: 'repeating',
        },
        {
          guard: 'isQuestionCommand',
          target: 'answeringQuestion',
        },
        // Default: unknown command
        {
          target: 'speakingError',
          actions: assign({
            error: 'Comando no reconocido. Di ayuda para ver los comandos.',
          }),
        },
      ],
    },

    // =========================================================================
    // ANALYZING: Capture photo and run vision analysis
    // =========================================================================
    analyzing: {
      entry: [
        { type: 'logState', params: { state: 'analyzing' } },
        { type: 'speakFeedback', params: { message: 'Un momento' } },
      ],
      
      invoke: {
        src: 'analyzeScene',
        input: ({ context }) => ({
          visionService: context.visionService!,
        }),
        onDone: {
          target: 'speaking',
          actions: assign({
            lastDescription: ({ event }) => {
              // event.output contains the result from analyzeSceneActor
              const output = event.output as { description: string };
              console.log('[irisMachine] Setting description:', output.description);
              return output.description;
            },
          }),
        },
        onError: {
          target: 'speakingError',
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
          }),
        },
      },
    },

    // =========================================================================
    // SPEAKING: TTS response
    // =========================================================================
    speaking: {
      entry: { type: 'logState', params: { state: 'speaking' } },
      
      invoke: {
        src: 'speak',
        input: ({ context }) => ({
          text: context.lastDescription || 'No hay descripcion disponible.',
        }),
        onDone: {
          target: 'listening',
          actions: 'resetRetry',
        },
        onError: {
          target: 'listening', // Continue even if speech fails
        },
      },
      
      on: {
        STOP: {
          target: 'listening',
          actions: () => Speech.stop(),
        },
      },
    },

    // =========================================================================
    // SPEAKING HELP: Help command response
    // =========================================================================
    speakingHelp: {
      entry: { type: 'logState', params: { state: 'speakingHelp' } },
      
      invoke: {
        src: 'speak',
        input: {
          text: 'Puedes decir: Iris describe, para ver lo que hay frente a ti. Iris repite, para escuchar la ultima descripcion. Hazme cualquier pregunta sobre la imagen despues de describir. Iris ayuda, para escuchar estos comandos. Iris adios, para cerrar.',
        },
        onDone: {
          target: 'listening',
        },
        onError: {
          target: 'listening',
        },
      },
    },

    // =========================================================================
    // REPEATING: Repeat last description
    // =========================================================================
    repeating: {
      entry: { type: 'logState', params: { state: 'repeating' } },
      
      always: [
        {
          guard: 'hasLastDescription',
          target: 'speaking',
        },
        {
          target: 'speakingError',
          actions: assign({
            error: 'No hay descripcion anterior para repetir.',
          }),
        },
      ],
    },

    // =========================================================================
    // ANSWERING QUESTION: Answer question about the scene
    // =========================================================================
    answeringQuestion: {
      entry: [
        { type: 'logState', params: { state: 'answeringQuestion' } },
        { type: 'speakFeedback', params: { message: 'Déjame ver' } },
      ],
      
      invoke: {
        src: 'answerQuestion',
        input: ({ context }) => ({
          visionService: context.visionService!,
          question: context.parsedCommand?.commandText || '',
        }),
        onDone: {
          target: 'speaking',
          actions: assign({
            lastDescription: ({ event }) => {
              const output = event.output as { answer: string };
              console.log('[irisMachine] Setting answer:', output.answer);
              return output.answer;
            },
          }),
        },
        onError: {
          target: 'speakingError',
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
          }),
        },
      },
    },

    // =========================================================================
    // SPEAKING ERROR: Announce error then return to listening
    // =========================================================================
    speakingError: {
      entry: { type: 'logState', params: { state: 'speakingError' } },
      
      invoke: {
        src: 'speak',
        input: ({ context }) => ({
          text: context.error || 'Ocurrio un error.',
        }),
        onDone: {
          target: 'listening',
          actions: 'clearError',
        },
        onError: {
          target: 'listening',
          actions: 'clearError',
        },
      },
    },

    // =========================================================================
    // ERROR: Unrecoverable error state
    // =========================================================================
    error: {
      entry: { type: 'logState', params: { state: 'error' } },
      
      on: {
        RETRY: [
          {
            guard: 'canRetry',
            target: 'initializing',
            actions: 'incrementRetry',
          },
          {
            // Max retries reached, stay in error
          },
        ],
      },
    },

    // =========================================================================
    // STOPPED: Manually stopped
    // =========================================================================
    stopped: {
      entry: { type: 'logState', params: { state: 'stopped' } },
      
      on: {
        RETRY: {
          target: 'initializing',
        },
      },
    },
  },
});

export type IrisMachine = typeof irisMachine;
