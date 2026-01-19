---
name: voice-state-machine
description: >
  Voice assistant state machine pattern with XState, Whisper, and VAD.
  Trigger: When implementing voice commands, wake word detection, or speech flows.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [mobile]
  auto_invoke:
    - "Implementing voice commands"
    - "Creating speech recognition flows"
    - "Working with wake word detection"
---

## When to Use

- Implementing always-listening voice assistant
- Managing voice recognition state (listening, processing, speaking)
- Coordinating wake word detection with command processing
- Handling voice errors and recovery

---

## State Machine Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      VOICE STATE MACHINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   START    ┌────────────┐   VOICE    ┌────────┐ │
│  │   IDLE   │───────────▶│ LISTENING  │──DETECTED─▶│PROCESS │ │
│  └──────────┘            └────────────┘            └────────┘ │
│       ▲                        │                       │       │
│       │                        │                       │       │
│       │ STOP              TIMEOUT/                COMMAND      │
│       │                    ERROR                   READY       │
│       │                        │                       │       │
│       │                        ▼                       ▼       │
│       │                  ┌──────────┐           ┌──────────┐  │
│       └──────────────────│  ERROR   │           │ SPEAKING │  │
│       │                  └──────────┘           └──────────┘  │
│       │                        │                       │       │
│       │                    RETRY                    DONE       │
│       │                        │                       │       │
│       │                        ▼                       │       │
│       │                  ┌──────────┐                  │       │
│       └──────────────────│RECOVERING│◀─────────────────┘       │
│                          └──────────┘                          │
│                                │                               │
│                           RECOVERED                            │
│                                │                               │
│                                ▼                               │
│                          (LISTENING)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Machine Implementation

```typescript
// machines/voiceMachine.ts
import { setup, assign, fromCallback, fromPromise, sendTo } from 'xstate';

// Types
interface VoiceContext {
  transcript: string;
  command: VoiceCommand | null;
  lastDescription: string | null;
  error: string | null;
  retryCount: number;
}

type VoiceEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'VOICE_DETECTED'; transcript: string; confidence: number }
  | { type: 'WAKE_WORD_DETECTED'; command: string }
  | { type: 'COMMAND_PROCESSED'; description: string }
  | { type: 'SPEECH_DONE' }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' };

// Machine
export const voiceMachine = setup({
  types: {
    context: {} as VoiceContext,
    events: {} as VoiceEvent,
  },

  actors: {
    // Whisper + VAD listener
    whisperListener: fromCallback(({ sendBack, receive }) => {
      let transcriber: RealtimeTranscriber | null = null;

      const start = async () => {
        transcriber = new RealtimeTranscriber(/* config */);
        
        transcriber.onTranscribe((result) => {
          sendBack({
            type: 'VOICE_DETECTED',
            transcript: result.text,
            confidence: result.confidence,
          });
        });

        transcriber.onError((error) => {
          sendBack({ type: 'ERROR', error: error.message });
        });

        await transcriber.start();
      };

      start();

      receive((event) => {
        if (event.type === 'PAUSE') {
          transcriber?.stop();
        }
        if (event.type === 'RESUME') {
          start();
        }
      });

      return () => {
        transcriber?.stop();
      };
    }),

    // Text-to-speech actor
    speechSynthesizer: fromPromise<void, { text: string; language: string }>(
      async ({ input }) => {
        await Speech.speak(input.text, {
          language: input.language,
          rate: 0.85,
          pitch: 1.1,
          onDone: () => {},
        });
      }
    ),

    // Command processor
    commandProcessor: fromPromise<
      { description: string },
      { command: VoiceCommand }
    >(async ({ input }) => {
      const { command } = input;
      // Process command through use case
      const result = await processCommandUseCase.execute(command);
      return { description: result.description };
    }),
  },

  actions: {
    setTranscript: assign({
      transcript: ({ event }) =>
        event.type === 'VOICE_DETECTED' ? event.transcript : '',
    }),

    parseCommand: assign({
      command: ({ context }) => parseWakeWord(context.transcript),
    }),

    setDescription: assign({
      lastDescription: ({ event }) =>
        event.type === 'COMMAND_PROCESSED' ? event.description : null,
    }),

    setError: assign({
      error: ({ event }) => (event.type === 'ERROR' ? event.error : null),
    }),

    clearError: assign({
      error: null,
      retryCount: 0,
    }),

    incrementRetry: assign({
      retryCount: ({ context }) => context.retryCount + 1,
    }),

    pauseListener: sendTo('whisperListener', { type: 'PAUSE' }),
    resumeListener: sendTo('whisperListener', { type: 'RESUME' }),

    // Accessibility feedback
    announceListening: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    announceError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  },

  guards: {
    hasWakeWord: ({ context }) => {
      return context.command !== null;
    },
    canRetry: ({ context }) => {
      return context.retryCount < 3;
    },
    isValidConfidence: ({ event }) => {
      return event.type === 'VOICE_DETECTED' && event.confidence > 0.7;
    },
  },
}).createMachine({
  id: 'voice',
  initial: 'idle',
  context: {
    transcript: '',
    command: null,
    lastDescription: null,
    error: null,
    retryCount: 0,
  },

  states: {
    idle: {
      on: {
        START: { target: 'listening' },
      },
    },

    listening: {
      entry: ['clearError', 'announceListening'],
      invoke: {
        id: 'whisperListener',
        src: 'whisperListener',
      },
      on: {
        VOICE_DETECTED: [
          {
            guard: 'isValidConfidence',
            actions: ['setTranscript', 'parseCommand'],
            target: 'checkingWakeWord',
          },
        ],
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
        STOP: {
          target: 'idle',
        },
      },
    },

    checkingWakeWord: {
      always: [
        {
          guard: 'hasWakeWord',
          target: 'processing',
        },
        {
          target: 'listening',
        },
      ],
    },

    processing: {
      entry: 'pauseListener',
      invoke: {
        src: 'commandProcessor',
        input: ({ context }) => ({ command: context.command! }),
        onDone: {
          target: 'speaking',
          actions: 'setDescription',
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
          }),
        },
      },
    },

    speaking: {
      invoke: {
        src: 'speechSynthesizer',
        input: ({ context }) => ({
          text: context.lastDescription || 'No hay descripción',
          language: 'es-ES',
        }),
        onDone: {
          target: 'recovering',
        },
        onError: {
          target: 'recovering',
        },
      },
      on: {
        STOP: {
          target: 'idle',
        },
      },
    },

    error: {
      entry: ['setError', 'announceError'],
      on: {
        RETRY: [
          {
            guard: 'canRetry',
            target: 'recovering',
            actions: 'incrementRetry',
          },
          {
            target: 'idle',
          },
        ],
        STOP: {
          target: 'idle',
        },
      },
      after: {
        3000: [
          {
            guard: 'canRetry',
            target: 'recovering',
            actions: 'incrementRetry',
          },
        ],
      },
    },

    recovering: {
      entry: 'resumeListener',
      after: {
        500: { target: 'listening' },
      },
    },
  },
});
```

