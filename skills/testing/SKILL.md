---
name: testing
description: >
  TDD patterns for React Native with Jest, Testing Library, and XState.
  Trigger: When writing tests, implementing TDD, or setting up test infrastructure.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  type: generic
  scope: [mobile]
  auto_invoke:
    - "Writing tests"
    - "Implementing TDD"
    - "Setting up test infrastructure"
    - "Mocking dependencies"
---

## When to Use

- Starting a new feature (write tests FIRST)
- Testing React Native components
- Testing XState machines
- Testing custom hooks
- Testing domain logic and use cases
- Mocking native modules and external services

---

## TDD Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    TDD CYCLE                            │
│                                                         │
│     ┌───────┐      ┌───────┐      ┌──────────┐        │
│     │  RED  │─────▶│ GREEN │─────▶│ REFACTOR │        │
│     └───────┘      └───────┘      └──────────┘        │
│         │                              │               │
│         │                              │               │
│         └──────────────────────────────┘               │
│                                                         │
│  1. RED: Write failing test first                      │
│  2. GREEN: Write minimum code to pass                  │
│  3. REFACTOR: Improve code, keep tests passing         │
└─────────────────────────────────────────────────────────┘
```

### TDD Rules

| Rule | Description |
|------|-------------|
| Test first | Write the test BEFORE the implementation |
| One test at a time | Focus on one behavior per test |
| Minimal code | Write just enough to make test pass |
| Refactor often | Clean up after each green |
| No production code without a failing test | Every line justified |

---

## Installation

```bash
cd mobile

# Testing libraries
bun add -d jest @types/jest ts-jest
bun add -d @testing-library/react-native @testing-library/jest-native
bun add -d jest-expo

# For XState testing
bun add -d @xstate/test
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
};
```

---

## Test File Structure

```
feature/
├── domain/
│   ├── entities/
│   │   ├── VoiceCommand.ts
│   │   └── __tests__/
│   │       └── VoiceCommand.test.ts
│   └── services/
│       ├── WakeWordParser.ts
│       └── __tests__/
│           └── WakeWordParser.test.ts
├── application/
│   └── use-cases/
│       ├── ProcessCommand.ts
│       └── __tests__/
│           └── ProcessCommand.test.ts
├── machines/
│   ├── voiceMachine.ts
│   └── __tests__/
│       └── voiceMachine.test.ts
└── presentation/
    ├── hooks/
    │   ├── useVoiceCommands.ts
    │   └── __tests__/
    │       └── useVoiceCommands.test.ts
    └── components/
        └── organisms/
            ├── VoiceCommandPanel.tsx
            └── __tests__/
                └── VoiceCommandPanel.test.tsx
```

---

## Testing Domain Entities (TDD Example)

### Step 1: RED - Write Failing Test

```typescript
// domain/entities/__tests__/VoiceCommand.test.ts
import { VoiceCommand } from '../VoiceCommand';

describe('VoiceCommand', () => {
  describe('isValid', () => {
    it('should return true when confidence is above threshold', () => {
      const command = new VoiceCommand({
        text: 'iris describe',
        confidence: 0.8,
        timestamp: Date.now(),
      });

      expect(command.isValid()).toBe(true);
    });

    it('should return false when confidence is below threshold', () => {
      const command = new VoiceCommand({
        text: 'iris describe',
        confidence: 0.5,
        timestamp: Date.now(),
      });

      expect(command.isValid()).toBe(false);
    });
  });

  describe('containsWakeWord', () => {
    it('should detect wake word "iris" case-insensitive', () => {
      const command = new VoiceCommand({
        text: 'IRIS describe what you see',
        confidence: 0.9,
        timestamp: Date.now(),
      });

      expect(command.containsWakeWord()).toBe(true);
    });

    it('should return false when wake word is missing', () => {
      const command = new VoiceCommand({
        text: 'describe what you see',
        confidence: 0.9,
        timestamp: Date.now(),
      });

      expect(command.containsWakeWord()).toBe(false);
    });

    it('should allow custom wake word', () => {
      const command = new VoiceCommand({
        text: 'hey siri describe',
        confidence: 0.9,
        timestamp: Date.now(),
      });

      expect(command.containsWakeWord('siri')).toBe(true);
      expect(command.containsWakeWord('iris')).toBe(false);
    });
  });
});
```

### Step 2: GREEN - Implement to Pass

```typescript
// domain/entities/VoiceCommand.ts
interface VoiceCommandProps {
  text: string;
  confidence: number;
  timestamp: number;
}

