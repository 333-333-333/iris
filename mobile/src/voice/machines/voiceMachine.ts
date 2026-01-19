import { setup, assign } from 'xstate';
import { WakeWordParser } from '../domain/services/WakeWordParser';

// Types
interface VoiceContext {
  transcript: string;
  error: string | null;
  lastDescription: string | null;
  retryCount: number;
}

type VoiceEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'VOICE_DETECTED'; transcript: string; confidence: number }
  | { type: 'COMMAND_PROCESSED'; success: boolean; description?: string; error?: string; shouldShutdown?: boolean }
  | { type: 'SPEECH_DONE' }
  | { type: 'SHUTDOWN' }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' };

const CONFIDENCE_THRESHOLD = 0.7;
const wakeWordParser = new WakeWordParser();

// Machine
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
