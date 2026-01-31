---
name: tensorflow-lite
description: >
  TensorFlow Lite integration for on-device ML in React Native.
  Trigger: When working with object detection, image classification, or ML models.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  type: project
  scope: [mobile]
  auto_invoke:
    - "Implementing object detection"
    - "Working with ML models"
    - "Image classification tasks"
---

## When to Use

- Implementing object detection (COCO-SSD)
- Image classification (MobileNet)
- Loading and running TensorFlow models
- Processing camera frames for ML
- Optimizing ML performance on mobile

---

## Critical Patterns

### Setup

```bash
# Install TensorFlow.js and React Native adapter
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native

# Install models
npm install @tensorflow-models/coco-ssd @tensorflow-models/mobilenet

# iOS: Install pods
cd ios && pod install
```

### Initialization

```javascript
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// MUST call this before using TensorFlow
async function initTensorFlow() {
  await tf.ready();
  console.log('TensorFlow.js ready, backend:', tf.getBackend());
}
```

---

## Object Detection (COCO-SSD)

```javascript
import * as cocoSsd from '@tensorflow-models/coco-ssd';

class ObjectDetector {
  constructor() {
    this.model = null;
  }

  async load() {
    // lite_mobilenet_v2 is fastest, mobilenet_v2 is most accurate
    this.model = await cocoSsd.load({
      base: 'lite_mobilenet_v2',
    });
  }

  async detect(imageTensor, minConfidence = 0.6) {
    if (!this.model) throw new Error('Model not loaded');
    
    const predictions = await this.model.detect(imageTensor);
    
    return predictions
      .filter(p => p.score >= minConfidence)
      .map(p => ({
        class: p.class,
        score: p.score,
        bbox: p.bbox, // [x, y, width, height]
      }));
  }
}
```

### COCO-SSD Classes (80 objects)

| Category | Objects |
|----------|---------|
| Person | person |
| Vehicles | bicycle, car, motorcycle, airplane, bus, train, truck, boat |
| Animals | bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe |
| Furniture | chair, couch, bed, dining table, toilet |
| Electronics | tv, laptop, mouse, remote, keyboard, cell phone |
| Food | banana, apple, sandwich, orange, broccoli, carrot, pizza, donut, cake |
| Household | bottle, cup, fork, knife, spoon, bowl, book, clock, vase, scissors |

---

## Image Classification (MobileNet)

```javascript
import * as mobilenet from '@tensorflow-models/mobilenet';

class ImageClassifier {
  constructor() {
    this.model = null;
  }

  async load() {
    // version: 1 or 2, alpha: 0.25, 0.5, 0.75, 1.0
    // Higher alpha = more accurate but slower
    this.model = await mobilenet.load({
      version: 2,
      alpha: 0.5,
    });
  }

  async classify(imageTensor, topK = 3) {
    if (!this.model) throw new Error('Model not loaded');
    
    const predictions = await this.model.classify(imageTensor, topK);
    
    return predictions.map(p => ({
      label: p.className,
      probability: p.probability,
    }));
  }
}
```

---

## Processing Camera Images

```javascript
import * as tf from '@tensorflow/tfjs';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';

async function imageToTensor(imageUri) {
  // Read image as base64
  const response = await fetch(imageUri);
  const imageData = await response.arrayBuffer();
  
  // Convert to tensor
  const imageTensor = decodeJpeg(new Uint8Array(imageData));
  
  return imageTensor;
}

// From base64 string
async function base64ToTensor(base64String) {
  const raw = atob(base64String);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return decodeJpeg(bytes);
}
```

---

## Combined Vision Model

```javascript
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';

class VisionModel {
  constructor() {
    this.detector = null;
    this.classifier = null;
    this.isReady = false;
  }

  async initialize() {
    await tf.ready();
    
    // Load models in parallel
    const [detector, classifier] = await Promise.all([
      cocoSsd.load({ base: 'lite_mobilenet_v2' }),
      mobilenet.load({ version: 2, alpha: 0.5 }),
    ]);
    
    this.detector = detector;
    this.classifier = classifier;
    this.isReady = true;
  }

  async analyze(imageTensor) {
    if (!this.isReady) throw new Error('Models not ready');

    const [objects, classifications] = await Promise.all([
      this.detector.detect(imageTensor),
      this.classifier.classify(imageTensor, 3),
    ]);

    return {
      objects: objects.filter(o => o.score > 0.6),
      scene: classifications[0]?.className || 'unknown',
    };
  }

  dispose() {
    // Clean up tensors to prevent memory leaks
    tf.dispose();
  }
}
```

---

## Performance Optimization

| Technique | Impact | How |
|-----------|--------|-----|
| Use `lite_mobilenet_v2` | 2x faster | Smaller model, good accuracy |
| Reduce image size | Faster inference | Resize to 224x224 or 300x300 |
| Dispose tensors | Prevent memory leaks | `tensor.dispose()` or `tf.tidy()` |
| Batch processing | Better throughput | Process multiple frames together |

### Memory Management

```javascript
// Option 1: Manual dispose
const tensor = imageToTensor(image);
const result = await model.detect(tensor);
tensor.dispose(); // IMPORTANT!

// Option 2: tf.tidy (automatic cleanup)
const result = tf.tidy(() => {
  const tensor = imageToTensor(image);
  return model.detect(tensor);
});
```

### Reduce Image Size

```javascript
function resizeImage(imageTensor, targetSize = 300) {
  return tf.tidy(() => {
    return tf.image.resizeBilinear(imageTensor, [targetSize, targetSize]);
  });
}
```

---

## Spanish Labels

```javascript
const LABELS_ES = {
  person: 'persona',
  chair: 'silla',
  cup: 'taza',
  bottle: 'botella',
  cell_phone: 'celular',
  book: 'libro',
  dog: 'perro',
  cat: 'gato',
  car: 'auto',
  // ... add more as needed
};

function translateLabel(label) {
  return LABELS_ES[label.toLowerCase()] || label;
}
```

---

## Commands

```bash
# Clear Metro cache (fixes tensor issues)
npx expo start --clear

# Check TensorFlow backend
console.log(tf.getBackend()); // 'rn-webgl' or 'cpu'

# Memory debugging
console.log(tf.memory()); // { numTensors, numBytes, ... }
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "tf is not ready" | Call `await tf.ready()` first |
| Memory keeps growing | Use `tf.tidy()` or `.dispose()` |
| Slow inference | Use lighter model variant |
| Black screen on camera | Check tensor format (RGB vs BGR) |
| Model not loading | Check network, use bundled model |
