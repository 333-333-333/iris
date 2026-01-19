# Build Instructions - Iris Vision Assistant

## Requisitos Previos

- macOS (para build de iOS)
- Android Studio (para build de Android)
- Node.js >= 18
- Dispositivo físico (Android o iPhone)

---

## Opción 1: Build Android con ADB Wireless (Recomendado)

### Paso 1: Configurar ADB Wireless

**Primera vez (necesitas USB):**

```bash
# 1. Habilita "Depuración USB" en tu Android:
#    Ajustes > Acerca del teléfono > Toca "Número de compilación" 7 veces
#    Ajustes > Opciones de desarrollador > Depuración USB (activar)

# 2. Conecta el teléfono por USB temporalmente

# 3. Verifica conexión
adb devices
# Debe mostrar tu dispositivo

# 4. Habilita WiFi debugging
adb tcpip 5555

# 5. Obtén la IP de tu teléfono
#    Ajustes > Acerca del teléfono > Estado > Dirección IP
#    Ejemplo: 192.168.1.100

# 6. Desconecta el cable USB

# 7. Conecta por WiFi
adb connect 192.168.1.100:5555

# 8. Verifica
adb devices
# Debe mostrar: 192.168.1.100:5555  device
```

**Para próximas veces (ya no necesitas USB):**

```bash
adb connect <IP-DEL-TELEFONO>:5555
```

### Paso 2: Build e Instalar

```bash
cd mobile

# Limpiar build anterior
rm -rf android

# Prebuild (genera código nativo)
npx expo prebuild --clean --platform android

# Build e instalar en dispositivo
npx expo run:android
```

Esto:
1. Compila la app
2. Instala en tu teléfono
3. Inicia Metro bundler
4. Abre la app automáticamente

### Paso 3: Probar

1. La app se abrirá automáticamente
2. Concede permisos de cámara y micrófono
3. Di **"iris describe"**
4. La app debe:
   - Capturar foto
   - Analizar con TFLite
   - Decir lo que ve

---

## Opción 2: Build con EAS (Sin Cable)

Si no tienes acceso a un cable USB o puerto USB:

```bash
cd mobile

# Instala EAS CLI
npm install -g eas-cli

# Login (crea cuenta si no tienes)
eas login

# Build para Android (APK)
eas build --platform android --profile preview

# Espera ~15-20 minutos
# Descarga el APK desde el link que te da
# Instala en tu teléfono
```

---

## Opción 3: Build iOS

```bash
cd mobile

# Prebuild
npx expo prebuild --clean --platform ios

# Build (requiere Mac + Xcode)
npx expo run:ios --device
```

---

## Troubleshooting

### Port 8081 ocupado

```bash
lsof -ti:8081 | xargs kill -9
npx expo start --clear
```

### Build falla con "module not found"

```bash
cd mobile
rm -rf node_modules
rm -rf android ios
npm install
npx expo prebuild --clean
```

### ADB no encuentra dispositivo

```bash
# Verifica que están en la misma red WiFi
adb connect <IP>:5555

# Si no funciona, reconecta por USB
adb usb
adb tcpip 5555
adb connect <IP>:5555
```

### TFLite falla al cargar modelo

El código tiene fallback a mock mode automático. Verifica los logs:

```bash
# Logs de Android
adb logcat | grep TFLite

# Deberías ver:
# [TFLiteVisionAdapter] Model loaded successfully
# O: [TFLiteVisionAdapter] Falling back to MOCK mode
```

### Permisos denegados

```bash
# Android: Ve a Ajustes > Apps > Iris > Permisos
# iOS: Ve a Ajustes > Iris > Permisos
```

---

## Verificar que TFLite funciona

### Logs esperados (modo real):

```
[TFLiteVisionAdapter] Preloading models...
[TFLiteVisionAdapter] Loading model from asset: [object Object]
[TFLiteVisionAdapter] Model loaded successfully
[TFLiteVisionAdapter] Model info: { inputs: [...], outputs: [...] }
[TFLiteVisionAdapter] Running real TFLite detection on: file://...
[TFLiteVisionAdapter] Model outputs: 4
[TFLiteVisionAdapter] Detected 5 objects
[TFLiteVisionAdapter] Filtered to 3 valid detections
```

### Logs esperados (modo mock/fallback):

```
[TFLiteVisionAdapter] Falling back to MOCK mode
[TFLiteVisionAdapter] Running MOCK detection
```

---

## Testing Completo

### 1. Wake Word Detection

```
Di: "iris describe"
Esperado: Vibración + captura foto + análisis
```

### 2. Vision Analysis

```
Resultado: "Veo una persona y una silla en el centro"
(O resultado mock si TFLite falló)
```

### 3. Repeat Command

```
Di: "iris repite"
Esperado: Repite la última descripción
```

### 4. Help Command

```
Di: "iris ayuda"
Esperado: Lista de comandos disponibles
```

### 5. Stop Command

```
Di: "iris para"
Esperado: Detiene TTS
```

---

## Performance Esperado

### Primera ejecución:
- Carga modelo: ~500-1000ms
- Captura: ~200ms
- Inferencia: ~200-500ms
- **Total: ~1-2 segundos**

### Ejecuciones posteriores:
- Captura: ~200ms
- Inferencia: ~200-500ms
- **Total: ~500-800ms**

---

## Debug Mode

Para ver todos los logs:

```bash
# Android
adb logcat | grep -E "(TFLite|Vision|Iris|Expo)"

# Metro bundler
npx expo start --clear
# Presiona 'j' para abrir debugger
```

---

## Notas Importantes

1. **TFLite requiere dispositivo físico** - No funciona en emulador
2. **Wake word requiere micrófono real** - No funciona en emulador
3. **Modelo COCO-SSD descargado:** ✅ `mobile/assets/models/coco_ssd_mobilenet_v1.tflite`
4. **Metro config actualizado:** ✅ Soporta archivos `.tflite`
5. **Fallback automático:** Si TFLite falla, usa mock data

---

## Próximos Pasos Después del Build

Una vez que confirmes que TFLite funciona en tu dispositivo:

1. ✅ Probar varios objetos (persona, silla, laptop, taza, etc.)
2. ✅ Verificar traducciones al español
3. ✅ Probar en diferentes condiciones de luz
4. ✅ Medir battery drain con uso continuo
5. ⚠️ Ajustar confianza mínima (actualmente 30%)
6. ⚠️ Optimizar resize de imagen para mejor performance

---

## Contact

Si encuentras problemas, comparte:
- Logs de `adb logcat | grep TFLite`
- Versión de Android
- Modelo de teléfono
- Mensaje de error completo
