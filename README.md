# Iris

Voice-activated AI assistant that describes the visual world for visually impaired users.

> Created for a grandfather who was a photographer before losing his sight.

![Version](https://img.shields.io/badge/v0.2.0-blue?style=flat-square)
![License](https://img.shields.io/badge/MIT-green?style=flat-square)

## Features

- **Hands-free voice activation** - "Hey Iris, describe"
- **Hybrid vision AI** - TFLite (offline) + Azure Computer Vision (online enrichment)
- **Natural speech output** - Clear descriptions in Spanish
- **Battery optimized** - Runs efficiently with dimmed screen
- **Privacy first** - All processing stays on your device

## Repository structure

```
iris/
├── mobile/                 # React Native + Expo app
│   ├── src/
│   │   ├── voice/          # Voice commands feature
│   │   ├── vision/         # Scene analysis feature
│   │   └── shared/         # Shared components & utilities
│   ├── docs/               # Setup & development guides
│   └── package.json
├── skills/                 # AI agent skills (for Claude Code)
└── AGENTS.md               # AI agent guidelines
```

## Tech stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo SDK | 54 |
| Runtime | React | 19.1.0 |
| Vision AI (local) | TensorFlow Lite | - |
| Vision AI (cloud) | Azure Computer Vision | - |
| Models | COCO-SSD, MobileNet | - |
| Voice | `@react-native-voice/voice`, `expo-speech` | - |

## Quick start

### Prerequisites

- Node.js >= 18
- Bun (recommended) or npm
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
# Navigate to mobile app
cd mobile

# Install dependencies
bun install

# Start development server
bun start

# Run on device
bun run ios     # iOS
bun run android # Android
```

## Voice commands

| Command | Action |
|---------|--------|
| "Iris, what's in front of me?" | Capture and describe |
| "Iris, describe" | Alternative capture |
| "Iris, repeat" | Repeat last description |
| "Iris, help" | List commands |
| "Iris, goodbye" | Close assistant |

## Architecture

The mobile app follows **Screaming Architecture + Clean Architecture + Atomic Design**:

```
mobile/src/
├── voice/                  # Feature: Voice commands
│   ├── domain/             # Business logic (entities, value-objects)
│   ├── application/        # Use cases
│   ├── infrastructure/     # External adapters (speech recognition, TTS)
│   └── presentation/       # UI components & hooks
│
├── vision/                 # Feature: Scene analysis
│   ├── domain/
│   ├── application/        # Services (TranslationService)
│   ├── infrastructure/     # Adapters (TFLite, Azure, Hybrid)
│   └── presentation/       # UI components & hooks
│
└── shared/                 # Cross-cutting concerns
    ├── di/                 # Dependency injection
    └── presentation/
        └── components/
            ├── atoms/      # Button, Icon, Typography
            ├── molecules/  # ImagePicker, VisionTestPanel
            ├── organisms/
            ├── templates/
            └── pages/      # HomeScreen, TestScreen
```

### Vision system

```
┌─────────────────────────────────────────────────────┐
│                    User takes photo                  │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │    TFLite (COCO-SSD)         │
            │    ~200ms, offline           │
            │    Objects with coords       │
            └──────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │      Internet?          │
              └────────────┬────────────┘
                    NO     │     YES
                           ▼
              ┌────────────────┐   ┌────────────────────────┐
              │ Use TFLite     │   │ Azure Computer Vision  │
              │ description    │   │ ~1-2s, enriches with   │
              │ only           │   │ natural description    │
              └────────────────┘   └────────────────────────┘
                           │               │
                           └───────┬───────┘
                                   ▼
                        ┌─────────────────────┐
                        │  Hybrid Result      │
                        │  - Objects (TFLite) │
                        │  - Description (Azure) │
                        └─────────────────────┘
```

## Why local-first?

| Benefit | Description |
|---------|-------------|
| Free | No API costs (TFLite) |
| Offline | No internet required for basic functionality |
| Private | Data never leaves device |
| Fast | No network latency for object detection |
| Reliable | No rate limits |

### Model specs

- **COCO-SSD**: 80+ common objects (person, chair, cup, etc.)
- **MobileNet**: 1000+ image categories
- **Size**: ~5MB total
- **Speed**: ~200ms on modern devices

## AI Agent Skills

This project includes **AI agent skills** for Claude Code to help with development:

| Skill | Description |
|-------|-------------|
| `iris-architecture` | Clean Architecture patterns for Iris |
| `tsdoc-comments` | TSDoc-compliant documentation |

Run `ls skills/` to see available skills.

## Build for production

```bash
cd mobile

# Android
eas build --platform android --profile preview

# iOS
eas build --platform ios --profile preview
```

## Roadmap

- [ ] English language support
- [ ] Continuous description mode
- [ ] Distance estimation
- [ ] Face recognition (opt-in)
- [ ] Text reading (OCR)
- [ ] Navigation assistance

## Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
