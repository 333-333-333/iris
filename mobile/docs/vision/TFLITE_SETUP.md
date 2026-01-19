# TensorFlow Lite Setup - Solución de Problemas

## Problema: El modelo está en modo MOCK

Si ves en los logs:

```
LOG  [TFLiteVisionAdapter] Running MOCK detection
LOG  [TFLiteVisionAdapter] ⚠️  Falling back to MOCK mode
```

Significa que el modelo de TensorFlow Lite no se cargó correctamente y está usando datos de prueba.

## Solución Rápida

### 1. Agregar Plugin a app.json ✅

Ya está agregado en `app.json`:

```json
{
  "plugins": [
    ...
    "react-native-fast-tflite"
  ]
}
```

### 2. Reconstruir el Proyecto Nativo

Este es el paso CRÍTICO que soluciona el problema:

```bash
cd mobile

# Limpiar build anterior
npx expo prebuild --clean

# Reconstruir para Android
npx expo run:android

# O para iOS
npx expo run:ios
```

**¿Por qué es necesario?**

- `react-native-fast-tflite` es un módulo nativo (no JavaScript puro)
- Necesita compilarse en el código nativo de Android/iOS
- `npx expo start` solo ejecuta JavaScript, no recompila código nativo
- `npx expo run:android` compila el código nativo + JavaScript

### 3. Verificar que Funcionó

Después de reconstruir, los logs deberían mostrar:

```
LOG  [TFLiteVisionAdapter] Preloading models...
LOG  [TFLiteVisionAdapter] react-native-fast-tflite imported successfully
LOG  [TFLiteVisionAdapter] Calling loadModel...
LOG  [TFLiteVisionAdapter] ✓ Model loaded successfully!
LOG  [TFLiteVisionAdapter] Model info: { inputs: [...], outputs: [...] }
```

Y al analizar una imagen:

```
LOG  [TFLiteVisionAdapter] Running real TFLite detection
LOG  [TFLiteVisionAdapter] Detected 3 objects: person (0.92), chair (0.85), laptop (0.78)
```

## Errores Comunes

### Error 1: "react-native-fast-tflite not available"

**Síntoma:**
```
ERROR [TFLiteVisionAdapter] Failed to import react-native-fast-tflite
```

**Solución:**
```bash
# Instalar paquete
npm install react-native-fast-tflite

# Reconstruir
npx expo prebuild --clean
npx expo run:android
```

### Error 2: "model is not a valid asset"

**Síntoma:**
```
ERROR [TFLiteVisionAdapter] Model asset: undefined
```

**Solución:**

1. Verifica que el modelo existe:
   ```bash
   ls assets/models/coco_ssd_mobilenet_v1.tflite
   ```

2. Verifica `metro.config.js`:
   ```javascript
   config.resolver.assetExts.push('tflite');
   ```

3. Reconstruir:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

### Error 3: "Failed to load model"

**Síntoma:**
```
ERROR [TFLiteVisionAdapter] Failed to load models
```

**Posibles causas:**

1. **Modelo corrupto:** Re-descarga el modelo
2. **Falta de memoria:** Cierra otras apps
3. **Hardware no compatible:** Intenta sin aceleración:

```typescript
// En TFLiteVisionAdapter.ts, cambia:
this.cocoModel = await TFLite.loadModel({
  model: modelAsset,
  delegates: [], // Sin aceleración
});
```

### Error 4: "Module not found: react-native-fast-tflite"

**Síntoma:**
App crashes al iniciar o importar falla

**Solución:**

1. Verifica instalación:
   ```bash
   npm list react-native-fast-tflite
   ```

2. Si no está instalado:
   ```bash
   npm install react-native-fast-tflite
   ```

3. **IMPORTANTE:** Reconstruir:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

## Workflow Completo

Para asegurarte de que TFLite funciona correctamente:

```bash
# 1. Instalar dependencia
npm install react-native-fast-tflite

# 2. Verificar que el modelo existe
ls assets/models/coco_ssd_mobilenet_v1.tflite

# 3. Verificar app.json contiene el plugin
grep -A 2 "react-native-fast-tflite" app.json

# 4. Limpiar y reconstruir
npx expo prebuild --clean

# 5. Ejecutar en dispositivo
npx expo run:android

# 6. Verificar logs
# Busca: "✓ Model loaded successfully!"
```

## Verificación en la App

### 1. Check Visual

En la pantalla de pruebas, el badge debería mostrar:

```
✓ Modelos cargados
```

### 2. Check en Logs

Al iniciar la app:

```
LOG  [useVisionService] Preloading models...
LOG  [TFLiteVisionAdapter] ✓ Model loaded successfully!
LOG  [useVisionService] Models preloaded successfully
```

### 3. Check al Analizar Imagen

Al seleccionar una imagen:

```
LOG  [TFLiteVisionAdapter] Running real TFLite detection
LOG  [TFLiteVisionAdapter] Detected N objects: [...]
LOG  [TFLiteVisionAdapter] Analysis complete: Veo una persona...
```

**NO debería aparecer:**
```
LOG  [TFLiteVisionAdapter] Running MOCK detection  ❌
```

## Debugging Avanzado

### Ver Logs Detallados

```bash
# Android
npx react-native log-android | grep TFLite

# iOS
npx react-native log-ios | grep TFLite
```

### Verificar Modelo en Runtime

Agrega esto temporalmente en `TFLiteVisionAdapter.ts`:

```typescript
console.log('[DEBUG] Model path:', modelAsset);
console.log('[DEBUG] Model exists:', typeof modelAsset);
console.log('[DEBUG] TFLite methods:', Object.keys(TFLite));
```

### Test Manual del Modelo

Puedes crear un script de prueba:

```typescript
// test-tflite.ts
import { loadModel } from 'react-native-fast-tflite';

async function testModel() {
  try {
    const model = await loadModel({
      model: require('./assets/models/coco_ssd_mobilenet_v1.tflite'),
      delegates: [],
    });
    console.log('✓ Model loaded:', model);
  } catch (error) {
    console.error('✗ Failed:', error);
  }
}

testModel();
```

## Alternativa: Usar Modelo desde URL

Si el modelo local sigue fallando, puedes intentar cargarlo desde una URL:

```typescript
import * as FileSystem from 'expo-file-system';

async function downloadModel() {
  const modelUrl = 'https://your-server.com/coco_ssd_mobilenet_v1.tflite';
  const modelPath = `${FileSystem.documentDirectory}model.tflite`;
  
  await FileSystem.downloadAsync(modelUrl, modelPath);
  
  const model = await loadModel({
    model: modelPath,
    delegates: ['nnapi', 'gpu'],
  });
  
  return model;
}
```

## Checklist de Solución

- [ ] `react-native-fast-tflite` instalado (`npm list react-native-fast-tflite`)
- [ ] Plugin en `app.json`
- [ ] Modelo existe en `assets/models/coco_ssd_mobilenet_v1.tflite`
- [ ] `metro.config.js` tiene `.tflite` en `assetExts`
- [ ] Ejecutaste `npx expo prebuild --clean`
- [ ] Ejecutaste `npx expo run:android` (no `npx expo start`)
- [ ] Logs muestran "✓ Model loaded successfully!"
- [ ] NO aparece "Running MOCK detection"
- [ ] Análisis retorna objetos reales, no mock

## Recursos

- [react-native-fast-tflite Docs](https://github.com/mrousavy/react-native-fast-tflite)
- [TensorFlow Lite Models](https://www.tensorflow.org/lite/models)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
