# Vision Service - Análisis Local de Imágenes

## Resumen

Implementamos un sistema completo de visión por computadora que captura fotos y las analiza localmente usando TensorFlow Lite con el modelo COCO-SSD.

## Arquitectura

### Clean Architecture en 3 Capas

```
src/vision/
├── domain/              # Lógica de negocio pura
│   ├── entities/
│   │   ├── DetectedObject.ts      # Objeto detectado (label, confianza, posición)
│   │   └── SceneDescription.ts    # Descripción completa de la escena
│   ├── services/
│   │   └── SceneDescriptionGenerator.ts  # Genera texto natural en español
│   └── value-objects/
│       └── LabelTranslations.ts   # Diccionario ES-EN (80 categorías COCO)
│
├── application/         # Casos de uso
│   ├── ports/
│   │   ├── ICameraService.ts      # Interface para cámara
│   │   └── IVisionService.ts      # Interface para análisis de visión
│   └── use-cases/
│       └── AnalyzeSceneUseCase.ts # Orquesta: captura + análisis + descripción
│
├── infrastructure/      # Implementaciones concretas
│   ├── adapters/
│   │   ├── expo/
│   │   │   └── ExpoCameraAdapter.ts        # Implementa ICameraService con expo-camera
│   │   ├── tflite/
│   │   │   └── TFLiteVisionAdapter.ts      # Implementa IVisionService con TFLite
│   │   └── voice/
│   │       └── VisionServiceBridge.ts      # Conecta vision module con voice module
│   └── services/
│
└── presentation/        # UI y hooks
    ├── components/
    │   └── CameraCapture.tsx       # Componente invisible con cámara activa
    └── hooks/
        └── useVisionService.ts     # Hook React para acceder al servicio
```

## Flujo de Ejecución

### Cuando el usuario dice "iris describe"

```
1. ProcessCommandUseCase.handleDescribe()
           ↓
2. VisionServiceBridge.analyzeScene()
           ↓
3. AnalyzeSceneUseCase.execute()
           ↓
4. ExpoCameraAdapter.capturePhoto()
   → Toma foto con expo-camera
   → Retorna URI local
           ↓
5. TFLiteVisionAdapter.analyzeImage()
   → Carga modelo COCO-SSD (si no está cargado)
   → Ejecuta inferencia sobre la imagen
   → Retorna lista de objetos detectados
           ↓
6. SceneDescriptionGenerator.generate()
   → Agrupa objetos por tipo
   → Traduce labels al español
   → Construye frase natural
   → "Veo 2 personas y una silla en el centro"
           ↓
7. ExpoSpeechSynthesizer.speak(description)
   → TTS lee la descripción
```

## Componentes Clave

### 1. DetectedObject (Entidad)

```typescript
interface DetectedObject {
  label: string;           // "person" (inglés, del modelo)
  labelEs: string;         // "persona" (español, traducido)
  confidence: number;      // 0.92 (92% de confianza)
  boundingBox: {
    x: 0.2,                // Posición normalizada (0-1)
    y: 0.3,
    width: 0.4,
    height: 0.5
  };
  position: 'center';      // Calculado: center, left, right, top, bottom
  size: 'large';           // Calculado: large, medium, small
}
```

### 2. SceneDescription (Entidad)

```typescript
interface SceneDescription {
  objects: DetectedObject[];
  timestamp: Date;
  confidence: number;      // Promedio de confianzas
  naturalDescription: string;  // "Veo 2 personas y una silla"
  imageUri?: string;       // URI de la foto analizada
}
```

### 3. SceneDescriptionGenerator (Servicio de Dominio)

Convierte datos técnicos en lenguaje natural:

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
"Veo 2 personas y una silla en el centro"
```

**Características:**
- Agrupa objetos por tipo ("2 personas" en lugar de "persona, persona")
- Usa plurales correctos ("sillas", "personas")
- Filtra por confianza mínima (default: 50%)
- Describe posición de objetos principales
- Maneja casos especiales (0 objetos, 1 objeto, muchos objetos)

### 4. TFLiteVisionAdapter (Infraestructura)

**Estado actual:** Mock implementation
- Simula detecciones para testing sin dispositivo físico
- Retorna datos de prueba: persona, silla, laptop

**Cuando construyas en dispositivo real:**
1. Descarga modelo COCO-SSD (~5MB)
2. Descomenta código de react-native-fast-tflite
3. Carga modelo al iniciar app
4. Ejecuta inferencia real

**Ver:** `/mobile/assets/models/README.md` para instrucciones

### 5. ExpoCameraAdapter (Infraestructura)

- Implementa ICameraService usando expo-camera
- Maneja permisos automáticamente
- Captura fotos en alta calidad (optimizada a 640x640 para TFLite)
- Usa CameraView invisible en background

## Traducciones (80 categorías COCO)

El modelo COCO-SSD detecta 80 categorías. Todas están traducidas al español:

| Categoría EN | Categoría ES |
|--------------|--------------|
| person       | persona      |
| car          | coche        |
| chair        | silla        |
| laptop       | portátil     |
| cup          | taza         |
| bottle       | botella      |
| ...          | ...          |

**Ver:** `LabelTranslations.ts` para lista completa

## Integración con Voice Module

### VisionServiceBridge

Adaptador que conecta los dos módulos manteniendo la separación:

```typescript
// Voice module espera:
interface VisionService {
  analyzeScene(): Promise<SceneAnalysis>;
  isReady(): boolean;
}

