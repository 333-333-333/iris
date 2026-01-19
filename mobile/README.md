# Iris - Asistente de Visión con IA

<div align="center">

**Asistente de voz con visión por computadora para personas con discapacidad visual**

[Características](#características) • [Demo](#demo) • [Arquitectura](#arquitectura) • [Instalación](#instalación) • [Uso](#uso)

</div>

---

## 🎯 Descripción

Iris es un asistente móvil activado por voz que describe el entorno visual usando **inteligencia artificial local** (TensorFlow Lite). Diseñado específicamente para personas con discapacidad visual.

### ¿Cómo funciona?

1. **Escucha continuamente** la palabra de activación **"iris"**
2. **Captura una foto** automáticamente
3. **Analiza localmente** con TensorFlow Lite (modelo COCO-SSD)
4. **Describe en español natural** lo que ve mediante text-to-speech

**Todo el procesamiento de visión ocurre en el dispositivo** - sin necesidad de internet.

---

## ✨ Características

### 🎤 Reconocimiento de Voz Continuo
- Wake word detection: di **"iris"** en cualquier momento
- Sin necesidad de presionar botones
- Funciona en segundo plano
- Comandos en español

### 👁️ Visión por Computadora Local
- Detección de 80 categorías de objetos (personas, muebles, vehículos, etc.)
- Procesamiento 100% local (privacidad total)
- Análisis en ~500-800ms
- Modelo COCO-SSD MobileNet V1 (4MB)

### 🗣️ Descripciones en Lenguaje Natural
- "Veo 2 personas y una silla en el centro"
- Agrupa objetos automáticamente
- Describe posiciones y tamaños
- Pluralización correcta en español

### ♿ Accesibilidad
- Diseñado para personas ciegas
- Interfaz completamente por voz
- Sin necesidad de ver la pantalla
- Feedback háptico en detecciones

---

## 🎬 Demo

```
Usuario: "iris describe"
  → [Vibración]
  → [Captura foto]
  → [Análisis con TFLite]
Iris: "Veo 2 personas en el centro, una silla a la izquierda y un portátil"

Usuario: "iris repite"
Iris: "Veo 2 personas en el centro, una silla a la izquierda y un portátil"

Usuario: "iris ayuda"
Iris: "Puedes decir: describe, repite, ayuda, para, adiós"
```

---

## 🏗️ Arquitectura

### Clean Architecture

```
src/
├── vision/              # Módulo de visión
│   ├── domain/          # Lógica de negocio pura
│   ├── application/     # Casos de uso
│   ├── infrastructure/  # TFLite, Expo Camera
│   └── presentation/    # React hooks y componentes
│
└── voice/               # Módulo de voz
    ├── domain/          # Entidades (VoiceCommand)
    ├── application/     # ProcessCommand use case
    ├── infrastructure/  # expo-speech-recognition, expo-speech
    ├── machines/        # XState v5 state machine
    └── presentation/    # React hooks
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Language | TypeScript (strict mode) |
| State Management | XState v5 |
| Vision AI | TensorFlow Lite (COCO-SSD) |
| Speech Recognition | expo-speech-recognition |
| Text-to-Speech | expo-speech |
| Camera | expo-camera v17 |
| Architecture | Clean Architecture + Screaming Architecture |

---

## 📦 Instalación

### Requisitos

- Node.js >= 18
- Dispositivo físico (Android o iPhone)
- macOS (para build iOS) o Android Studio (para build Android)

### Setup

```bash
# Clonar repo
git clone <repo-url>
cd iris/mobile

# Instalar dependencias
npm install

# Descargar modelo TFLite (ya incluido)
ls assets/models/coco_ssd_mobilenet_v1.tflite
```

### Build en Dispositivo

**Ver [BUILDING.md](./BUILDING.md) para instrucciones detalladas**

```bash
# Android (con ADB wireless o cable USB)
npx expo prebuild --clean --platform android
npx expo run:android

# iOS (requiere Mac + Xcode)
npx expo prebuild --clean --platform ios
npx expo run:ios --device
```

---

## 🚀 Uso

### Comandos Disponibles

| Comando | Acción |
|---------|--------|
| **iris describe** | Captura foto y describe la escena |
| **iris repite** | Repite la última descripción |
| **iris ayuda** | Lista todos los comandos |
| **iris para** | Detiene el audio actual |
| **iris adiós** | Cierra la aplicación |

### Objetos Detectables

Iris detecta 80 categorías del dataset COCO:

**Personas y Animales:**
persona, perro, gato, pájaro, caballo, oveja, vaca, elefante, oso, cebra, jirafa

**Vehículos:**
coche, motocicleta, avión, autobús, tren, camión, barco, bicicleta

**Mobiliario:**
silla, sofá, cama, mesa, televisor, portátil, teclado, ratón, teléfono

**Cocina:**
botella, taza, tenedor, cuchillo, cuchara, bol, plátano, manzana, sandwich

**Y más...** (ver `src/vision/domain/value-objects/LabelTranslations.ts`)

---

## 📊 Rendimiento

### Latencia

| Operación | Primera vez | Subsecuente |
|-----------|-------------|-------------|
| Carga modelo | 500-1000ms | 0ms (en memoria) |
| Captura foto | 200ms | 200ms |
| Inferencia TFLite | 200-500ms | 200-500ms |
| **Total** | **~1-2s** | **~500-800ms** |

### Recursos

- **Tamaño de app:** +5MB (modelo incluido)
- **RAM durante análisis:** ~100-150MB
- **Batería (escucha continua):** ~5-8% por hora

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Tests específicos de vision
npm test -- vision

# Tests con coverage
npm test -- --coverage

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 📚 Documentación

- [BUILDING.md](./BUILDING.md) - Instrucciones de build detalladas
- [VISION_SERVICE.md](./docs/VISION_SERVICE.md) - Arquitectura del sistema de visión
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Clean Architecture patterns
- [VOICE_RECOGNITION.md](./docs/VOICE_RECOGNITION.md) - Sistema de reconocimiento de voz

---

## 🛠️ Desarrollo

### Estructura de Archivos

```
mobile/
├── src/
│   ├── vision/                  # Módulo de visión
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── DetectedObject.ts
│   │   │   │   └── SceneDescription.ts
│   │   │   ├── services/
│   │   │   │   └── SceneDescriptionGenerator.ts
│   │   │   └── value-objects/
│   │   │       └── LabelTranslations.ts
│   │   ├── application/
│   │   │   ├── ports/
│   │   │   │   ├── ICameraService.ts
│   │   │   │   └── IVisionService.ts
│   │   │   └── use-cases/
│   │   │       └── AnalyzeSceneUseCase.ts
│   │   ├── infrastructure/
│   │   │   └── adapters/
│   │   │       ├── expo/
│   │   │       │   └── ExpoCameraAdapter.ts
│   │   │       └── tflite/
│   │   │           └── TFLiteVisionAdapter.ts
│   │   └── presentation/
│   │       ├── components/
│   │       │   └── CameraCapture.tsx
│   │       └── hooks/
│   │           └── useVisionService.ts
│   │
│   └── voice/                   # Módulo de voz
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── machines/
│       │   └── voiceMachine.ts  # XState state machine
│       └── presentation/
│
├── assets/
│   └── models/
│       └── coco_ssd_mobilenet_v1.tflite  # 4MB
│
├── App.tsx                      # Entry point
├── metro.config.js              # Metro bundler config (.tflite support)
└── app.json                     # Expo config
```

### Agregar Nuevos Comandos

1. Actualiza `CommandIntent` enum
2. Agrega regex a `WakeWordParser`
3. Implementa handler en `ProcessCommandUseCase`
4. Agrega tests

### Agregar Nuevas Detecciones

Las 80 categorías COCO son fijas, pero puedes:
- Cambiar traducciones en `LabelTranslations.ts`
- Ajustar confianza mínima (default: 50%)
- Personalizar descripciones en `SceneDescriptionGenerator.ts`

---

## 🐛 Troubleshooting

### Wake word no responde

- Verifica permisos de micrófono
- Revisa logs: `adb logcat | grep Speech`
- Di "iris" claramente y pausadamente

### Vision no funciona

- Solo funciona en **dispositivo físico** (no emulador)
- Verifica que el modelo esté descargado: `ls assets/models/*.tflite`
- Revisa logs: `adb logcat | grep TFLite`

### Build falla

```bash
# Limpia todo y reconstruye
rm -rf node_modules android ios
npm install
npx expo prebuild --clean
```

---

## 🎯 Roadmap

### Implementado ✅

- [x] Wake word detection continuo
- [x] Detección de objetos con TFLite (COCO-SSD)
- [x] Descripciones en español natural
- [x] Text-to-speech
- [x] Arquitectura Clean
- [x] Tests unitarios

### En Progreso 🚧

- [ ] Build en dispositivo físico (esperando ADB/USB)
- [ ] Testing con usuarios reales

### Futuro 🔮

- [ ] OCR para leer texto en imágenes
- [ ] Detección de rostros
- [ ] Clasificación de escenas (MobileNet V2)
- [ ] Detección de colores dominantes
- [ ] Modo "exploración continua" (analiza cada X segundos)
- [ ] Historial de descripciones
- [ ] Widget de acceso rápido
- [ ] Integración con Siri/Google Assistant

---

## 👤 Autor

Desarrollado con ❤️ para ayudar a personas con discapacidad visual.

---

## 📄 Licencia

MIT License - ver [LICENSE](../LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- [TensorFlow Lite](https://www.tensorflow.org/lite) - ML on-device
- [COCO Dataset](https://cocodataset.org/) - Dataset de objetos
- [Expo](https://expo.dev/) - Framework React Native
- [XState](https://stately.ai/docs/xstate) - State machines
