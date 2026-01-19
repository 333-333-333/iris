# 🚀 Próximos Pasos - Activar TFLite Real

## ✅ Ya Completado

- ✅ `expo-image-picker` instalado y configurado
- ✅ `react-native-fast-tflite` instalado
- ✅ `app.json` actualizado con permisos
- ✅ `npx expo prebuild --clean` ejecutado exitosamente
- ✅ Proyecto Android generado en `./android`

## 🎯 Paso Final: Ejecutar en Dispositivo

### Opción 1: Dispositivo Físico (Recomendado)

1. **Conecta tu dispositivo Android:**
   ```bash
   # Verifica que esté conectado
   adb devices
   ```
   
   Deberías ver algo como:
   ```
   List of devices attached
   ABC123DEF456    device
   ```

2. **Ejecuta la app:**
   ```bash
   cd mobile
   npx expo run:android
   ```

3. **Espera** (3-5 minutos la primera vez):
   - Gradle descargará dependencias
   - Se compilará el código nativo
   - Se instalará la app en tu dispositivo
   - Se abrirá automáticamente

### Opción 2: Emulador Android

1. **Inicia un emulador** desde Android Studio o:
   ```bash
   # Listar emuladores disponibles
   emulator -list-avds
   
   # Iniciar emulador
   emulator -avd Pixel_5_API_33 &
   ```

2. **Ejecuta la app:**
   ```bash
   cd mobile
   npx expo run:android
   ```

## 📊 Verificar que TFLite Funciona

### 1. Buscar en Logs

Mientras la app se ejecuta, busca estos logs:

**✅ ÉXITO - TFLite Real:**
```
LOG  [TFLiteVisionAdapter] Preloading models...
LOG  [TFLiteVisionAdapter] react-native-fast-tflite imported successfully
LOG  [TFLiteVisionAdapter] Available methods: [...]
LOG  [TFLiteVisionAdapter] ✓ Model loaded successfully!
LOG  [TFLiteVisionAdapter] Model info: { inputs: [...], outputs: [...] }
```

Al analizar imagen:
```
LOG  [TFLiteVisionAdapter] Running real TFLite detection
LOG  [TFLiteVisionAdapter] Detected 3 objects
LOG  [TFLiteVisionAdapter] Analysis complete: Veo una persona...
```

**❌ FALLO - Modo MOCK:**
```
LOG  [TFLiteVisionAdapter] ✗ Failed to load models
LOG  [TFLiteVisionAdapter] ⚠️  Falling back to MOCK mode
LOG  [TFLiteVisionAdapter] Running MOCK detection
```

### 2. Verificar en la App

1. Abre la app
2. Ve a pestaña **"👁️ Visión"**
3. El badge debe decir: **"✓ Modelos cargados"**
4. Presiona **"📁 Analizar desde Galería"**
5. Selecciona una foto con objetos claros
6. La descripción debe mencionar los objetos REALES en tu foto

**Ejemplo:**
- Foto de un perro → "Veo un perro"
- Foto de una mesa con laptop → "Veo una mesa y un portátil"
- Foto de una persona con celular → "Veo una persona y un celular"

## 🔧 Si Sigue en Modo MOCK

### Verificar Logs Detallados

```bash
# En otra terminal, mientras la app corre
npx react-native log-android | grep TFLite
```

Busca la línea de error específica:
```
ERROR [TFLiteVisionAdapter] Failed to import react-native-fast-tflite: ...
```

### Posibles Soluciones

#### 1. Limpiar Build Cache

```bash
cd mobile/android
./gradlew clean
cd ..
npx expo run:android
```

#### 2. Reinstalar Dependencias

```bash
cd mobile
rm -rf node_modules
npm install
npx expo prebuild --clean
npx expo run:android
```

#### 3. Verificar react-native-fast-tflite

```bash
# Verificar versión
npm list react-native-fast-tflite

# Reinstalar
npm uninstall react-native-fast-tflite
npm install react-native-fast-tflite@latest
npx expo prebuild --clean
npx expo run:android
```

## 🎯 Prueba Completa

Una vez que TFLite esté funcionando:

### Test 1: Galería
1. Presiona "📁 Analizar desde Galería"
2. Selecciona foto con personas
3. Debe detectar "persona"

### Test 2: Captura
1. Presiona "📷 Capturar y Analizar"
2. Toma foto de tu escritorio
3. Debe detectar objetos reales (laptop, mouse, keyboard, etc.)

### Test 3: Escena Actual
1. Presiona "🎯 Analizar Escena Actual"
2. Apunta a tu alrededor
3. Debe describir lo que ve

## 📱 Comandos Útiles

### Ver Logs
```bash
# Todos los logs
npx react-native log-android

# Solo TFLite
npx react-native log-android | grep TFLite

# Solo errores
npx react-native log-android | grep ERROR
```

### Reiniciar App
```bash
# Matar app
adb shell am force-stop com.iris.visionassistant

# Reiniciar
adb shell am start -n com.iris.visionassistant/.MainActivity
```

### Limpiar Cache Metro
```bash
npx expo start --clear
```

### Rebuild Completo
```bash
cd mobile/android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npx expo prebuild --clean
npx expo run:android
```

## ✅ Checklist Final

Antes de reportar un problema, verifica:

- [ ] Dispositivo conectado (`adb devices`)
- [ ] `npx expo prebuild --clean` ejecutado
- [ ] `npx expo run:android` ejecutado (NO `npx expo start`)
- [ ] App se instaló en el dispositivo
- [ ] Logs muestran intento de cargar modelo
- [ ] Permisos de cámara y galería otorgados en el dispositivo

## 📞 Próximos Pasos Después del Éxito

Una vez que TFLite funcione:

1. **Desactivar DEV_MODE para producción:**
   ```typescript
   // En App.tsx
   const DEV_MODE = false;
   ```

2. **Probar comandos de voz:**
   - Di "Iris"
   - Di "Describe"
   - Debe analizar y hablar la descripción

3. **Optimizar configuración:**
   - Ajustar `minConfidence` en opciones de análisis
   - Ajustar `maxObjects` según necesidades
   - Probar con diferentes imágenes

## 🎉 ¡Listo!

Si todo funciona, deberías tener:
- ✅ Selección de imágenes de galería
- ✅ Captura con cámara
- ✅ Análisis de escena actual
- ✅ Detección REAL con TensorFlow Lite
- ✅ Descripciones en español
- ✅ Preview de imágenes

¡Disfruta probando Iris! 🚀