// Vision module provee:
class AnalyzeSceneUseCase {
  execute(): Promise<SceneDescription>;
}

// Bridge conecta ambos:
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

## Uso desde React

### Hook: useVisionService

```typescript
function MyComponent() {
  const { visionService, isReady } = useVisionService({
    preload: true  // Pre-carga modelos al montar
  });

  useEffect(() => {
    if (isReady) {
      console.log('Vision service ready!');
    }
  }, [isReady]);

  return <>{/* ... */}</>;
}
```

### Integración en App.tsx

```typescript
function App() {
  // 1. Inicializar vision service
  const { visionService, cameraAdapter } = useVisionService({ preload: true });

  // 2. Pasar a voice commands
  return (
    <>
      <HomeScreen visionService={visionService} />
      <CameraCapture onAdapterReady={cameraAdapter.setCameraRef.bind(cameraAdapter)} />
    </>
  );
}
```

## Rendimiento Esperado

### Primera ejecución:
- Carga de modelo: ~500-1000ms
- Captura de foto: ~200-300ms
- Inferencia TFLite: ~200-500ms
- Total: ~1-2 segundos

### Ejecuciones subsecuentes:
- Modelo en memoria (ya cargado)
- Captura: ~200-300ms
- Inferencia: ~200-500ms
- Total: ~500-800ms

### Optimizaciones implementadas:
- ✅ Pre-carga de modelos al iniciar app
- ✅ Cámara siempre activa (no se inicia/detiene cada vez)
- ✅ Resize de imágenes a 640x640 (óptimo para TFLite)
- ✅ Filtro de confianza mínima (50%)
- ✅ Caché de última descripción (para "iris repite")

## Tamaño de App

- **Modelos TFLite:** ~5-6 MB (COCO-SSD)
- **Código vision module:** ~50 KB
- **Total adicional:** ~5-6 MB al APK/IPA

## Próximos Pasos

### Para probar en dispositivo real:

1. **Descargar modelo COCO-SSD:**
   ```bash
   cd mobile/assets/models
   curl -L -o coco_ssd_mobilenet_v1.tflite \
     "https://tfhub.dev/tensorflow/lite-model/ssd_mobilenet_v1/1/metadata/2?lite-format=tflite"
   ```

2. **Configurar react-native-fast-tflite:**
   ```bash
   cd mobile
   npx expo prebuild --clean
   npx expo run:android  # o run:ios
   ```

3. **Actualizar TFLiteVisionAdapter:**
   - Descomentar código real de TFLite
   - Eliminar mock data

4. **Probar comando:**
   - Decir "iris describe"
   - Verificar que captura foto
   - Verificar que detecta objetos
   - Verificar que describe en español

### Mejoras futuras (opcional):

- [ ] Agregar MobileNet V2 para clasificación de escenas
- [ ] Detectar colores dominantes
- [ ] OCR para leer texto en imágenes
- [ ] Detección de rostros (BlazeFace)
- [ ] Modo "exploración continua" (analiza cada 5 segundos)
- [ ] Historial de descripciones con timestamps

## Testing

### Mock para desarrollo sin dispositivo:

El TFLiteVisionAdapter actual incluye datos mock:

```typescript
// MOCK detections
return [
  { label: 'person', confidence: 0.92, ... },
  { label: 'chair', confidence: 0.85, ... },
  { label: 'laptop', confidence: 0.78, ... },
];
```

Esto permite:
- ✅ Desarrollar UI sin necesitar dispositivo
- ✅ Probar generación de descripciones
- ✅ Validar flujo completo end-to-end
- ✅ Escribir tests unitarios

### Tests unitarios existentes:

```bash
npm test -- vision
```

Prueba:
- SceneDescriptionGenerator con varios escenarios
- Traducciones de labels
- Cálculo de posiciones y tamaños
- Filtrado por confianza

## Troubleshooting

### "Vision service not ready"
→ Los modelos aún están cargando. Espera unos segundos o llama a `warmUp()`.

### "Camera permission denied"
→ Ve a Configuración > Iris > Permisos > Cámara > Permitir

### "No objects detected"
→ La escena está muy oscura o no hay objetos reconocibles por COCO (80 categorías)

### Build fails con TFLite
→ Asegúrate de haber ejecutado `npx expo prebuild` antes de `expo run:android`

## Referencias

- [COCO Dataset](https://cocodataset.org/) - 80 categorías detectables
- [TensorFlow Lite](https://www.tensorflow.org/lite) - ML on-device
- [expo-camera docs](https://docs.expo.dev/versions/latest/sdk/camera/)
- [react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite)
