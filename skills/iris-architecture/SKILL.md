---
name: iris-architecture
description: >
  Understand Iris project structure and Clean Architecture patterns.
  Trigger: When working with Iris features, adding new functionality, or understanding module interactions.
license: Apache-2.0
metadata:
  author: iris-team
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Adding features to voice or vision modules"
    - "Creating new adapters or use cases"
    - "Working with domain entities or services"
    - "Adding UI components"
    - "Understanding module interactions"
---

## When to Use

- Adding new features to voice or vision modules
- Understanding how modules interact (voice ↔ vision)
- Creating new adapters or use cases
- Working with domain entities or services
- Troubleshooting dependency issues
- Adding UI components following Atomic Design

## Project Structure

```
mobile/src/
├── voice/          # Voice recognition & commands module
├── vision/         # Camera & AI vision module  
└── shared/         # Reusable components & utilities
```

Each module follows **Clean Architecture** with 4 layers:

1. **Domain**: Pure business logic (entities, services, value objects)
2. **Application**: Use cases + ports (interfaces)
3. **Infrastructure**: External implementations (adapters)
4. **Presentation**: React components, hooks, XState machines

## Voice Module

### Structure
```
voice/
├── domain/
│   ├── entities/VoiceCommand.ts          # Voice command entity
│   ├── services/WakeWordParser.ts        # Parse wake word
│   └── value-objects/CommandIntent.ts    # Intent classification
├── application/
│   ├── use-cases/ProcessCommand.ts       # Execute commands
│   └── ports/
│       ├── SpeechSynthesizer.ts          # TTS interface
│       ├── VisionService.ts              # Vision module interface
│       └── DescriptionRepository.ts      # Storage interface
├── infrastructure/
│   ├── adapters/
│   │   ├── expo/ExpoSpeechRecognitionAdapter.ts
│   │   ├── cloud/ReactNativeVoiceAdapter.ts
│   │   ├── whisper/WhisperAdapter.ts
│   │   ├── mock/MockVoiceAdapter.ts
│   │   └── simple/SimpleSpeechAdapter.ts
│   └── services/
│       ├── ContinuousWakeWordService.ts
│       └── PorcupineWakeWordService.ts
├── machines/
│   └── voiceMachine.ts                   # XState state machine
└── presentation/
    └── hooks/
        ├── useVoiceCommands.ts           # Main orchestrator
        ├── useVoiceRecognition.ts
        └── useContinuousWakeWord.ts
```

### Key Files

| File | Purpose |
|------|---------|
| `ProcessCommand.ts` | Main use case: executes DESCRIBE, REPEAT, HELP, STOP, GOODBYE |
| `CommandIntent.ts` | Classifies intent with bilingual regex patterns |
| `voiceMachine.ts` | XState machine: idle → listening → processing → speaking |
| `useVoiceCommands.ts` | Main hook: integrates machine + recognition + use case |

### Command Intents

```typescript
DESCRIBE  // "describe", "what do you see", "qué ves"
REPEAT    // "repeat", "again", "repite"
HELP      // "help", "ayuda"
STOP      // "stop", "para"
GOODBYE   // "goodbye", "adiós"
UNKNOWN   // Fallback
```

## Vision Module

### Structure
```
vision/
├── domain/
│   ├── entities/
│   │   ├── DetectedObject.ts             # Object with bbox, position, size
│   │   └── SceneDescription.ts           # Scene with objects & description
│   ├── services/
│   │   └── SceneDescriptionGenerator.ts  # Natural language generator
│   └── value-objects/
│       └── LabelTranslations.ts          # COCO labels EN→ES
├── application/
│   ├── use-cases/
│   │   └── AnalyzeSceneUseCase.ts        # Capture + analyze
│   └── ports/
│       ├── IVisionService.ts             # Vision AI interface
│       └── ICameraService.ts             # Camera interface
├── infrastructure/
│   └── adapters/
│       ├── tflite/TFLiteVisionAdapter.ts # TensorFlow Lite
│       ├── expo/ExpoCameraAdapter.ts     # Expo Camera
│       └── voice/VisionServiceBridge.ts  # Bridge to voice module
└── presentation/
    ├── components/
    │   └── CameraCapture.tsx             # Hidden camera (1x1px)
    └── hooks/
        └── useVisionService.ts           # Create vision service
```