export class VoiceCommand {
  readonly text: string;
  readonly confidence: number;
  readonly timestamp: number;

  private static CONFIDENCE_THRESHOLD = 0.7;

  constructor({ text, confidence, timestamp }: VoiceCommandProps) {
    this.text = text;
    this.confidence = confidence;
    this.timestamp = timestamp;
  }

  isValid(): boolean {
    return this.confidence > VoiceCommand.CONFIDENCE_THRESHOLD;
  }

  containsWakeWord(wakeWord: string = 'iris'): boolean {
    return this.text.toLowerCase().includes(wakeWord.toLowerCase());
  }
}
```

### Step 3: REFACTOR - Improve

```typescript
// Add more tests, extract constants, improve naming
```

---

## Testing Use Cases

```typescript
// application/use-cases/__tests__/ProcessCommand.test.ts
import { ProcessCommandUseCase } from '../ProcessCommand';
import { VoiceCommand } from '../../domain/entities/VoiceCommand';

describe('ProcessCommandUseCase', () => {
  // Mocks
  const mockVisionService = {
    analyzeScene: jest.fn(),
  };
  const mockSpeechSynthesizer = {
    speak: jest.fn(),
  };
  const mockRepository = {
    saveCommand: jest.fn(),
    getLastDescription: jest.fn(),
  };

  let useCase: ProcessCommandUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ProcessCommandUseCase({
      visionService: mockVisionService,
      speechSynthesizer: mockSpeechSynthesizer,
      repository: mockRepository,
    });
  });

  describe('execute with DESCRIBE intent', () => {
    it('should analyze scene and speak description', async () => {
      // Arrange
      const command = new VoiceCommand({
        text: 'iris describe',
        confidence: 0.9,
        timestamp: Date.now(),
      });
      command.intent = 'DESCRIBE';
      
      mockVisionService.analyzeScene.mockResolvedValue({
        description: 'Veo una persona y una silla',
        objects: [{ label: 'person' }, { label: 'chair' }],
      });

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockVisionService.analyzeScene).toHaveBeenCalledTimes(1);
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        'Veo una persona y una silla'
      );
      expect(result.success).toBe(true);
      expect(result.description).toBe('Veo una persona y una silla');
    });

    it('should handle vision service errors', async () => {
      // Arrange
      const command = new VoiceCommand({
        text: 'iris describe',
        confidence: 0.9,
        timestamp: Date.now(),
      });
      command.intent = 'DESCRIBE';
      
      mockVisionService.analyzeScene.mockRejectedValue(
        new Error('Camera not available')
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Camera not available');
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        expect.stringContaining('error')
      );
    });
  });

  describe('execute with REPEAT intent', () => {
    it('should repeat last description', async () => {
      // Arrange
      const command = new VoiceCommand({
        text: 'iris repeat',
        confidence: 0.9,
        timestamp: Date.now(),
      });
      command.intent = 'REPEAT';
      
      mockRepository.getLastDescription.mockResolvedValue(
        'Veo una persona y una silla'
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockVisionService.analyzeScene).not.toHaveBeenCalled();
      expect(mockSpeechSynthesizer.speak).toHaveBeenCalledWith(
        'Veo una persona y una silla'
      );
    });
  });
});
```

---

## Testing XState Machines

```typescript
// machines/__tests__/voiceMachine.test.ts
import { createActor, waitFor } from 'xstate';
import { voiceMachine } from '../voiceMachine';

