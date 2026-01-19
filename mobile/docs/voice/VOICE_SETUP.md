# Voice Recognition Setup Guide

## Current Status

La aplicación actualmente usa **MockVoiceAdapter** que simula reconocimiento de voz para desarrollo. Para usar reconocimiento de voz real, sigue estas instrucciones.

## Opciones de Speech Recognition

### 1. MockVoiceAdapter (ACTUAL - Para Testing)
✅ **Actualmente activo**
- Simula comandos de voz después de 2 segundos
- Útil para desarrollo y testing del flujo
- No requiere permisos ni configuración

### 2. ReactNativeVoiceAdapter (Cloud-based)
⚙️ **Requiere configuración nativa**

#### Android Setup

1. **Agregar permisos en `android/app/src/main/AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />

<!-- Optional: For better voice recognition -->
<queries>
  <intent>
    <action android:name="android.speech.RecognitionService" />
  </intent>
</queries>
```

2. **Rebuild la app nativa:**
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

3. **Activar ReactNativeVoiceAdapter:**

En `src/voice/presentation/hooks/useVoiceRecognition.ts`:
```typescript
// Cambiar:
import { MockVoiceAdapter } from '../../infrastructure/adapters/mock/MockVoiceAdapter';
// import { ReactNativeVoiceAdapter } from '../../infrastructure/adapters/cloud/ReactNativeVoiceAdapter';
type VoiceAdapter = MockVoiceAdapter;

// Por:
// import { MockVoiceAdapter } from '../../infrastructure/adapters/mock/MockVoiceAdapter';
import { ReactNativeVoiceAdapter } from '../../infrastructure/adapters/cloud/ReactNativeVoiceAdapter';
type VoiceAdapter = ReactNativeVoiceAdapter;
```

Y cambiar la instanciación:
```typescript
return new ReactNativeVoiceAdapter({
  // ... rest of config
```

#### iOS Setup

1. **Agregar permisos en `ios/YourApp/Info.plist`:**
```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>Esta app necesita acceso al micrófono para reconocer comandos de voz</string>
<key>NSMicrophoneUsageDescription</key>
<string>Esta app necesita acceso al micrófono para escuchar tu voz</string>
```

2. **Rebuild:**
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

#### Ventajas
- ✅ Muy preciso
- ✅ Rápido
- ✅ Soporta múltiples idiomas
- ✅ Transcripción en tiempo real (partial results)

#### Desventajas
- ⚠️ Requiere internet
- ⚠️ Envía audio a servidores de Google/Apple
- ⚠️ Requiere configuración nativa

### 3. WhisperAdapter (On-device)
⚙️ **Requiere configuración adicional**

#### Setup

1. **Descargar modelo Whisper:**
   - Descargar `ggml-base.bin` de [whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp)
   - Colocar en `assets/models/ggml-base.bin`

2. **Configurar assets en `app.json`:**
```json
{
  "expo": {
    "assetBundlePatterns": [
      "**/*",
      "assets/models/*.bin"
    ]
  }
}
```

3. **Agregar permisos de micrófono** (mismo que ReactNativeVoiceAdapter)

4. **Activar WhisperAdapter:**
En `src/voice/presentation/hooks/useVoiceRecognition.ts`:
```typescript
import { WhisperAdapter } from '../../infrastructure/adapters/whisper/WhisperAdapter';
type VoiceAdapter = WhisperAdapter;

// ...
return new WhisperAdapter({
  // ... config
```

#### Ventajas
- ✅ Funciona offline
- ✅ Privacy-first (todo on-device)
- ✅ No envía datos a servidores
- ✅ Buena precisión

#### Desventajas
- ⚠️ Requiere descargar modelo (~75MB para base)
- ⚠️ Más lento que cloud
- ⚠️ Consume más batería
- ⚠️ Requiere más configuración

## Recomendaciones

### Para Desarrollo
✅ **Usar MockVoiceAdapter** (actual)
- Permite desarrollar y probar el flujo completo sin configuración
- Simula comandos predefinidos

### Para Testing en Dispositivo
✅ **Usar ReactNativeVoiceAdapter**
- Configuración más simple
- Mejor experiencia de usuario
- Ideal para demos

### Para Producción (Visually Impaired Users)
✅ **Usar WhisperAdapter**
- Privacy-first es crítico para usuarios con discapacidad visual
- No requiere internet (accesibilidad)
- Datos sensibles no salen del dispositivo

## Permisos Runtime

Ambos adapters reales manejan permisos automáticamente:

```typescript
// WhisperAdapter
await adapter.requestPermissions(); // Built-in

// ReactNativeVoiceAdapter
// Pide permisos automáticamente en start()
```

## Testing

Para probar MockVoiceAdapter:
1. Presiona "Activar" en la UI
2. Espera 2 segundos
3. Se simulará el comando "iris describe"
4. El state machine procesará el comando
5. TTS dirá la respuesta

## Status Actual del Proyecto

- ✅ TTS (Text-to-Speech) funcionando con expo-speech
- ✅ State machine completo y testeado
- ✅ MockVoiceAdapter funcionando para desarrollo
- ⚠️ ReactNativeVoiceAdapter implementado pero requiere rebuild nativo
- ⚠️ WhisperAdapter implementado pero requiere modelo
- ✅ UI completa y conectada

## Próximos Pasos

1. ✅ Probar flujo completo con MockVoiceAdapter
2. Configurar permisos Android para ReactNativeVoiceAdapter
3. Rebuild con `npx expo run:android`
4. Cambiar a ReactNativeVoiceAdapter
5. Testing en dispositivo real
6. (Opcional) Configurar WhisperAdapter para offline
