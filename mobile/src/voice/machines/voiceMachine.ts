/**
 * XState voice recognition state machine
 * 
 * Manages the complete lifecycle of voice command interaction:
 * - Listening for voice input
 * - Detecting wake words
 * - Processing commands
 * - Speaking responses
 * - Error handling and retry logic
 * 
 * @remarks
 * State transitions:
 * 1. idle: Waiting for user to start
 * 2. listening: Microphone active, waiting for voice
 * 3. processing: Processing detected command
 * 4. speaking: Playing response to user
 * 5. error: Error occurred, can retry
 * 
 * Wake word threshold: 0.7 confidence (70%)
 * 
 * @public
 */

import { setup, assign } from 'xstate';
import { WakeWordParser } from '../domain/services/WakeWordParser';

/**
 * Voice machine context (state data)
 * 
 * @internal
 */
interface VoiceContext {
  /** Current transcript from speech recognition */
  transcript: string;
  /** Error message if error state */
  error: string | null;
  /** Last generated scene description for replay */
  lastDescription: string | null;
  /** Number of retries after failure */
  retryCount: number;
}

/**
 * Voice machine events (state transitions)
 * 
 * @internal
 */
type VoiceEvent =
  | { type: 'START' }                                                             // User starts listening
  | { type: 'STOP' }                                                              // User stops listening
  | { type: 'VOICE_DETECTED'; transcript: string; confidence: number }            // Voice detected with transcript
  | { type: 'COMMAND_PROCESSED'; success: boolean; description?: string; error?: string; shouldShutdown?: boolean } // Command executed
  | { type: 'SPEECH_DONE' }                                                       // TTS finished
  | { type: 'SHUTDOWN' }                                                          // App shutdown requested
  | { type: 'ERROR'; error: string }                                              // Error occurred
  | { type: 'RETRY' };                                                            // Retry from error

/** Minimum confidence threshold for wake word detection (70%) */
const CONFIDENCE_THRESHOLD = 0.7;
const wakeWordParser = new WakeWordParser();

/**
 * Voice recognition XState machine configuration
 * 
 * Handles state transitions and guard conditions for voice command flow.
 * Integrates wake word detection, command processing, and error recovery.
 * 
 * @remarks
 * Actions: Update context (transcript, error, description, retry count)
 * Guards: Validate conditions before transitions (wake word, confidence, success)
 * 
 * @public
 */
export const voiceMachine = setup({
  types: {
    context: {} as VoiceContext,
    events: {} as VoiceEvent,
  },

  actions: {
    setTranscript: assign({
      transcript: ({ event }) =>
        event.type === 'VOICE_DETECTED' ? event.transcript : '',
    }),

    clearTranscript: assign({
      transcript: '',
    }),

    setError: assign({
      error: ({ event }) =>
        event.type === 'ERROR' ? event.error :
        event.type === 'COMMAND_PROCESSED' && !event.success ? event.error || 'Unknown error' :
        null,
    }),

    clearError: assign({
      error: null,
    }),

    setLastDescription: assign({
      lastDescription: ({ event }) =>
        event.type === 'COMMAND_PROCESSED' && event.success ? event.description || null : null,
    }),

    incrementRetry: assign({
      retryCount: ({ context }) => context.retryCount + 1,
    }),

    resetRetryCount: assign({
      retryCount: 0,
    }),
  },

  guards: {
    hasWakeWord: ({ event }) => {
      if (event.type !== 'VOICE_DETECTED') return false;
      if (event.confidence < CONFIDENCE_THRESHOLD) return false;
      
      const parsed = wakeWordParser.parse(event.transcript, event.confidence);
      return parsed !== null;
    },

    isHighConfidence: ({ event }) => {
      if (event.type !== 'VOICE_DETECTED') return false;
      return event.confidence >= CONFIDENCE_THRESHOLD;
    },

    isSuccess: ({ event }) => {
      return event.type === 'COMMAND_PROCESSED' && event.success;
    },

    isFailure: ({ event }) => {
      return event.type === 'COMMAND_PROCESSED' && !event.success;
    },
  },
}).createMachine({
  id: 'voice',
  initial: 'idle',
  context: {
    transcript: '',
    error: null,
    lastDescription: null,
    retryCount: 0,
  },

  states: {
    idle: {
      on: {
        START: { target: 'listening' },
      },
    },

    listening: {
      entry: ['clearTranscript', 'clearError'],
      on: {
        VOICE_DETECTED: [
          {
            guard: 'hasWakeWord',
            actions: 'setTranscript',
            target: 'processing',
          },
          {
            guard: 'isHighConfidence',
            actions: 'setTranscript',
            // Stay in listening if high confidence but no wake word
          },
          {
            // Low confidence - ignore
          },
        ],
        STOP: { target: 'idle' },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },

    processing: {
      on: {
        COMMAND_PROCESSED: [
          {
            guard: 'isSuccess',
            target: 'speaking',
            actions: ['setLastDescription', 'resetRetryCount'],
          },
          {
            guard: 'isFailure',
            target: 'error',
            actions: 'setError',
          },
        ],
        STOP: { target: 'idle' },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },

    speaking: {
      on: {
        SPEECH_DONE: {
          target: 'listening',
          actions: 'clearTranscript',
        },
        STOP: { target: 'idle' },
        SHUTDOWN: { target: 'idle' },
      },
    },

    error: {
      on: {
        RETRY: {
          target: 'listening',
          actions: ['incrementRetry', 'clearError'],
        },
        STOP: { target: 'idle' },
      },
    },
  },
});
