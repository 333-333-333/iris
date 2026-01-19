# Vision Service - Hybrid Image Analysis

## Overview

We implemented a **hybrid** computer vision system:
- **TensorFlow Lite** (local): Fast object detection, works offline
- **Azure Computer Vision** (cloud): Rich contextual descriptions, internet-dependent

The system **always** uses TFLite locally and enriches with Azure when connected.

## Architecture

### Clean Architecture in 3 Layers

```
src/vision/
├── domain/              # Pure business logic
│   ├── entities/
│   │   ├── DetectedObject.ts      # Detected object (label, confidence, position)
│   │   └── SceneDescription.ts    # Complete scene description
│   ├── services/
│   │   └── SceneDescriptionGenerator.ts  # Generates natural language text
│   └── value-objects/
│       └── LabelTranslations.ts   # EN-ES dictionary (80 COCO categories)
│
├── application/         # Use cases
│   ├── ports/
│   │   ├── ICameraService.ts      # Interface for camera
│   │   └── IVisionService.ts      # Interface for vision analysis
│   └── use-cases/
│       └── AnalyzeSceneUseCase.ts # Orchestrates: capture + analysis + description
│
├── infrastructure/      # Concrete implementations
│   ├── adapters/
│   │   ├── expo/
│   │   │   └── ExpoCameraAdapter.ts        # Implements ICameraService with expo-camera
│   │   ├── tflite/
│   │   │   └── TFLiteVisionAdapter.ts      # Implements IVisionService with TFLite (local)
│   │   ├── azure/
│   │   │   └── AzureVisionAdapter.ts       # Implements IVisionService with Azure CV (cloud)
│   │   ├── hybrid/
│   │   │   └── HybridVisionAdapter.ts      # Combines TFLite + Azure
│   │   └── voice/
│   │       └── VisionServiceBridge.ts      # Connects vision module with voice module
│   └── services/
│
└── presentation/        # UI and hooks
    ├── components/
    │   └── CameraCapture.tsx       # Invisible component with active camera
    └── hooks/
        └── useVisionService.ts     # React hook to access service
```

## Hybrid Strategy: TFLite + Azure

### Why hybrid?

| Aspect | TFLite (Local) | Azure Computer Vision |
|--------|----------------|----------------------|
| **Speed** | ⚡ 200-500ms | 🐌 1-2s (network dependent) |
| **Offline** | ✅ Works without internet | ❌ Requires internet |
| **Privacy** | ✅ 100% private | ⚠️ Sends image to cloud |
| **Detection** | ✅ 80 COCO objects | ✅ 10,000+ objects |
| **Description** | 📝 Basic template | 🎨 Contextual and natural |
| **Cost** | ✅ Always free | ✅ 5,000/month free |

### Implemented Strategy

```
User: "iris describe"
       ↓
1. ALWAYS runs TFLite (local)
   → Detects basic objects
   → Generates structured description
   → Fast and offline
       ↓
2. Is internet available? → Yes
       ↓
3. Enriches with Azure Computer Vision
   → Deep contextual analysis
   → More natural description
   → Combines TFLite objects + Azure description
       ↓
4. Returns best of both worlds
```

### Advantages of This Strategy

1. **Always works**: TFLite guarantees offline functionality
2. **Improves with internet**: Azure adds context and richness
3. **Fast**: TFLite responds first, Azure enriches after
4. **Economical**: 5,000 analyses free/month with Azure

## Execution Flow

### When user says "iris describe" (WITH INTERNET)

```
1. ProcessCommandUseCase.handleDescribe()
           ↓
2. VisionServiceBridge.analyzeScene()
           ↓
3. AnalyzeSceneUseCase.execute()
           ↓
4. ExpoCameraAdapter.capturePhoto()
   → Takes photo with expo-camera
   → Returns local URI
           ↓
5. HybridVisionAdapter.analyzeImage()
           ↓
   5a. TFLiteVisionAdapter.analyzeImage()
       → Loads COCO-SSD model (if not loaded)
       → Runs inference on image (200-500ms)
       → Returns: { objects: [...], naturalDescription: "basic template" }
           ↓
   5b. Checks internet connection
       → NetInfo.fetch() → isConnected: true
           ↓
   5c. AzureVisionAdapter.analyzeImage()
       → Sends image to Azure Computer Vision API
       → Azure analyzes full context (1-2s)
       → Returns: { naturalDescription: "rich and contextual description" }
           ↓
   5d. Combines results
       → objects: from TFLite (with coordinates)
       → naturalDescription: from Azure (more natural)
       → Best of both worlds
           ↓
6. ExpoSpeechSynthesizer.speak(description)
   → TTS reads enriched description
```

