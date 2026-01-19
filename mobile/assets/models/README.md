# TensorFlow Lite Models

Esta carpeta contiene los modelos TensorFlow Lite para análisis de visión local.

## Modelos Requeridos

### 1. COCO-SSD MobileNet V1 (Detección de Objetos)

**Descripción:** Detecta 80 categorías de objetos comunes (personas, animales, vehículos, muebles, etc.)

**Tamaño:** ~5.3 MB

**Descargar:**
```bash
# Opción 1: Descarga directa (recomendada)
curl -L -o coco_ssd_mobilenet_v1.tflite \
  "https://tfhub.dev/tensorflow/lite-model/ssd_mobilenet_v1/1/metadata/2?lite-format=tflite"

# Opción 2: Desde TensorFlow Hub
wget https://storage.googleapis.com/download.tensorflow.org/models/tflite/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip
unzip coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip
mv detect.tflite coco_ssd_mobilenet_v1.tflite
rm coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip labelmap.txt
```

**Archivo esperado:** `coco_ssd_mobilenet_v1.tflite`

### 2. MobileNet V2 (Clasificación - Opcional)

**Descripción:** Clasifica escenas en 1000 categorías

**Tamaño:** ~16 MB

**Descargar:**
```bash
curl -L -o mobilenet_v2.tflite \
  "https://tfhub.dev/google/lite-model/imagenet/mobilenet_v2_100_224/classification/5/metadata/1?lite-format=tflite"
```

**Archivo esperado:** `mobilenet_v2.tflite`

## Estructura Final

```
assets/models/
├── README.md
├── coco_ssd_mobilenet_v1.tflite  (5.3 MB) - REQUERIDO
└── mobilenet_v2.tflite            (16 MB)  - OPCIONAL
```

## Integración con react-native-fast-tflite

Una vez descargados los modelos, actualiza `TFLiteVisionAdapter.ts` para cargarlos:

```typescript
import { loadModel } from 'react-native-fast-tflite';

// En preloadModels()
this.cocoModel = await loadModel({
  model: require('../../../../assets/models/coco_ssd_mobilenet_v1.tflite'),
  delegates: ['nnapi'], // Hardware acceleration
});
```

## Verificar Instalación

```bash
# Verificar que los modelos están descargados
ls -lh assets/models/

# Deberías ver:
# coco_ssd_mobilenet_v1.tflite  (5.3M)
```

## Notas

- Los modelos se empaquetan con la app (aumentan tamaño del APK/IPA)
- COCO-SSD detecta 80 categorías (ver `LabelTranslations.ts`)
- Análisis toma ~200-500ms en dispositivos modernos
- Usa NNAPI (Android) o CoreML (iOS) para aceleración por hardware
