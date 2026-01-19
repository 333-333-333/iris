---
name: clean-architecture
description: >
  Clean Architecture + Screaming Architecture patterns for React/React Native.
  Trigger: When structuring features, separating concerns, or defining domain boundaries.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [mobile]
  auto_invoke:
    - "Structuring project architecture"
    - "Creating new features"
    - "Separating business logic from UI"
---

## When to Use

- Starting a new feature
- Refactoring to separate concerns
- Defining domain entities and use cases
- Creating repository/service abstractions
- Structuring a scalable codebase

---

## Core Principles

### Screaming Architecture

> "Your architecture should scream the intent of the system"
> — Uncle Bob

The folder structure should tell you what the app DOES, not what framework it uses.

```
# Bad: Screams "I'm a React app"
src/
├── components/
├── hooks/
├── services/
└── utils/

# Good: Screams "I'm a vision assistant for blind users"
src/
├── voice/           # Voice commands feature
├── vision/          # Scene analysis feature
└── shared/          # Cross-cutting concerns
```

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │  ← UI, Components
├─────────────────────────────────────────┤
│           Application Layer             │  ← Use Cases, Orchestration
├─────────────────────────────────────────┤
│             Domain Layer                │  ← Entities, Business Rules
├─────────────────────────────────────────┤
│          Infrastructure Layer           │  ← External Services, APIs
└─────────────────────────────────────────┘

Dependency Rule: Always point INWARD
  - Presentation → Application → Domain ← Infrastructure
  - Domain knows NOTHING about outer layers
```

---

## Feature Structure

Each feature follows the same internal structure:

```
src/voice/
├── domain/                    # Core business logic (pure)
│   ├── entities/
│   │   └── VoiceCommand.js    # Domain entity
│   ├── repositories/
│   │   └── VoiceRepository.js # Interface (port)
│   └── value-objects/
│       └── CommandType.js     # Immutable value
│
├── application/               # Use cases (orchestration)
│   ├── use-cases/
│   │   ├── ProcessCommand.js
│   │   └── ListenForWakeWord.js
│   └── ports/                 # Interfaces for infra
│       └── SpeechRecognizer.js
│
├── infrastructure/            # External implementations
│   ├── adapters/
│   │   └── RNVoiceAdapter.js  # Implements SpeechRecognizer
│   └── mappers/
│       └── VoiceEventMapper.js
│
└── presentation/              # UI layer
    ├── components/
    ├── hooks/
    │   └── useVoiceCommands.js
    └── screens/
```

---

## Layer Details

### Domain Layer

**Purpose**: Pure business logic. No dependencies on frameworks.

```javascript
// domain/entities/VoiceCommand.js
export class VoiceCommand {
  constructor({ text, confidence, timestamp }) {
    this.text = text;
    this.confidence = confidence;
    this.timestamp = timestamp;
  }

  isValid() {
    return this.confidence > 0.7;
  }

  containsWakeWord(wakeWord = 'iris') {
    return this.text.toLowerCase().includes(wakeWord);
  }

  getIntent() {
    if (this.text.includes('describe')) return 'DESCRIBE';
    if (this.text.includes('repeat')) return 'REPEAT';
    if (this.text.includes('help')) return 'HELP';
    return 'UNKNOWN';
  }
}
```

```javascript
// domain/repositories/VoiceRepository.js (interface)
export class VoiceRepository {
  async getLastCommand() {
    throw new Error('Not implemented');
  }
  
  async saveCommand(command) {
    throw new Error('Not implemented');
  }
}
```

### Application Layer

**Purpose**: Use cases that orchestrate domain logic.

```javascript
// application/use-cases/ProcessCommand.js
export class ProcessCommandUseCase {
  constructor({ voiceRepository, speechSynthesizer, visionService }) {
    this.voiceRepository = voiceRepository;
    this.speechSynthesizer = speechSynthesizer;
    this.visionService = visionService;
  }

  async execute(command) {
    if (!command.isValid()) {
      return { success: false, reason: 'LOW_CONFIDENCE' };
    }

    if (!command.containsWakeWord()) {
      return { success: false, reason: 'NO_WAKE_WORD' };
    }

    const intent = command.getIntent();

    switch (intent) {
      case 'DESCRIBE':
        const description = await this.visionService.describeScene();
        await this.speechSynthesizer.speak(description);
        await this.voiceRepository.saveCommand(command);
        return { success: true, intent, description };

      case 'REPEAT':
        const lastCommand = await this.voiceRepository.getLastCommand();
        await this.speechSynthesizer.speak(lastCommand?.description || 'No hay descripción anterior');
        return { success: true, intent };

      default:
        await this.speechSynthesizer.speak('No entendí el comando');
        return { success: false, reason: 'UNKNOWN_INTENT' };
    }
  }
}
```

```javascript
// application/ports/SpeechRecognizer.js (interface)
export class SpeechRecognizer {
  async startListening() { throw new Error('Not implemented'); }
  async stopListening() { throw new Error('Not implemented'); }
  onResult(callback) { throw new Error('Not implemented'); }
}
```

### Infrastructure Layer

**Purpose**: Implementations of interfaces using external libraries.

```javascript
// infrastructure/adapters/RNVoiceAdapter.js
import Voice from '@react-native-voice/voice';
import { SpeechRecognizer } from '../../application/ports/SpeechRecognizer';