### When user says "iris describe" (NO INTERNET)

```
1-4. [Same as above]
           ↓
5. HybridVisionAdapter.analyzeImage()
           ↓
   5a. TFLiteVisionAdapter.analyzeImage()
       → Detects objects locally
       → Returns: { objects: [...], naturalDescription: "template" }
           ↓
   5b. Checks internet connection
       → NetInfo.fetch() → isConnected: false
       → ⚠️ Skips Azure, uses only TFLite
           ↓
   5c. Returns local result
       → objects: from TFLite
       → naturalDescription: generated by SceneDescriptionGenerator
           ↓
6. ExpoSpeechSynthesizer.speak(description)
   → TTS reads local description
```

## Key Components

### 1. DetectedObject (Entity)

```typescript
interface DetectedObject {
  label: string;           // "person" (English, from model)
  labelEs: string;         // "persona" (Spanish, translated)
  confidence: number;      // 0.92 (92% confidence)
  boundingBox: {
    x: 0.2,                // Normalized position (0-1)
    y: 0.3,
    width: 0.4,
    height: 0.5
  };
  position: 'center';      // Calculated: center, left, right, top, bottom
  size: 'large';           // Calculated: large, medium, small
}
```

### 2. SceneDescription (Entity)

```typescript
interface SceneDescription {
  objects: DetectedObject[];
  timestamp: Date;
  confidence: number;      // Average of confidences
  naturalDescription: string;  // "I see 2 people and a chair"
  imageUri?: string;       // URI of analyzed photo
}
```

### 3. SceneDescriptionGenerator (Domain Service)

Converts technical data to natural language:

**Input:**
```json
[
  {"label": "person", "confidence": 0.95},
  {"label": "person", "confidence": 0.92},
  {"label": "chair", "confidence": 0.88}
]
```

**Output:**
```
"I see 2 people and a chair in the center"
```

**Features:**
- Groups objects by type ("2 people" instead of "person, person")
- Uses correct plurals ("chairs", "people")
- Filters by minimum confidence (default: 50%)
- Describes position of main objects
- Handles edge cases (0 objects, 1 object, many objects)

### 4. TFLiteVisionAdapter (Infrastructure)

**Current state:** Mock implementation
- Simulates detections for testing without physical device
- Returns test data: person, chair, laptop

**When building on real device:**
1. Download COCO-SSD model (~5MB)
2. Uncomment react-native-fast-tflite code
3. Load model on app startup
4. Run real inference

**See:** `/mobile/assets/models/README.md` for instructions

### 5. ExpoCameraAdapter (Infrastructure)

- Implements ICameraService using expo-camera
- Handles permissions automatically
- Captures high-quality photos (optimized to 640x640 for TFLite)
- Uses invisible CameraView in background

## Description Examples: TFLite vs Azure

### Example 1: Office

**TFLite Detection (local):**
```
Objects: person (0.92), laptop (0.88), chair (0.76), cup (0.65)
Description: "I see a person, a laptop, a chair and a cup"
```

**Azure Computer Vision (enriched):**
```
Objects: [same as TFLite with coordinates]
Description: "A person working in a modern office with a laptop on the desk and a coffee cup beside"
```

### Example 2: Street

**TFLite Detection (local):**
```
Objects: car (0.91), car (0.88), person (0.83), traffic light (0.72)
Description: "I see 2 cars, a person and a traffic light"
```

**Azure Computer Vision (enriched):**
```
Objects: [same as TFLite]
Description: "An urban street with two parked cars and a person crossing at the traffic light"
```

### Example 3: No Internet (TFLite only)

```
[No internet connection]
Objects: dog (0.89), person (0.85), ball (0.67)
Description: "I see a dog, a person and a ball"
```

## Translations (80 COCO Categories)

The COCO-SSD model detects 80 categories. All are translated to English:

| Category EN | Category ES |
|-------------|-------------|
| person      | persona     |
| car         | coche       |
| chair       | silla       |
| laptop      | portátil    |
| cup         | taza        |
| bottle      | botella     |
| ...         | ...         |

**See:** `LabelTranslations.ts` for complete list

## Integration with Voice Module

### VisionServiceBridge

Adapter that connects both modules while maintaining separation:

```typescript
// Voice module expects:
interface VisionService {
  analyzeScene(): Promise<SceneAnalysis>;
  isReady(): boolean;
}

// Vision module provides:
class AnalyzeSceneUseCase {
  execute(): Promise<SceneDescription>;
}

// Bridge connects both:
class VisionServiceBridge implements VisionService {
  async analyzeScene(): Promise<SceneAnalysis> {
    const description = await this.analyzeSceneUseCase.execute();
    return {
      description: description.naturalDescription,
      objects: description.objects.map(...)
    };
  }
}
```

## Usage from React

### Hook: useVisionService

```typescript
function MyComponent() {
  const { visionService, isReady } = useVisionService({
    preload: true  // Pre-load models on mount
  });

  useEffect(() => {
    if (isReady) {
      console.log('Vision service ready!');
    }
  }, [isReady]);

  return <>{/* ... */}</>;
}
```

### Integration in App.tsx

```typescript
function App() {
  // 1. Initialize vision service
  const { visionService, cameraAdapter } = useVisionService({ preload: true });

  // 2. Pass to voice commands
  return (
    <>
      <HomeScreen visionService={visionService} />
      <CameraCapture onAdapterReady={cameraAdapter.setCameraRef.bind(cameraAdapter)} />
    </>
  );
}
```

## Expected Performance

### First execution:
- Model loading: ~500-1000ms
- Photo capture: ~200-300ms
- TFLite inference: ~200-500ms
- Total: ~1-2 seconds

### Subsequent executions:
- Model in memory (already loaded)
- Capture: ~200-300ms
- Inference: ~200-500ms
- Total: ~500-800ms

### Implemented optimizations:
- ✅ Pre-load models on app startup
- ✅ Camera always active (not started/stopped each time)
- ✅ Image resize to 640x640 (optimal for TFLite)
- ✅ Minimum confidence filter (50%)
- ✅ Cache of last description (for "iris repeat")

## App Size

- **TFLite Models:** ~5-6 MB (COCO-SSD)
- **Vision module code:** ~50 KB
- **Total additional:** ~5-6 MB to APK/IPA

## Next Steps

### To test on real device:

1. **Download COCO-SSD model:**
   ```bash
   cd mobile/assets/models
   curl -L -o coco_ssd_mobilenet_v1.tflite \
     "https://tfhub.dev/tensorflow/lite-model/ssd_mobilenet_v1/1/metadata/2?lite-format=tflite"
   ```

2. **Configure react-native-fast-tflite:**
   ```bash
   cd mobile
   npx expo prebuild --clean
   npx expo run:android  # or run:ios
   ```

3. **Update TFLiteVisionAdapter:**
   - Uncomment real TFLite code
   - Remove mock data

4. **Test command:**
   - Say "iris describe"
   - Verify photo capture
   - Verify object detection
   - Verify description in English

### Future improvements (optional):

- [ ] Add MobileNet V2 for scene classification
- [ ] Detect dominant colors
- [ ] OCR to read text in images
- [ ] Face detection (BlazeFace)
- [ ] "Continuous exploration" mode (analyzes every 5 seconds)
- [ ] Description history with timestamps

## Testing

### Mock for development without device:

The current TFLiteVisionAdapter includes mock data:

```typescript
// MOCK detections
return [
  { label: 'person', confidence: 0.92, ... },
  { label: 'chair', confidence: 0.85, ... },
  { label: 'laptop', confidence: 0.78, ... },
];
```

This enables:
- ✅ Develop UI without needing device
- ✅ Test description generation
- ✅ Validate complete end-to-end flow
- ✅ Write unit tests

### Existing unit tests:

```bash
npm test -- vision
```

Tests:
- SceneDescriptionGenerator with various scenarios
- Label translations
- Position and size calculation
- Confidence filtering

## Troubleshooting

### "Vision service not ready"
→ Models are still loading. Wait a few seconds or call `warmUp()`.

### "Camera permission denied"
→ Go to Settings > Iris > Permissions > Camera > Allow

### "No objects detected"
→ Scene is too dark or no objects recognized by COCO (80 categories)

### Build fails with TFLite
→ Make sure you've run `npx expo prebuild` before `expo run:android`

## Referencias

- [COCO Dataset](https://cocodataset.org/) - 80 categorías detectables
- [TensorFlow Lite](https://www.tensorflow.org/lite) - ML on-device
- [expo-camera docs](https://docs.expo.dev/versions/latest/sdk/camera/)
- [react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite)
