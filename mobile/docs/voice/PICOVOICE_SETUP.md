# Configuración de Picovoice para Wake Word Always-On

## 🎯 Para que funcione el "picovoice" always-on

Tu abuelo podrá decir **"picovoice"** en cualquier momento y la app se activará automáticamente.

## Paso 1: Obtener Access Key GRATIS

1. Ve a https://console.picovoice.ai/signup
2. Crea cuenta (gratis para 3 dispositivos)
3. Verifica tu email
4. Inicia sesión en https://console.picovoice.ai/
5. Copia tu **Access Key** (empieza con algo como `AbC123...`)

## Paso 2: Agregar Access Key al código

Abre: `src/voice/infrastructure/services/PorcupineWakeWordService.ts`

Busca la línea 23:
```typescript
private static readonly ACCESS_KEY = 'YOUR_ACCESS_KEY_HERE';
```

Reemplaza `YOUR_ACCESS_KEY_HERE` con tu access key:
```typescript
private static readonly ACCESS_KEY = 'AbC123DeF456...'; // Tu access key aquí
```

## Paso 3: Build y prueba

```bash
# Instalar dependencias
npx expo install

# Rebuild nativo
npx expo prebuild --clean

# Ejecutar en Android
npx expo run:android
```

## 🎤 Cómo Funciona

### Cuando la app está ABIERTA:
```
1. App escucha "picovoice" en segundo plano (bajo consumo)
2. Usuario dice: "picovoice describe"
3. ¡Wake word detectado! → inicia speech recognition
4. Transcribe: "describe"
5. Procesa comando
6. Habla respuesta
```

### Cuando la app está CERRADA/BACKGROUND:
```
1. Servicio en background escucha "picovoice"
2. Usuario dice: "picovoice"
3. ¡Wake word detectado! → envía notificación
4. Notificación suena → usuario toca
5. App se abre → lista para siguiente comando
```

## ⚡ Consumo de Batería

- **Escuchando wake word**: ~1-3% por hora
- **Después de detectar**: normal (~5% por hora)
- **Total estimado**: 15-20% en 8 horas de uso

## 🔒 Privacidad

- ✅ TODO el procesamiento en el dispositivo
- ✅ NADA se envía a servidores
- ✅ Solo escucha la palabra "picovoice"
- ✅ No graba ni almacena audio

## 🎯 Wake Word Actual: "picovoice"

Por defecto usa la palabra **"picovoice"** (viene incluida, gratis).

Tu abuelo dirá:
- **"picovoice describe"** → describe la escena
- **"picovoice repite"** → repite última descripción
- **"picovoice ayuda"** → ayuda

## 🔄 Para Cambiar a "iris" (Opcional)

Si quieres que el wake word sea **"iris"** en lugar de "picovoice":

### Opción A: Entrenar modelo custom (GRATIS)

1. Ve a https://console.picovoice.ai/
2. Click en "Porcupine Wake Word"
3. Click "Train Custom Wake Word"
4. Escribe: **iris**
5. Selecciona idioma: **Spanish**
6. Click "Train"
7. Espera 5-10 minutos
8. Descarga el archivo `.ppn`
9. Coloca en: `assets/wake-words/iris_es_android_v3_0_0.ppn`

Luego actualiza el código:

```typescript
// En PorcupineWakeWordService.ts
this.porcupine = await Porcupine.fromKeywordPaths(
  ACCESS_KEY,
  ['assets/wake-words/iris_es_android_v3_0_0.ppn'], // Tu modelo
  [0.5]
);
```

### Opción B: Usar solo "picovoice" (MÁS SIMPLE)

Es más fácil que tu abuelo se acostumbre a decir "picovoice" que entrenar un modelo.

## 📱 Permisos Necesarios

### Android
- ✅ RECORD_AUDIO - Escuchar micrófono
- ✅ FOREGROUND_SERVICE - Servicio always-on
- ✅ WAKE_LOCK - Mantener CPU activa
- ✅ POST_NOTIFICATIONS - Notificar cuando detecta
- ✅ RECEIVE_BOOT_COMPLETED - Auto-start al encender