export class RNVoiceAdapter extends SpeechRecognizer {
  constructor() {
    super();
    this.resultCallback = null;
  }

  async startListening() {
    Voice.onSpeechResults = (event) => {
      if (this.resultCallback && event.value?.[0]) {
        this.resultCallback(event.value[0]);
      }
    };
    await Voice.start('es-ES');
  }

  async stopListening() {
    await Voice.stop();
  }

  onResult(callback) {
    this.resultCallback = callback;
  }
}
```

### Presentation Layer

**Purpose**: React components and hooks that consume use cases.

```javascript
// presentation/hooks/useVoiceCommands.js
import { useState, useEffect, useCallback } from 'react';
import { ProcessCommandUseCase } from '../../application/use-cases/ProcessCommand';
import { VoiceCommand } from '../../domain/entities/VoiceCommand';

export function useVoiceCommands(dependencies) {
  const [isListening, setIsListening] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const processCommand = useMemo(
    () => new ProcessCommandUseCase(dependencies),
    [dependencies]
  );

  const handleVoiceResult = useCallback(async (text, confidence) => {
    const command = new VoiceCommand({
      text,
      confidence,
      timestamp: Date.now(),
    });

    const result = await processCommand.execute(command);
    setLastResult(result);
  }, [processCommand]);

  return { isListening, lastResult, handleVoiceResult };
}
```

---

## Dependency Injection

```javascript
// src/shared/di/container.js
import { RNVoiceAdapter } from '../../voice/infrastructure/adapters/RNVoiceAdapter';
import { ExpoSpeechAdapter } from '../../voice/infrastructure/adapters/ExpoSpeechAdapter';
import { TFLiteVisionAdapter } from '../../vision/infrastructure/adapters/TFLiteVisionAdapter';

// Create instances
const speechRecognizer = new RNVoiceAdapter();
const speechSynthesizer = new ExpoSpeechAdapter();
const visionService = new TFLiteVisionAdapter();

// Export configured dependencies
export const container = {
  speechRecognizer,
  speechSynthesizer,
  visionService,
};
```

```javascript
// App.js
import { container } from './src/shared/di/container';

function App() {
  return (
    <DependencyProvider container={container}>
      <MainScreen />
    </DependencyProvider>
  );
}
```

---

## Testing Benefits

```javascript
// Use case test with mocked dependencies
describe('ProcessCommandUseCase', () => {
  it('should describe scene on DESCRIBE intent', async () => {
    const mockVision = { describeScene: jest.fn().mockResolvedValue('Una persona') };
    const mockSpeech = { speak: jest.fn() };
    const mockRepo = { saveCommand: jest.fn() };

    const useCase = new ProcessCommandUseCase({
      visionService: mockVision,
      speechSynthesizer: mockSpeech,
      voiceRepository: mockRepo,
    });

    const command = new VoiceCommand({
      text: 'iris describe',
      confidence: 0.9,
      timestamp: Date.now(),
    });

    const result = await useCase.execute(command);

    expect(result.success).toBe(true);
    expect(mockVision.describeScene).toHaveBeenCalled();
    expect(mockSpeech.speak).toHaveBeenCalledWith('Una persona');
  });
});
```

---

## Rules

| Rule | Reason |
|------|--------|
| Domain has NO imports from other layers | Keeps business logic pure and testable |
| Use cases receive dependencies via constructor | Enables testing with mocks |
| Infrastructure implements domain interfaces | Dependency inversion |
| Presentation only talks to Application layer | UI doesn't know about infra details |
| One use case = one action | Single responsibility |
| Entities contain business rules | Logic lives with data |

---

## Anti-patterns

| Don't | Do |
|-------|-----|
| Import React in domain layer | Keep domain framework-agnostic |
| Call APIs directly from components | Go through use cases |
| Put business logic in components | Move to domain/application |
| Create circular dependencies | Always depend inward |
| Giant use cases doing everything | Split into focused use cases |