---

## React Hook Integration

```typescript
// presentation/hooks/useVoiceCommands.ts
import { useMachine } from '@xstate/react';
import { voiceMachine } from '../../machines/voiceMachine';
import { useCallback, useEffect } from 'react';

interface UseVoiceCommandsOptions {
  autoStart?: boolean;
  onCommand?: (command: VoiceCommand) => void;
  onDescription?: (description: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}) {
  const { autoStart = false, onCommand, onDescription, onError } = options;

  const [snapshot, send] = useMachine(voiceMachine);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart) {
      send({ type: 'START' });
    }
  }, [autoStart, send]);

  // Callbacks on state changes
  useEffect(() => {
    if (snapshot.matches('processing') && snapshot.context.command) {
      onCommand?.(snapshot.context.command);
    }
  }, [snapshot.value, snapshot.context.command, onCommand]);

  useEffect(() => {
    if (snapshot.context.lastDescription) {
      onDescription?.(snapshot.context.lastDescription);
    }
  }, [snapshot.context.lastDescription, onDescription]);

  useEffect(() => {
    if (snapshot.context.error) {
      onError?.(snapshot.context.error);
    }
  }, [snapshot.context.error, onError]);

  // Actions
  const start = useCallback(() => send({ type: 'START' }), [send]);
  const stop = useCallback(() => send({ type: 'STOP' }), [send]);
  const retry = useCallback(() => send({ type: 'RETRY' }), [send]);

  // Derived state
  const isListening = snapshot.matches('listening');
  const isProcessing = snapshot.matches('processing');
  const isSpeaking = snapshot.matches('speaking');
  const hasError = snapshot.matches('error');
  const isActive = !snapshot.matches('idle');

  return {
    // State
    state: snapshot.value,
    isListening,
    isProcessing,
    isSpeaking,
    hasError,
    isActive,
    
    // Context
    transcript: snapshot.context.transcript,
    command: snapshot.context.command,
    lastDescription: snapshot.context.lastDescription,
    error: snapshot.context.error,

    // Actions
    start,
    stop,
    retry,
    
    // For advanced usage
    send,
    snapshot,
  };
}
```

---

## Component Usage

