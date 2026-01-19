# Architecture

Clean Architecture implementation for Iris voice assistant.

## Overview

Iris follows Clean Architecture with Domain-Driven Design principles, ensuring separation of concerns and testability.

## Directory structure

```
src/
├── voice/                    # Voice feature module
│   ├── domain/              # Business logic (pure)
│   │   ├── entities/        # Voice commands, results
│   │   ├── services/        # Wake word parser
│   │   └── value-objects/   # Command intent
│   ├── application/         # Use cases
│   │   ├── ports/          # Interfaces (DIP)
│   │   └── use-cases/      # Process command logic
│   ├── infrastructure/      # External adapters
│   │   └── adapters/       # Speech synthesis, recognition
│   ├── machines/           # XState state machines
│   └── presentation/       # React UI layer
│       ├── hooks/          # React hooks
│       └── components/     # UI components
└── shared/                 # Shared utilities
    └── presentation/
        └── components/     # Reusable UI (Atomic Design)
```

## Layers

### Domain layer

Pure business logic with no external dependencies.

**Entities:**
```typescript
// voice/domain/entities/VoiceCommand.ts
export class VoiceCommand {
  constructor(
    public readonly text: string,
    public readonly confidence: number,
    public readonly timestamp: Date
  ) {}

  isHighConfidence(): boolean {
    return this.confidence >= 0.7;
  }
}
```

**Services:**
```typescript
// voice/domain/services/WakeWordParser.ts
export class WakeWordParser {
  parse(text: string, confidence: number): ParsedCommand | null {
    // Wake word detection logic
  }
}
```

**Value objects:**
```typescript
// voice/domain/value-objects/CommandIntent.ts
export enum CommandIntent {
  DESCRIBE = 'DESCRIBE',
  REPEAT = 'REPEAT',
  HELP = 'HELP',
  STOP = 'STOP',
  GOODBYE = 'GOODBYE',
  UNKNOWN = 'UNKNOWN'
}
```

### Application layer

Use cases that orchestrate domain logic.

**Ports (interfaces):**
```typescript
// voice/application/ports/SpeechSynthesizer.ts
export interface SpeechSynthesizer {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}
```

**Use cases:**
```typescript
// voice/application/use-cases/ProcessCommand.ts
export class ProcessCommandUseCase {
  constructor(
    private speechSynthesizer: SpeechSynthesizer,
    private visionService: VisionService,
    private repository: DescriptionRepository
  ) {}

  async execute(command: ParsedCommand): Promise<ProcessCommandResult> {
    // Command processing logic
  }
}
```

### Infrastructure layer

External adapters implementing ports.

**Adapters:**
```typescript
// voice/infrastructure/adapters/expo/ExpoSpeechRecognitionAdapter.ts
export class ExpoSpeechRecognitionAdapter implements SpeechRecognizer {
  async startListening(): Promise<void> {
    await ExpoSpeechRecognitionModule.start({
      lang: 'es-ES'
    });
  }
}
```

### Presentation layer

React components and hooks.

**Hooks:**
```typescript
// voice/presentation/hooks/useVoiceCommands.ts
export function useVoiceCommands(options: Options): Return {
  const [state, send] = useMachine(voiceMachine);
  const voiceRecognition = useVoiceRecognition({
    onTranscript: (text, conf) => {
      send({ type: 'VOICE_DETECTED', transcript: text, confidence: conf });
    }
  });
  // ...
}
```

## State management

### XState v5 state machine

Voice commands flow through a finite state machine:

```typescript
// voice/machines/voiceMachine.ts
export const voiceMachine = setup({
  types: {
    context: {} as VoiceContext,
    events: {} as VoiceEvent,
  },
  actions: {
    setTranscript: assign({ transcript: ({ event }) => event.transcript }),
    // ...
  },
  guards: {
    hasWakeWord: ({ event }) => {
      const parsed = wakeWordParser.parse(event.transcript, event.confidence);
      return parsed !== null;
    },
    // ...
  }
}).createMachine({
  id: 'voice',
  initial: 'idle',
  states: {
    idle: {
      on: { START: { target: 'listening' } }
    },
    listening: {
      on: {
        VOICE_DETECTED: [{
          guard: 'hasWakeWord',
          target: 'processing'
        }]
      }
    },
    processing: {
      on: {
        COMMAND_PROCESSED: {
          guard: 'isSuccess',
          target: 'speaking'
        }
      }
    },
    speaking: {
      on: {
        SPEECH_DONE: { target: 'listening' }
      }
    }
  }
});
```

### State flow diagram

```
┌─────┐   START   ┌───────────┐   VOICE_DETECTED   ┌────────────┐
│idle │ ────────> │ listening │ ─────────────────> │ processing │
└─────┘           └───────────┘    (has wake word)  └────────────┘
                        │                                   │
                        │ STOP                              │ COMMAND_PROCESSED
                        ↓                                   ↓
                    ┌─────┐                          ┌──────────┐
                    │idle │ <──────────────────────  │ speaking │
                    └─────┘      SPEECH_DONE         └──────────┘
```

## Design patterns

### Adapter pattern

Adapters wrap external libraries to match our interfaces:

```typescript
// Port (interface)
interface SpeechSynthesizer {
  speak(text: string): Promise<void>;
}

// Adapter (implementation)
class ExpoSpeechSynthesizer implements SpeechSynthesizer {
  async speak(text: string): Promise<void> {
    Speech.speak(text, this.options); // Expo API
  }
}
```

### Dependency injection

Dependencies injected through constructors:

