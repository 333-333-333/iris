# Iris Architecture Diagram

## Layer Dependencies

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION                       │
│  React Components, Hooks, XState Machines          │
│                                                     │
│  - useVoiceCommands, useVisionService              │
│  - VoiceCommandPanel, CameraCapture                │
│  - voiceMachine (XState)                           │
└──────────────────┬──────────────────────────────────┘
                   │ depends on
┌──────────────────▼──────────────────────────────────┐
│               INFRASTRUCTURE                        │
│  External Implementations (Adapters)                │
│                                                     │
│  Voice:                                            │
│  - ExpoSpeechRecognitionAdapter                    │
│  - ContinuousWakeWordService                       │
│  - VisionServiceBridge → Vision module             │
│                                                     │
│  Vision:                                           │
│  - TFLiteVisionAdapter (COCO-SSD)                  │
│  - ExpoCameraAdapter                               │
└──────────────────┬──────────────────────────────────┘
                   │ implements
┌──────────────────▼──────────────────────────────────┐
│                APPLICATION                          │
│  Use Cases + Ports (Interfaces)                    │
│                                                     │
│  Voice:                                            │
│  - ProcessCommandUseCase                           │
│  - Ports: SpeechSynthesizer, VisionService         │
│                                                     │
│  Vision:                                           │
│  - AnalyzeSceneUseCase                             │
│  - Ports: IVisionService, ICameraService           │
└──────────────────┬──────────────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────────────┐
│                  DOMAIN                             │
│  Pure Business Logic (no frameworks)                │
│                                                     │
│  Voice:                                            │
│  - VoiceCommand, CommandIntent                     │
│  - WakeWordParser                                  │
│                                                     │
│  Vision:                                           │
│  - DetectedObject, SceneDescription                │
│  - SceneDescriptionGenerator                       │
│  - LabelTranslations                               │
└─────────────────────────────────────────────────────┘
```

## Module Communication

```
┌──────────────────┐         ┌──────────────────┐
│   VOICE MODULE   │         │  VISION MODULE   │
│                  │         │                  │
│  ProcessCommand  │         │ AnalyzeScene     │
│  UseCase         │         │ UseCase          │
│        │         │         │        ▲         │
│        ▼         │         │        │         │
│  VisionService   │◄────────┤  Bridge          │
│  (port/interface)│  impl   │                  │
│                  │         │                  │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│ Expo Speech      │         │ TFLite + Camera  │
│ Recognition      │         │ Adapters         │
└──────────────────┘         └──────────────────┘
```

## Voice Flow (XState Machine)

```
                    ┌─────────┐
                    │  idle   │
                    └────┬────┘
                         │ start()
                         ▼
                  ┌──────────────┐
                  │  listening   │◄───┐
                  └──────┬───────┘    │
                         │ transcript │
                         ▼            │
                  ┌──────────────┐    │
                  │ processing   │    │
                  └──┬───────────┘    │
                     │ success        │
                     ▼                │
                  ┌──────────────┐    │
                  │  speaking    │────┘
                  └──────────────┘
                         │
                         ▼
                    ┌─────────┐
                    │  error  │───► retry
                    └─────────┘
```

## Vision Analysis Flow

```
User Command
    │
    ▼
┌────────────────────┐
│ Check Permissions  │
└────────┬───────────┘
         │ granted
         ▼
┌────────────────────┐
│  Capture Photo     │ (ExpoCameraAdapter)
└────────┬───────────┘
         │ photo.uri
         ▼
┌────────────────────┐
│ Analyze Image      │ (TFLiteVisionAdapter)
└────────┬───────────┘
         │ detections[]
         ▼
┌────────────────────┐
│ Generate           │ (SceneDescriptionGenerator)
│ Description        │
└────────┬───────────┘
         │ "Veo una persona..."
         ▼
┌────────────────────┐
│  Return to Voice   │
│  Module            │
└────────────────────┘
```

## Component Hierarchy (Atomic Design)

```
HomeScreen (page)
    │
    ├─── Typography (atom) - "Iris"
    ├─── Typography (atom) - subtitle
    └─── VoiceCommandPanel (molecule)
            │
            ├─── PulsingCircle (atom) - status indicator
            ├─── Typography (atom) - transcript display
            ├─── Button (atom) - "Activar" / "Detener"
            └─── Button (atom) - "Reintentar" (on error)
```

## Adapter Pattern Example

```
┌─────────────────────────────────────────┐
│      IVisionService (interface)         │
│  - analyzeImage(uri)                    │
│  - preloadModels()                      │
│  - isReady()                            │
└───────────────┬─────────────────────────┘
                │ implemented by
        ┌───────┴──────────┬──────────────┐
        │                  │              │
┌───────▼──────┐  ┌────────▼───────┐  ┌──▼─────────┐
│ TFLiteVision │  │  GPT4Vision    │  │ MockVision │
│ Adapter      │  │  Adapter       │  │ Adapter    │
│ (current)    │  │  (future?)     │  │ (testing)  │
└──────────────┘  └────────────────┘  └────────────┘
```

## File Organization Pattern

```
<feature>/
├── domain/
│   ├── entities/              # Core business objects
│   ├── services/              # Domain logic
│   ├── value-objects/         # Immutable values
│   └── repositories/          # Storage interfaces
│
├── application/
│   ├── use-cases/            # Application features
│   └── ports/                # Interfaces for infrastructure
│
├── infrastructure/
│   ├── adapters/             # External implementations
│   │   ├── <technology>/     # One folder per tech
│   │   └── index.ts          # Export all adapters
│   ├── services/             # Infrastructure services
│   └── mappers/              # Data transformation
│
└── presentation/
    ├── components/           # React components
    ├── hooks/                # React hooks
    └── machines/             # XState machines
```

## Testing Pyramid

```
                    ▲
                   ╱ ╲
                  ╱   ╲
                 ╱ E2E ╲          (Few - full app flows)
                ╱───────╲
               ╱         ╲
              ╱Integration╲       (Some - hook + use case)
             ╱─────────────╲
            ╱               ╲
           ╱   Unit Tests    ╲   (Many - domain + components)
          ╱___________________╲
```

**Unit Tests** (most):
- Domain entities and services
- Value objects
- Atomic components
- Pure functions

**Integration Tests** (medium):
- Use cases with mocked adapters
- Hooks with mocked services
- Molecule/organism components

**E2E Tests** (few):
- Complete voice command flow
- Camera capture → analysis → speech
- Wake word detection → command → response