### Key Files

| File | Purpose |
|------|---------|
| `AnalyzeSceneUseCase.ts` | Orchestrates: permissions → capture → analyze → description |
| `SceneDescriptionGenerator.ts` | Converts detections to Spanish natural language |
| `TFLiteVisionAdapter.ts` | COCO-SSD MobileNet V1 (80 object categories) |
| `VisionServiceBridge.ts` | Connects vision to voice module |
| `LabelTranslations.ts` | Translates COCO labels (person → persona, chair → silla) |

### Object Detection

TensorFlow Lite COCO-SSD model detects:
- 80 object categories (person, car, chair, laptop, etc.)
- Bounding boxes with confidence scores
- Position classification (left/center/right, top/middle/bottom)
- Size classification (small/medium/large)

## Shared Module

### Structure
```
shared/
└── presentation/
    └── components/
        ├── atoms/                        # Basic components
        │   ├── Button.tsx
        │   ├── Icon.tsx
        │   ├── Typography.tsx
        │   ├── PulsingCircle.tsx
        │   └── WakeWordStatusBar.tsx
        ├── molecules/                    # Composite components
        │   └── VoiceCommandPanel.tsx     # Main UI control
        └── pages/
            └── HomeScreen.tsx            # Main app screen
```

Follows **Atomic Design**:
- **Atoms**: Button, Icon, Typography, PulsingCircle
- **Molecules**: VoiceCommandPanel
- **Pages**: HomeScreen

## Module Communication

### Voice → Vision Dependency

```
Voice (ProcessCommandUseCase)
  → VisionService port (interface)
    → VisionServiceBridge (infrastructure)
      → AnalyzeSceneUseCase (vision module)
        → TFLiteVisionAdapter + ExpoCameraAdapter
```

**Why?**
- Voice module doesn't know about TFLite or cameras
- Vision module is replaceable (GPT-4 Vision, Gemini, etc.)
- Bridge pattern maintains independence

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Entity | Noun | `VoiceCommand`, `DetectedObject` |
| Value Object | Descriptive noun | `CommandIntent`, `LabelTranslations` |
| Service | Verb + noun | `WakeWordParser`, `SceneDescriptionGenerator` |
| Use Case | Verb + noun + UseCase | `AnalyzeSceneUseCase`, `ProcessCommandUseCase` |
| Port | I + PascalCase | `IVisionService`, `ICameraService` |
| Adapter | Tech + purpose + Adapter | `TFLiteVisionAdapter`, `ExpoCameraAdapter` |
| Hook | use + PascalCase | `useVoiceCommands`, `useVisionService` |

## Critical Patterns

### 1. Dependency Rule
- Outer layers depend on inner layers
- Domain → Application → Infrastructure → Presentation
- **Never reverse** (infrastructure never imports presentation)

### 2. Ports & Adapters
- Application layer defines **ports** (interfaces)
- Infrastructure layer provides **adapters** (implementations)
- Multiple adapters per port (5 speech recognition options!)

Example:
```typescript
// Application layer (port)
interface IVisionService {
  analyzeImage(uri: string): Promise<SceneDescription>;
  preloadModels(): Promise<void>;
  isReady(): boolean;
}

// Infrastructure layer (adapter)
class TFLiteVisionAdapter implements IVisionService {
  async analyzeImage(uri: string) { /* TFLite implementation */ }
  async preloadModels() { /* Load COCO-SSD */ }
  isReady() { /* Check model loaded */ }
}
```

### 3. Use Cases
- One use case = one application feature
- Orchestrates domain services and entities
- Returns domain entities or DTOs

Example:
```typescript
class AnalyzeSceneUseCase {
  constructor(
    private cameraService: ICameraService,
    private visionService: IVisionService
  ) {}

  async execute(): Promise<SceneDescription> {
    const photo = await this.cameraService.capturePhoto();
    return this.visionService.analyzeImage(photo.uri);
  }
}
```

