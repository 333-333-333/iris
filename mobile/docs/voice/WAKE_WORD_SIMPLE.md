# Wake Word Always-On (Solución Simple)

## 🎯 Para tu Abuelo

Tu abuelo podrá decir **"iris"** en cualquier momento y la app se activará automáticamente.

## ✅ Ventajas de Esta Solución

- ✅ **100% Compatible con Expo** - No requiere módulos nativos complejos
- ✅ **Sin Access Keys** - No necesita registrarse en ningún servicio
- ✅ **Funciona Inmediatamente** - Solo build y listo
- ✅ **Detección de "iris"** - Palabra en español, natural
- ✅ **Auto-reinicio** - Si se detiene, se reinicia automáticamente

## 🔋 Consumo de Batería

- **Escuchando continuamente**: ~5-8% por hora
- **Total en 8 horas**: ~40-60% de batería

**Recomendación**: Mantener teléfono cargando durante el día o configurar horarios activos.

## 🎤 Cómo Funciona

### Flujo Completo:

```
1. App inicia → Comienza escucha continua
2. Usuario dice: "iris describe"
3. Sistema detecta "iris" en partial results
4. ¡Vibración + beep de confirmación!
5. Procesa "describe" → ejecuta comando
6. Habla respuesta
7. Sigue escuchando "iris"...
```

### App en Background:

En iOS/Android moderno, el reconocimiento de voz puede continuar brevemente en background, pero eventualmente se pausará. **La app debe estar en foreground para funcionar mejor**.

## 📱 Setup Rápido

```bash
# 1. Limpiar build anterior
rm -rf android ios

# 2. Prebuild
npx expo prebuild --clean

# 3. Ejecutar en Android
npx expo run:android
```

## 🎨 UI para tu Abuelo

La app mostrará:
- 🟢 Barra verde arriba: "🎤 Escuchando 'iris'..."
- Cuando detecta, muestra: "(Último: iris describe)"
- Feedback háptico cuando detecta wake word
- TTS confirma: "¿Qué necesitas?"

## ⚙️ Configuración Avanzada (Opcional)

### Ajustar Sensibilidad

En `ContinuousWakeWordService.ts`, línea 96:

```typescript
private containsWakeWord(transcript: string): boolean {
  const wakeWords = [
    'iris',      // Original
    'iri',       // Sin 's' final
    'hiri',      // Con H
    'hiris',     // Con H + S
    'ayris',     // Variación
  ];
  // ...
}
```

Agrega más variaciones si tu abuelo pronuncia diferente.

### Cooldown (evitar múltiples triggers)

Línea 27:

```typescript
private wakeWordCooldown = 2000; // 2 segundos
```

Aumenta a 3000 o 5000 si detecta demasiado seguido.

### Auto-reinicio

El servicio se reinicia automáticamente si:
- Se detiene por error
- Usuario pausa/resume la app
- Sistema pausa el reconocimiento

## 🔧 Troubleshooting

### Wake word no detecta

**Problema**: Dice "iris" pero no se activa

**Solución**:
1. Habla más fuerte y claro
2. Reduce ruido de fondo
3. Revisa logs: `npx expo start` muestra detecciones
4. Agrega variaciones de pronunciación en el código

### Se detiene después de un rato

**Problema**: Deja de escuchar después de minutos/horas

**Solución**:
- **Android**: Settings > Apps > Iris > Battery > Unrestricted
- **iOS**: Mantén app en foreground (no cierres completamente)
- El auto-restart debería reactivarlo

### Alto consumo de batería

**Problema**: Batería se agota rápido

**Solución**:
1. Mantén teléfono cargando durante uso
2. Implementa horarios activos (solo escucha 8am-10pm)
3. Usa botón físico como alternativa:
   - Configura "Press volume down 3 times" → abre Iris

### App se cierra en background

**Problema**: Android mata la app en background