```typescript
// presentation/components/organisms/VoiceCommandPanel.tsx
import { useVoiceCommands } from '../../hooks/useVoiceCommands';

export function VoiceCommandPanel() {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    hasError,
    transcript,
    lastDescription,
    error,
    start,
    stop,
    retry,
  } = useVoiceCommands({
    autoStart: true,
    onCommand: (cmd) => console.log('Command:', cmd),
    onDescription: (desc) => console.log('Description:', desc),
    onError: (err) => console.error('Error:', err),
  });

  return (
    <View style={styles.container}>
      <StatusIndicator
        status={
          hasError ? 'error' :
          isSpeaking ? 'speaking' :
          isProcessing ? 'processing' :
          isListening ? 'listening' :
          'idle'
        }
      />

      {isListening && (
        <Typography variant="caption">
          {transcript || 'Di "Iris" para comenzar...'}
        </Typography>
      )}

      {isSpeaking && lastDescription && (
        <Typography>{lastDescription}</Typography>
      )}

      {hasError && (
        <View>
          <Typography variant="error">{error}</Typography>
          <Button label="Reintentar" onPress={retry} />
        </View>
      )}

      <IconButton
        icon={isListening ? 'mic-off' : 'mic'}
        label={isListening ? 'Detener' : 'Activar'}
        onPress={isListening ? stop : start}
        accessibilityHint={
          isListening
            ? 'Detiene el reconocimiento de voz'
            : 'Activa el reconocimiento de voz'
        }
      />
    </View>
  );
}
```

---

## Wake Word Parser

```typescript
// domain/services/WakeWordParser.ts
const WAKE_WORD = 'iris';

const COMMAND_PATTERNS = [
  { pattern: /qu[ée]\s*(hay|ves|tiene).*frente/i, intent: 'DESCRIBE' },
  { pattern: /describ[ea]/i, intent: 'DESCRIBE' },
  { pattern: /repe?t[ie]/i, intent: 'REPEAT' },
  { pattern: /ayuda/i, intent: 'HELP' },
  { pattern: /adi[oó]s|chao/i, intent: 'GOODBYE' },
];

export function parseWakeWord(transcript: string): VoiceCommand | null {
  const lower = transcript.toLowerCase();
  
  // Check for wake word
  if (!lower.includes(WAKE_WORD)) {
    return null;
  }

  // Extract command after wake word
  const afterWakeWord = lower.split(WAKE_WORD)[1] || '';
  
  // Match intent
  for (const { pattern, intent } of COMMAND_PATTERNS) {
    if (pattern.test(afterWakeWord)) {
      return {
        text: transcript,
        intent,
        confidence: 1.0,
        timestamp: Date.now(),
      };
    }
  }

  // Default to describe if wake word detected but no specific command
  return {
    text: transcript,
    intent: 'DESCRIBE',
    confidence: 0.8,
    timestamp: Date.now(),
  };
}
```

---

## Testing the Machine

```typescript
// machines/voiceMachine.test.ts
import { createActor } from 'xstate';
import { voiceMachine } from './voiceMachine';

describe('voiceMachine', () => {
  it('should start in idle state', () => {
    const actor = createActor(voiceMachine);
    actor.start();
    
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should transition to listening on START', () => {
    const actor = createActor(voiceMachine);
    actor.start();
    
    actor.send({ type: 'START' });
    
    expect(actor.getSnapshot().value).toBe('listening');
  });

  it('should detect wake word and process command', () => {
    const actor = createActor(voiceMachine);
    actor.start();
    actor.send({ type: 'START' });
    
    actor.send({
      type: 'VOICE_DETECTED',
      transcript: 'Iris, describe lo que hay frente a mí',
      confidence: 0.9,
    });

    expect(actor.getSnapshot().context.command?.intent).toBe('DESCRIBE');
  });
});
```

---

## File Structure

```
voice/
├── domain/
│   ├── entities/
│   │   └── VoiceCommand.ts
│   └── services/
│       └── WakeWordParser.ts
├── application/
│   ├── use-cases/
│   │   └── ProcessCommand.ts
│   └── ports/
│       └── SpeechRecognizer.ts
├── infrastructure/
│   └── adapters/
│       ├── WhisperAdapter.ts
│       └── ExpoSpeechAdapter.ts
├── machines/
│   ├── voiceMachine.ts
│   └── voiceMachine.test.ts
└── presentation/
    ├── hooks/
    │   └── useVoiceCommands.ts
    └── components/
        └── organisms/
            └── VoiceCommandPanel.tsx
```

---

## Best Practices

| Do | Don't |
|----|-------|
| Keep machine logic pure | Put side effects in state transitions |
| Use actors for async/subscriptions | Mix promises in actions |
| Provide callbacks via hook options | Couple UI logic to machine |
| Test machine transitions | Only test UI components |
| Use guards for conditions | Put if/else in actions |
| Handle all error states | Ignore error recovery |