### 4. State Machines (XState)
Voice flow managed by `voiceMachine`:

```
idle → listening → processing → speaking → idle
  ↓                    ↓            ↓
error ←──────────────┘            └→ retry
```

Guards: `hasWakeWord`, `isHighConfidence`, `isSuccess`

### 5. Bridge Pattern
`VisionServiceBridge` connects modules:
- Implements voice's `VisionService` port
- Uses vision's `AnalyzeSceneUseCase` internally
- Maintains module independence

## Adding New Features

### New Voice Adapter
1. Create `infrastructure/adapters/<tech>/<Tech>Adapter.ts`
2. Implement `SpeechSynthesizer` port
3. Export from `infrastructure/adapters/index.ts`
4. Use in `useVoiceCommands` or `useVoiceRecognition`

### New Vision Adapter
1. Create `infrastructure/adapters/<tech>/<Tech>VisionAdapter.ts`
2. Implement `IVisionService` port
3. Swap in `useVisionService` hook or `VisionServiceBridge`

### New Command Intent
1. Add pattern to `CommandIntent.ts`
2. Handle in `ProcessCommandUseCase.execute()`
3. Add tests in `ProcessCommand.test.ts`

### New UI Component
1. Determine atomic level (atom/molecule/organism/page)
2. Create in `shared/presentation/components/<level>/<Name>.tsx`
3. Add tests in `__tests__/<Name>.test.tsx`
4. Export from index if needed

## Data Flow Example

**User says "Iris, describe"**:

```
1. useVoiceCommands → ExpoSpeechRecognitionAdapter
   Transcript: "Iris, describe"

2. WakeWordParser.parse("Iris, describe", 0.95)
   → ParsedCommand { intent: DESCRIBE, commandText: "describe" }

3. ProcessCommandUseCase.execute(parsedCommand)
   → visionService.analyzeScene()

4. VisionServiceBridge → AnalyzeSceneUseCase.execute()
   → cameraService.capturePhoto()
   → visionService.analyzeImage(photo)

5. TFLiteVisionAdapter runs COCO-SSD
   → Detections: [person: 0.92, chair: 0.85, laptop: 0.78]

6. SceneDescriptionGenerator.generate(detections)
   → "Veo una persona, una silla y un portátil"

7. speechSynthesizer.speak("Veo una persona...")
   repository.saveLastDescription()

8. voiceMachine: processing → speaking → listening
   VoiceCommandPanel updates UI
```

## Technology Stack

| Layer | Voice | Vision |
|-------|-------|--------|
| Domain | Pure JS/TS | Pure JS/TS |
| Application | Pure JS/TS | Pure JS/TS |
| Infrastructure | Expo Speech, Porcupine, Whisper | TensorFlow Lite, Expo Camera |
| Presentation | React, XState | React |

## Testing Strategy

- **Domain**: Unit tests (entities, services, value objects)
- **Application**: Use case tests with mocked ports
- **Presentation**: Component/hook tests with Testing Library
- **State Machines**: XState machine tests

Example test locations:
- `voice/domain/services/__tests__/WakeWordParser.test.ts`
- `voice/application/use-cases/__tests__/ProcessCommand.test.ts`
- `shared/presentation/components/atoms/__tests__/Button.test.tsx`

## Common Gotchas

1. **Don't import presentation from infrastructure**
   - ❌ `import { useVisionService } from '../presentation'`
   - ✅ Use dependency injection or hooks

2. **Don't put business logic in hooks**
   - ❌ Intent classification in `useVoiceCommands`
   - ✅ Use domain services (`WakeWordParser`, `CommandIntent`)

3. **Don't skip the bridge**
   - ❌ Voice directly imports vision's `AnalyzeSceneUseCase`
   - ✅ Use `VisionServiceBridge` to maintain independence

4. **Don't hardcode strings**
   - ❌ `speak("I see a person")`
   - ✅ Use `SceneDescriptionGenerator` or translation files

## Resources

- **Architecture Diagram**: See [assets/architecture-diagram.md](assets/architecture-diagram.md)
- **Feature Checklist**: See [assets/new-feature-checklist.md](assets/new-feature-checklist.md)