```typescript
class ProcessCommandUseCase {
  constructor(
    private speechSynthesizer: SpeechSynthesizer, // Interface
    private visionService: VisionService,         // Interface
    private repository: DescriptionRepository     // Interface
  ) {}
}
```

Usage:
```typescript
const useCase = new ProcessCommandUseCase(
  new ExpoSpeechSynthesizer(),    // Concrete implementation
  new VisionServiceImpl(),
  new InMemoryDescriptionRepository()
);
```

### Repository pattern

Abstract data storage:

```typescript
interface DescriptionRepository {
  saveLastDescription(description: string): Promise<void>;
  getLastDescription(): Promise<string | null>;
  clear(): Promise<void>;
}

class InMemoryDescriptionRepository implements DescriptionRepository {
  private lastDescription: string | null = null;
  // Implementation...
}
```

## Testing strategy

### Unit tests

Test pure domain logic in isolation:

```typescript
// voice/domain/services/__tests__/WakeWordParser.test.ts
describe('WakeWordParser', () => {
  it('should detect wake word "iris"', () => {
    const parser = new WakeWordParser();
    const result = parser.parse('iris describe', 0.9);
    expect(result).not.toBeNull();
    expect(result.intent).toBe(CommandIntent.DESCRIBE);
  });
});
```

### Integration tests

Test use cases with mocked ports:

```typescript
// voice/application/use-cases/__tests__/ProcessCommand.test.ts
describe('ProcessCommandUseCase', () => {
  it('should speak description for DESCRIBE command', async () => {
    const mockSpeech = { speak: jest.fn() };
    const useCase = new ProcessCommandUseCase(mockSpeech, ...);
    
    await useCase.execute({ intent: CommandIntent.DESCRIBE });
    
    expect(mockSpeech.speak).toHaveBeenCalled();
  });
});
```

### State machine tests

Test all state transitions:

```typescript
// voice/machines/__tests__/voiceMachine.test.ts
describe('voiceMachine', () => {
  it('should transition from idle to listening on START', () => {
    const actor = createActor(voiceMachine);
    actor.start();
    
    actor.send({ type: 'START' });
    
    expect(actor.getSnapshot().value).toBe('listening');
  });
});
```

## Data flow

### Complete voice command flow

```
User speaks "iris describe"
           ↓
ExpoSpeechRecognitionAdapter detects speech
           ↓
useVoiceRecognition receives transcript
           ↓
useVoiceCommands sends VOICE_DETECTED event
           ↓
voiceMachine validates wake word (guard: hasWakeWord)
           ↓
State transitions to 'processing'
           ↓
ProcessCommandUseCase.execute()
           ↓
VisionService.analyzeScene() [future]
           ↓
ExpoSpeechSynthesizer.speak(description)
           ↓
State transitions to 'speaking'
           ↓
On speech completion: SPEECH_DONE event
           ↓
State transitions back to 'listening'
```

## Component architecture

### Atomic Design

UI components follow Atomic Design methodology:

```
components/
├── atoms/          # Basic building blocks
│   ├── Button.tsx
│   ├── Typography.tsx
│   └── PulsingCircle.tsx
├── molecules/      # Simple combinations
│   └── VoiceCommandPanel.tsx
├── organisms/      # Complex compositions
└── pages/          # Full screens
    └── HomeScreen.tsx
```

### Component hierarchy

```
HomeScreen (page)
    └── VoiceCommandPanel (molecule)
        ├── PulsingCircle (atom)
        ├── Button (atom)
        └── Typography (atom)
```

## Performance considerations

### Memoization

Prevent unnecessary re-renders:

```typescript
const adapter = React.useMemo(
  () => new ExpoSpeechRecognitionAdapter(options),
  [options.language]
);
```

### Cleanup

Always cleanup resources:

```typescript
React.useEffect(() => {
  return () => {
    adapter.destroy(); // Cleanup on unmount
  };
}, []);
```

### State machine optimization

State machines are deterministic and efficient:
- Single source of truth
- Predictable transitions
- No race conditions
- Easy to debug

## Error handling

### Layered error handling

Errors bubble up through layers:

```
Adapter (infrastructure)
    → throws specific error
Hook (presentation)
    → catches, sets state, calls callback
Component (presentation)
    → displays error to user
State Machine
    → transitions to 'error' state
```

### Error types

```typescript
// Domain errors
class InvalidCommandError extends Error {}

// Infrastructure errors
class MicrophonePermissionError extends Error {}
class NetworkError extends Error {}

// Application errors
class CommandProcessingError extends Error {}
```

## Security

### Privacy considerations

- All speech processing on-device (expo-speech-recognition uses native APIs)
- No audio stored or transmitted
- Transcripts not persisted
- Permissions requested at runtime

### Data handling

```typescript
// In-memory only, cleared on app close
class InMemoryDescriptionRepository {
  private lastDescription: string | null = null;
  
  async clear(): Promise<void> {
    this.lastDescription = null;
  }
}
```

## Scalability

### Adding new commands

1. Add intent to `CommandIntent` enum
2. Add regex pattern to `WakeWordParser`
3. Add handler in `ProcessCommandUseCase`
4. Add tests

### Adding new adapters

1. Create adapter implementing interface (port)
2. Update exports in `adapters/index.ts`
3. Switch adapter in hook configuration
4. No changes needed elsewhere (Dependency Inversion)

### Adding new features

Follow Clean Architecture:
1. Define domain entities/services
2. Create use case
3. Define ports (interfaces)
4. Implement adapters
5. Create React hooks
6. Build UI components

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [XState v5 Documentation](https://stately.ai/docs/xstate)
- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