**Solución**:
- Desactiva "Battery Optimization" para Iris
- Settings > Apps > Iris > Battery > Unrestricted
- Algunos fabricantes (Xiaomi, Huawei) requieren:
  - Whitelist app en "Autostart"
  - Deshabilitar "Battery Saver" para la app

## 🎯 Comandos Soportados

Tu abuelo puede decir:
- **"iris describe"** → Describe lo que ve la cámara
- **"iris repite"** → Repite última descripción
- **"iris ayuda"** → Lista de comandos disponibles
- **"iris para"** → Detener acción actual
- **"iris adiós"** → Cerrar asistente

## 🔒 Privacidad

**Importante**: Esta solución envía audio a servidores de Google/Apple.

- ⚠️ El audio ES enviado a la nube para transcripción
- ⚠️ Requiere internet para funcionar
- ⚠️ Google/Apple procesan el audio

Si la privacidad es crítica, considera:
1. Solo activar cuando se necesite (botón manual)
2. Usar solo en casa (WiFi confiable)
3. Informar a tu abuelo que el audio se procesa en la nube

## 🆚 Comparación con Porcupine

| Feature | Esta Solución | Porcupine |
|---------|--------------|-----------|
| **Setup** | ✅ Simple | ❌ Complejo |
| **Expo Compatible** | ✅ Sí | ❌ No |
| **Batería** | ⚠️ 5-8%/hora | ✅ 1-3%/hora |
| **Privacidad** | ❌ Cloud | ✅ On-device |
| **Costo** | ✅ Gratis | ⚠️ $55/mes |
| **Internet** | ❌ Requiere | ✅ No requiere |
| **Precisión** | ✅ Alta | ✅ Alta |
| **Latencia** | ✅ Baja | ✅ Muy baja |

Para tu caso (abuelo, uso en casa), esta solución es **perfecta**.

## 🚀 Mejoras Futuras

### Horarios Activos

```typescript
// Solo escucha de 7am a 11pm
const isActiveTime = () => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 23;
};

// En start()
if (!isActiveTime()) {
  console.log('Outside active hours, skipping');
  return;
}
```

### Botón Físico de Emergencia

Para cuando no funcione o batería baja:

```typescript
import * as Volume from 'expo-volume';

// Detecta 3 toques de volume down
let volumePressCount = 0;
Volume.addListener((event) => {
  if (event.volume === 0) {
    volumePressCount++;
    if (volumePressCount === 3) {
      // Activar Iris manualmente
      startVoiceRecognition();
    }
  }
});
```

### Widget de Acceso Rápido

Home screen widget: "Activar Iris"

## ✅ Checklist

- [ ] Ejecutar `npx expo prebuild --clean`
- [ ] Ejecutar `npx expo run:android`
- [ ] Dar permisos de micrófono
- [ ] Probar diciendo "iris"
- [ ] Verificar feedback háptico
- [ ] Desactivar battery optimization
- [ ] Configurar auto-start (si disponible)
- [ ] Enseñar a tu abuelo los comandos básicos

## 🎉 Resultado

Tu abuelo puede:
1. **Abrir la app una vez al día**
2. **Decir "iris" cuando necesite algo**
3. **La app se activa automáticamente**
4. **Decir su comando**
5. **Escuchar la respuesta**
6. **TODO sin tocar nada**

¡Perfecto para accesibilidad! 🦯

## 📞 Soporte

Si tienes problemas:
1. Revisa logs en tiempo real: `npx expo start`
2. Busca `[ContinuousWakeWordService]` en logs
3. Verifica que muestra "Listening for iris..."
4. Prueba diciendo "iris" y observa si aparece en logs

## 💡 Tip Final

Para tu abuelo, considera:
- Pegar nota en teléfono: "Di IRIS para activar"
- Volumen al máximo para escuchar mejor las respuestas
- Pantalla siempre encendida mientras usa (ajuste de display)
- Soporte/base para el teléfono (no sostenerlo)