describe('voiceMachine', () => {
  describe('initial state', () => {
    it('should start in idle state', () => {
      const actor = createActor(voiceMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });

  describe('START event', () => {
    it('should transition from idle to listening', () => {
      const actor = createActor(voiceMachine);
      actor.start();

      actor.send({ type: 'START' });

      expect(actor.getSnapshot().value).toBe('listening');
    });
  });

  describe('VOICE_DETECTED event', () => {
    it('should update transcript in context', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.9,
      });

      expect(actor.getSnapshot().context.transcript).toBe('iris describe');
    });

    it('should ignore low confidence transcripts', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe',
        confidence: 0.3, // Below threshold
      });

      // Should stay in listening, not process
      expect(actor.getSnapshot().value).toBe('listening');
    });

    it('should transition to processing when wake word detected', () => {
      const actor = createActor(
        voiceMachine.provide({
          actors: {
            whisperListener: () => () => {},
            commandProcessor: async () => ({ description: 'test' }),
          },
        })
      );
      actor.start();
      actor.send({ type: 'START' });

      actor.send({
        type: 'VOICE_DETECTED',
        transcript: 'iris describe what you see',
        confidence: 0.9,
      });

      // Should have parsed command
      expect(actor.getSnapshot().context.command).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should transition to error state on ERROR event', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });

      actor.send({ type: 'ERROR', error: 'Microphone access denied' });

      expect(actor.getSnapshot().value).toBe('error');
      expect(actor.getSnapshot().context.error).toBe('Microphone access denied');
    });

    it('should auto-retry up to 3 times', async () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({ type: 'ERROR', error: 'Temporary error' });

      // First retry
      actor.send({ type: 'RETRY' });
      expect(actor.getSnapshot().context.retryCount).toBe(1);

      // Second retry
      actor.send({ type: 'ERROR', error: 'Temporary error' });
      actor.send({ type: 'RETRY' });
      expect(actor.getSnapshot().context.retryCount).toBe(2);
    });
  });

  describe('STOP event', () => {
    it('should return to idle from any state', () => {
      const actor = createActor(voiceMachine);
      actor.start();
      actor.send({ type: 'START' });
      
      expect(actor.getSnapshot().value).toBe('listening');
      
      actor.send({ type: 'STOP' });
      
      expect(actor.getSnapshot().value).toBe('idle');
    });
  });
});
```

---

## Testing React Native Components

```typescript
// presentation/components/__tests__/VoiceCommandPanel.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { VoiceCommandPanel } from '../VoiceCommandPanel';

// Mock the hook
jest.mock('../../hooks/useVoiceCommands', () => ({
  useVoiceCommands: jest.fn(),
}));

import { useVoiceCommands } from '../../hooks/useVoiceCommands';

const mockUseVoiceCommands = useVoiceCommands as jest.MockedFunction<
  typeof useVoiceCommands
>;