### iOS
- ✅ Microphone - Escuchar micrófono
- ✅ Background Audio - Escuchar en background

## 🚀 Auto-Start al Encender Teléfono

La app se inicia automáticamente cuando tu abuelo enciende el teléfono.

### Android (Automático)
Con el permiso `RECEIVE_BOOT_COMPLETED`, la app:
1. Se inicia en background al encender
2. Empieza a escuchar "picovoice"
3. Lista para activarse con voz

### iOS (Manual)
En iOS necesitas:
1. Abrir la app una vez después de reiniciar
2. Luego quedará activa en background

## 🎨 UI para tu Abuelo

La app mostrará:
- 🟢 "Escuchando 'picovoice'" - Todo normal
- 🔵 "Procesando comando..." - Después de detectar
- 🟡 "Hablando..." - Cuando responde
- 🔴 "Error" - Si algo falla

## 🔊 Feedback de Audio

Cuando detecta "picovoice":
- Sonido de confirmación (beep)
- Vibración
- "¿Qué necesitas?" (TTS)

## 🧪 Testing

### Probar wake word:
1. Abre la app
2. Di claramente: **"picovoice"**
3. Deberías escuchar un beep
4. Luego di: **"describe"**
5. La app procesará el comando

### Probar desde background:
1. Abre la app (se inicia servicio)
2. Presiona Home (app va a background)
3. Di: **"picovoice"**
4. Deberías recibir notificación
5. Toca notificación → app se abre

## ⚠️ Limitaciones Conocidas

### Android
- Algunos fabricantes (Xiaomi, Huawei) matan servicios background agresivamente
- Necesita deshabilitar "Battery optimization" para Iris

### iOS
- Puede pausarse después de varias horas en background
- Necesita reabrir app cada ~24h

### Ambos
- En modo "Battery Saver" puede detenerse
- No funciona si el teléfono está apagado (obviamente)

## 🛠️ Troubleshooting

### "Invalid Access Key"
- Verifica que copiaste bien el access key
- Debe ser del dashboard de Picovoice
- Sin espacios ni comillas extra

### Wake word no detecta
- Habla más fuerte y claro
- Reduce ruido ambiental
- Ajusta sensibilidad (0.0-1.0) en el código
- Verifica permisos de micrófono

### App se cierra en background
- Android: Desactiva "Battery optimization" para Iris
  - Settings > Apps > Iris > Battery > Unrestricted
- iOS: Mantén app abierta en background switcher

### Alto consumo de batería
- Reduce sensibilidad
- Configura horarios activos (ej: 8am-10pm)
- Usa solo cuando se necesite

## 💰 Costo de Picovoice

- **Gratis**: Hasta 3 dispositivos (perfecto para prueba)
- **Indie**: $55/mes hasta 100 dispositivos
- **Enterprise**: Contactar para pricing

Para un proyecto de accesibilidad, puedes solicitar:
- Descuento para organizaciones sin fines de lucro
- Licencia gratuita para proyectos de accesibilidad

Email: sales@picovoice.ai explicando que es para tu abuelo ciego.

## 📞 Soporte

Si tienes problemas:
1. Revisa logs: `npx expo start` muestra errores
2. Issues de Porcupine: https://github.com/Picovoice/porcupine/issues
3. Documentación: https://picovoice.ai/docs/porcupine/

## ✅ Checklist de Configuración

- [ ] Crear cuenta en Picovoice Console
- [ ] Copiar Access Key
- [ ] Pegar Access Key en `PorcupineWakeWordService.ts`
- [ ] Ejecutar `npx expo prebuild --clean`
- [ ] Ejecutar `npx expo run:android`
- [ ] Dar permisos de micrófono y notificaciones
- [ ] Probar diciendo "picovoice"
- [ ] Desactivar battery optimization (Android)
- [ ] Probar desde background

## 🎉 Resultado Final

Tu abuelo podrá:
1. **Decir "picovoice" en cualquier momento**
2. **La app se activará automáticamente**
3. **Decir su comando**: "describe", "repite", etc.
4. **Escuchar la respuesta**
5. **TODO sin tocar nada**

¡Perfecto para personas ciegas! 🦯
