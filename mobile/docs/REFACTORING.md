# Refactoring: App.tsx

## Problema Original

El `App.tsx` original tenía:
- 100+ líneas de código
- Múltiples responsabilidades mezcladas
- Lógica de negocio en componente de presentación
- Event listeners directamente en componente
- Difícil de testear
- Difícil de mantener

## Solución: Separación de Concerns

### Antes (❌ Código Spaghetti)

```tsx
// App.tsx - 100+ líneas
export default function App() {
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const serviceRef = useRef<ContinuousWakeWordService | null>(null);
  const appState = useRef(AppState.currentState);

  // Inicialización complicada
  useEffect(() => {
    const service = ContinuousWakeWordService.getInstance();
    serviceRef.current = service;
    const startWakeWord = async () => { /* ... */ };
    startWakeWord();
    return () => { service.stop(); };
  }, []);

  // Event listeners mezclados
  useSpeechRecognitionEvent('result', (event) => {
    serviceRef.current?.handleResult(event);
  });
  useSpeechRecognitionEvent('error', (event) => { /* ... */ });
  useSpeechRecognitionEvent('end', () => { /* ... */ });

  // App state changes complicados
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Lógica compleja de restart...
      }
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); };
  }, []);

  // UI mezclada con lógica
  return (
    <View>
      {wakeWordActive && <View><Text>...</Text></View>}
      <HomeScreen />
    </View>
  );
}
```

### Después (✅ Clean Architecture)

```tsx
// App.tsx - 30 líneas, limpio y claro
export default function App() {
  // Custom hook maneja wake word
  const { isActive, lastTranscript, start } = useContinuousWakeWord({
    onWakeWord: (transcript) => {
      console.log('Wake word detected:', transcript);
    },
    autoStart: true,
  });

  // Custom hook maneja app state
  useAppStateWakeWord({
    onForeground: async () => {
      if (!isActive) await start();
    },
    onBackground: () => {
      console.log('Wake word continues');
    },
  });

  // UI simple y declarativa
  return (
    <View style={styles.container}>
      <WakeWordStatusBar isActive={isActive} lastTranscript={lastTranscript} />
      <HomeScreen wakeWordActive={isActive} lastTranscript={lastTranscript} />
      <StatusBar style="auto" />
    </View>
  );
}
```

## Componentes Creados

### 1. useContinuousWakeWord Hook

**Ubicación**: `src/voice/presentation/hooks/useContinuousWakeWord.ts`

**Responsabilidad**: Manejar lifecycle de wake word detection

**Features**:
- ✅ Inicialización del servicio
- ✅ Manejo de event listeners
- ✅ Auto-start opcional
- ✅ Cleanup automático
- ✅ Error handling
- ✅ Estado: isActive, lastTranscript, error

**Uso**:
```tsx
const { isActive, lastTranscript, start, stop } = useContinuousWakeWord({
  onWakeWord: (text) => console.log('Detected:', text),
  autoStart: true
});
```

### 2. useAppStateWakeWord Hook

**Ubicación**: `src/voice/presentation/hooks/useAppStateWakeWord.ts`

**Responsabilidad**: Manejar cambios de app state (foreground/background)

**Features**:
- ✅ Detecta cuando app va a foreground
- ✅ Detecta cuando app va a background
- ✅ Callbacks configurables
- ✅ Cleanup automático

**Uso**:
```tsx
useAppStateWakeWord({
  onForeground: () => console.log('App active'),
  onBackground: () => console.log('App inactive')
});
```

### 3. WakeWordStatusBar Component

**Ubicación**: `src/shared/presentation/components/atoms/WakeWordStatusBar.tsx`

**Responsabilidad**: Mostrar estado de wake word detection

**Features**:
- ✅ Muestra barra verde cuando activo
- ✅ Muestra último transcript detectado
- ✅ Se oculta cuando no está activo
- ✅ Atomic Design (átomo)

**Uso**:
```tsx
<WakeWordStatusBar isActive={true} lastTranscript="iris describe" />
```

## Arquitectura

### Separation of Concerns

```
App.tsx (Presentation Layer)
    ↓ uses
useContinuousWakeWord (Presentation Hook)
    ↓ uses
ContinuousWakeWordService (Infrastructure Service)
    ↓ uses
ExpoSpeechRecognitionModule (External SDK)
```

### Responsabilidades Claras

| Componente | Responsabilidad |
|------------|----------------|
| `App.tsx` | Composición y coordinación |
| `useContinuousWakeWord` | Estado y lifecycle de wake word |
| `useAppStateWakeWord` | Manejo de app state |
| `WakeWordStatusBar` | Presentación de estado |
| `ContinuousWakeWordService` | Lógica de wake word detection |

## Beneficios

### 1. Testabilidad

**Antes**: Difícil de testear App.tsx con tanta lógica mezclada

**Después**: Cada pieza es testeable por separado

```tsx
// Testear hook
describe('useContinuousWakeWord', () => {
  it('should start on mount when autoStart is true', () => {
    const { result } = renderHook(() => useContinuousWakeWord({
      onWakeWord: jest.fn(),
      autoStart: true
    }));
    
    expect(result.current.isActive).toBe(true);
  });
});
```

### 2. Reusabilidad

Los hooks pueden usarse en otros componentes:

```tsx
// En otro componente
function SettingsScreen() {
  const { isActive, start, stop } = useContinuousWakeWord({
    onWakeWord: (text) => console.log(text),
    autoStart: false
  });
  
  return (
    <Button onPress={isActive ? stop : start}>
      {isActive ? 'Detener' : 'Iniciar'} Wake Word
    </Button>
  );
}
```

### 3. Mantenibilidad

Cada archivo tiene una responsabilidad clara:
- Fácil encontrar bugs
- Fácil agregar features
- Cambios no afectan otros componentes

### 4. Legibilidad

`App.tsx` ahora es:
- 30 líneas vs 100+
- Autodocumentado
- Declarativo
- Sin magia oculta

## Patrones Aplicados

### Custom Hooks Pattern

Extraer lógica compleja a hooks reutilizables:

```tsx
// ❌ Antes: Lógica en componente
function App() {
  const [state, setState] = useState();
  useEffect(() => { /* lógica compleja */ }, []);
  // ...
}

// ✅ Después: Lógica en hook
function App() {
  const { state } = useMyCustomHook();
  // ...
}
```

### Composition Pattern

Componentes pequeños que se componen:

```tsx
<View>
  <WakeWordStatusBar />  {/* Átomo */}
  <HomeScreen />         {/* Página */}
</View>
```

### Single Responsibility Principle

Cada módulo tiene una sola razón para cambiar:

- `useContinuousWakeWord` - Cambia si lógica de wake word cambia
- `useAppStateWakeWord` - Cambia si lógica de app state cambia
- `WakeWordStatusBar` - Cambia si UI de status cambia

## Próximos Refactors

### HomeScreen.tsx

Actualmente recibe props del wake word. Considerar:

```tsx
// Opción 1: Context API
<WakeWordProvider>
  <HomeScreen />
</WakeWordProvider>

// Dentro de HomeScreen
const { isActive, lastTranscript } = useWakeWordContext();
```

### VoiceCommandPanel

Simplificar integrando hooks directamente:

```tsx
function VoiceCommandPanel() {
  const { isActive } = useContinuousWakeWord();
  const voice = useVoiceCommands();
  // ...
}
```

## Referencias

- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [Atomic Design](https://atomicdesign.bradfrost.com/)