describe('VoiceCommandPanel', () => {
  const defaultMockReturn = {
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    hasError: false,
    transcript: '',
    lastDescription: null,
    error: null,
    start: jest.fn(),
    stop: jest.fn(),
    retry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceCommands.mockReturnValue(defaultMockReturn);
  });

  it('should render activate button when idle', () => {
    render(<VoiceCommandPanel />);

    expect(screen.getByRole('button', { name: /activar/i })).toBeOnTheScreen();
  });

  it('should call start when activate button pressed', () => {
    const start = jest.fn();
    mockUseVoiceCommands.mockReturnValue({
      ...defaultMockReturn,
      start,
    });

    render(<VoiceCommandPanel />);
    fireEvent.press(screen.getByRole('button', { name: /activar/i }));

    expect(start).toHaveBeenCalledTimes(1);
  });

  it('should show listening status when active', () => {
    mockUseVoiceCommands.mockReturnValue({
      ...defaultMockReturn,
      isListening: true,
    });

    render(<VoiceCommandPanel />);

    expect(screen.getByText(/di "iris" para comenzar/i)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /detener/i })).toBeOnTheScreen();
  });

  it('should display transcript while listening', () => {
    mockUseVoiceCommands.mockReturnValue({
      ...defaultMockReturn,
      isListening: true,
      transcript: 'iris describe',
    });

    render(<VoiceCommandPanel />);

    expect(screen.getByText('iris describe')).toBeOnTheScreen();
  });

  it('should show error message and retry button on error', () => {
    const retry = jest.fn();
    mockUseVoiceCommands.mockReturnValue({
      ...defaultMockReturn,
      hasError: true,
      error: 'Microphone access denied',
      retry,
    });

    render(<VoiceCommandPanel />);

    expect(screen.getByText('Microphone access denied')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: /reintentar/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('should display description when speaking', () => {
    mockUseVoiceCommands.mockReturnValue({
      ...defaultMockReturn,
      isSpeaking: true,
      lastDescription: 'Veo una persona y una silla',
    });

    render(<VoiceCommandPanel />);

    expect(screen.getByText('Veo una persona y una silla')).toBeOnTheScreen();
  });
});
```

---

## Testing Custom Hooks

```typescript
// presentation/hooks/__tests__/useVoiceCommands.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVoiceCommands } from '../useVoiceCommands';

// Mock XState
jest.mock('xstate', () => ({
  ...jest.requireActual('xstate'),
  createActor: jest.fn(),
}));

describe('useVoiceCommands', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useVoiceCommands());

    expect(result.current.isListening).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.transcript).toBe('');
  });

  it('should auto-start when autoStart option is true', () => {
    const { result } = renderHook(() =>
      useVoiceCommands({ autoStart: true })
    );

    // Machine should have received START event
    expect(result.current.isListening).toBe(true);
  });

  it('should call onCommand callback when command processed', async () => {
    const onCommand = jest.fn();
    const { result } = renderHook(() =>
      useVoiceCommands({ onCommand })
    );

    act(() => {
      result.current.start();
    });

    // Simulate voice detection
    // ... trigger state change

    await waitFor(() => {
      expect(onCommand).toHaveBeenCalled();
    });
  });

  it('should call onError callback on error', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useVoiceCommands({ onError })
    );

    // Simulate error
    // ...

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
```

---

## Mocking Native Modules

```typescript
// __mocks__/expo-speech.ts
export const speak = jest.fn().mockImplementation((text, options) => {
  // Simulate async completion
  setTimeout(() => {
    options?.onDone?.();
  }, 100);
});

export const stop = jest.fn();
export const isSpeakingAsync = jest.fn().mockResolvedValue(false);
```

```typescript
// __mocks__/expo-haptics.ts
export const impactAsync = jest.fn().mockResolvedValue(undefined);
export const notificationAsync = jest.fn().mockResolvedValue(undefined);

export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
};

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
};
```

```typescript
// jest.setup.js
jest.mock('expo-speech');
jest.mock('expo-haptics');
jest.mock('expo-camera', () => ({
  Camera: {
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  },
  CameraView: 'CameraView',
}));
```

---

## Test Patterns

### Arrange-Act-Assert (AAA)

```typescript
it('should do something', () => {
  // Arrange - setup test data and mocks
  const input = { text: 'iris describe', confidence: 0.9 };
  
  // Act - execute the code under test
  const result = parseCommand(input);
  
  // Assert - verify the outcome
  expect(result.intent).toBe('DESCRIBE');
});
```

### Given-When-Then (BDD Style)

```typescript
describe('VoiceCommand', () => {
  describe('given a high confidence transcript', () => {
    describe('when checking validity', () => {
      it('then should return true', () => {
        const command = new VoiceCommand({ confidence: 0.9, ... });
        expect(command.isValid()).toBe(true);
      });
    });
  });
});
```

---

## Commands

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test VoiceCommand.test.ts

# Run tests with coverage
bun test --coverage

# Run tests matching pattern
bun test --testNamePattern="should detect wake word"

# Update snapshots
bun test --updateSnapshot
```

---

## Best Practices

| Do | Don't |
|----|-------|
| Write test FIRST (TDD) | Write tests after implementation |
| Test behavior, not implementation | Test internal details |
| One assertion focus per test | Multiple unrelated assertions |
| Use descriptive test names | Use generic names like "test1" |
| Mock at boundaries (ports) | Mock everything |
| Test edge cases | Only test happy path |
| Keep tests fast (<100ms each) | Slow tests with real delays |
| Use factories for test data | Duplicate setup in every test |

---

## Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Domain entities | 100% | Core business logic |
| Use cases | 90%+ | Application logic |
| State machines | 90%+ | All transitions |
| Hooks | 80%+ | Integration points |
| Components | 70%+ | UI behavior |
| Infrastructure | 60%+ | Adapters (mocked in other tests) |
