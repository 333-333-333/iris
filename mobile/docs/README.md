# Iris Documentation Index

Welcome to the Iris documentation. This guide will help you navigate through all available documentation.

## 🚀 Getting Started

Start here if you're new to the project:

1. **[Setup Guide](./setup/SETUP.md)** - Configure your development environment
2. **[Build Instructions](./setup/BUILDING.md)** - Build and run on physical devices
3. **[Development Mode](./dev/DEV_MODE.md)** - Test features without voice commands

## 📐 Architecture

Understand how Iris is structured:

- **[Clean Architecture](./ARCHITECTURE.md)** - Overall architecture patterns and principles
- **[Vision Service](./VISION_SERVICE.md)** - Vision system architecture (TFLite + Azure hybrid)
- **[Voice Recognition](./VOICE_RECOGNITION.md)** - Voice system architecture

## 👁️ Vision System

Documentation for the vision AI features:

- **[Migration: Gemini → Azure](./vision/MIGRATION_GEMINI_TO_AZURE.md)** - Why and how we migrated to Azure Computer Vision
- **[TFLite Setup](./vision/TFLITE_SETUP.md)** - TensorFlow Lite configuration and usage

### Vision Features
- **Hybrid Strategy**: TFLite (local) + Azure Computer Vision (cloud)
- **Object Detection**: 80 COCO categories
- **Spanish Descriptions**: Natural language generation
- **Offline Support**: Works without internet

## 🎤 Voice System

Documentation for the voice recognition features:

- **[Voice Setup](./voice/VOICE_SETUP.md)** - Voice recognition setup
- **[Real Voice Implementation](./voice/REAL_VOICE_IMPLEMENTATION.md)** - Production-ready voice system
- **[Wake Word Detection](./voice/WAKE_WORD_SIMPLE.md)** - Simple wake word implementation
- **[Picovoice Setup](./voice/PICOVOICE_SETUP.md)** - Advanced wake word with Picovoice

### Voice Features
- **Wake Word**: Continuous "iris" detection
- **Commands**: describe, repeat, help, stop, goodbye
- **Text-to-Speech**: Natural Spanish audio
- **Background Listening**: Always ready

## 🛠️ Development

Guides for developers:

- **[Development Mode](./dev/DEV_MODE.md)** - UI panel for testing without voice
- **[Project Status](./dev/STATUS.md)** - Current implementation status
- **[Next Steps](./dev/NEXT_STEPS.md)** - Roadmap and future features

## 📱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Language | TypeScript (strict mode) |
| State Management | XState v5 |
| Vision AI (Local) | TensorFlow Lite (COCO-SSD) |
| Vision AI (Cloud) | Azure Computer Vision v4.0 |
| Speech Recognition | expo-speech-recognition |
| Text-to-Speech | expo-speech |
| Camera | expo-camera v17 |
| Architecture | Clean Architecture + Screaming Architecture |

## 🎯 Quick Links

### Common Tasks

- **First build?** → [Build Instructions](./setup/BUILDING.md)
- **Can't test with voice?** → [Development Mode](./dev/DEV_MODE.md)
- **Vision not working?** → [TFLite Setup](./vision/TFLITE_SETUP.md)
- **Want to understand the code?** → [Clean Architecture](./ARCHITECTURE.md)
- **Azure questions?** → [Migration Guide](./vision/MIGRATION_GEMINI_TO_AZURE.md)

### By Feature

| Feature | Docs |
|---------|------|
| Object Detection | [Vision Service](./VISION_SERVICE.md) |
| Azure Computer Vision | [Migration Guide](./vision/MIGRATION_GEMINI_TO_AZURE.md) |
| Wake Word | [Wake Word Detection](./voice/WAKE_WORD_SIMPLE.md) |
| Commands | [Voice Recognition](./VOICE_RECOGNITION.md) |
| Testing UI | [Development Mode](./dev/DEV_MODE.md) |

## 🔍 Find What You Need

### I want to...

**...run the app for the first time**
→ [Setup Guide](./setup/SETUP.md) → [Build Instructions](./setup/BUILDING.md)

**...understand how vision works**
→ [Vision Service](./VISION_SERVICE.md) → [Migration Guide](./vision/MIGRATION_GEMINI_TO_AZURE.md)

**...test without using voice**
→ [Development Mode](./dev/DEV_MODE.md)

**...add a new feature**
→ [Clean Architecture](./ARCHITECTURE.md) → [Project Status](./dev/STATUS.md)

**...fix build issues**
→ [Build Instructions](./setup/BUILDING.md) (Troubleshooting section)

**...understand the hybrid vision strategy**
→ [Vision Service](./VISION_SERVICE.md) (Hybrid Strategy section)

## 📊 Documentation Structure

```
docs/
├── README.md                    # This file
├── ARCHITECTURE.md              # Clean Architecture patterns
├── VISION_SERVICE.md            # Vision system architecture
├── VOICE_RECOGNITION.md         # Voice system architecture
│
├── setup/                       # Setup & build guides
│   ├── SETUP.md
│   └── BUILDING.md
│
├── vision/                      # Vision-specific docs
│   ├── MIGRATION_GEMINI_TO_AZURE.md
│   └── TFLITE_SETUP.md
│
├── voice/                       # Voice-specific docs
│   ├── VOICE_SETUP.md
│   ├── REAL_VOICE_IMPLEMENTATION.md
│   ├── WAKE_WORD_SIMPLE.md
│   └── PICOVOICE_SETUP.md
│
└── dev/                         # Development guides
    ├── DEV_MODE.md
    ├── STATUS.md
    └── NEXT_STEPS.md
```

## 🤝 Contributing

When adding new documentation:

1. Place it in the appropriate category folder
2. Update this README.md with a link
3. Use clear, descriptive titles
4. Include code examples where relevant
5. Add troubleshooting sections

## 📝 Documentation Standards

- **Language**: English (code and docs)
- **Format**: Markdown
- **Code blocks**: Always specify language
- **Links**: Use relative paths
- **Structure**: Follow existing docs style

---

**Need help?** Check the [Troubleshooting](./setup/BUILDING.md#troubleshooting) section or review [Common Issues](./dev/STATUS.md).
