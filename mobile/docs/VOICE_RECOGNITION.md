# Voice recognition

Real-time Spanish voice recognition for Iris using expo-speech-recognition.

## Features

- Real-time speech-to-text in Spanish
- Wake word detection ("iris")
- Command processing with state machine
- Text-to-speech responses
- Automatic permission handling

## Quick start

```typescript
import { useVoiceCommands } from '@/voice/presentation/hooks/useVoiceCommands';

function MyComponent() {
  const { isListening, transcript, start, stop } = useVoiceCommands({
    onTranscript: (text, confidence) => {
      console.log('Heard:', text);
    }
  });

  return (
    <Button onPress={start}>
      {isListening ? 'Listening...' : 'Activate'}
    </Button>
  );
}
```

## Architecture

### Adapters

Three speech recognition adapters are available:

| Adapter | Use case | Setup |
|---------|----------|-------|
| `ExpoSpeechRecognitionAdapter` | Production (recommended) | Requires native build |
| `MockVoiceAdapter` | Development/testing | No setup needed |
| `WhisperAdapter` | Offline/privacy-first | Requires model download |

### State machine

Voice commands flow through an XState v5 state machine:

```
idle → listening → processing → speaking → listening
         ↓
       error → retry → listening
```

## Installation

```bash
# Install dependencies
npm install expo-speech-recognition expo-speech

# Generate native code
npx expo prebuild --clean

# Run on device
npx expo run:android
```

## Configuration

### Permissions

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-speech-recognition",
        {
          "microphonePermission": "Iris needs microphone access for voice commands",
          "speechRecognitionPermission": "Iris needs speech recognition to process commands"
        }
      ]
    ],
    "android": {
      "permissions": ["RECORD_AUDIO"]
    },
    "ios": {
      "infoPlist": {
        "NSSpeechRecognitionUsageDescription": "Iris needs speech recognition for voice commands",
        "NSMicrophoneUsageDescription": "Iris needs microphone access for voice commands"
      }
    }
  }
}
```

### Language

Change recognition language:

```typescript
const voiceRecognition = useVoiceRecognition({
  language: 'en-US', // Default: 'es-ES'
});
```

## Usage

### Basic command detection

```typescript
import { useVoiceCommands } from '@/voice/presentation/hooks/useVoiceCommands';

function VoicePanel() {
  const {
    isListening,
    transcript,
    error,
    start,
    stop
  } = useVoiceCommands();

  return (
    <View>
      <Text>Status: {isListening ? 'Listening' : 'Idle'}</Text>
      <Text>Transcript: {transcript}</Text>
      {error && <Text>Error: {error}</Text>}
      <Button onPress={start}>Start</Button>
      <Button onPress={stop}>Stop</Button>
    </View>
  );
}
```

### With callbacks

```typescript
useVoiceCommands({
  autoStart: true,
  onCommand: (command) => {
    console.log('Command detected:', command.intent);
  },
  onDescription: (text) => {
    console.log('Description:', text);
  },
  onError: (error) => {
    console.error('Voice error:', error);
  }
});
```

## Supported commands

Commands must start with wake word "iris":

| Command | Intent | Action |
|---------|--------|--------|
| "iris describe" | DESCRIBE | Analyze and describe scene |
| "iris repeat" | REPEAT | Repeat last description |
| "iris help" | HELP | Provide help information |
| "iris stop" | STOP | Stop current action |
| "iris goodbye" | GOODBYE | Shutdown assistant |

## Adapters reference

### ExpoSpeechRecognitionAdapter

Production adapter using expo-speech-recognition.

**Pros:**
- Native Expo integration
- Real-time transcription
- Automatic permission handling
- TypeScript support

**Cons:**
- Requires internet
- Requires native build

**Example:**

```typescript
import { ExpoSpeechRecognitionAdapter } from '@/voice/infrastructure/adapters/expo/ExpoSpeechRecognitionAdapter';

const adapter = new ExpoSpeechRecognitionAdapter({
  language: 'es-ES',
  onResult: (result) => {
    console.log(result.transcript);
  }
});

await adapter.initialize();
await adapter.startListening();
```

### MockVoiceAdapter

Testing adapter that simulates voice input.

**Use for:**
- Development without microphone
- Automated testing
- UI development

**Example:**

```typescript
import { MockVoiceAdapter } from '@/voice/infrastructure/adapters/mock/MockVoiceAdapter';

const adapter = new MockVoiceAdapter();
await adapter.startListening(); // Simulates "iris describe" after 2s
```

### WhisperAdapter

On-device speech recognition using Whisper model.

**Pros:**
- Works offline
- Privacy-first
- No data sent to servers

**Cons:**
- Large model file (~75MB)
- Slower than cloud
- More battery usage

**Setup:**

```bash
# Download model
curl -O https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# Place in assets
mv ggml-base.bin assets/models/
```

## Troubleshooting

### Speech recognition not available

**Problem:** Error "Speech recognition not available on this device"

**Solution:**
- Run `npx expo run:android` instead of Expo Go
- expo-speech-recognition requires native code

### Permission denied

**Problem:** Error "Microphone permission denied"

**Solution:**
- Check Settings > Apps > Iris > Permissions
- Enable "Microphone" permission
- Restart app

### Low confidence scores

**Problem:** Commands not detected (confidence < 0.7)

**Solution:**
- Speak clearly and slowly
- Reduce background noise
- Move closer to microphone
- Check `voiceMachine.ts` confidence threshold (line 22)

### No response after speaking

**Problem:** Transcript shows but no action

**Solution:**
- Ensure wake word "iris" is included
- Check logs for state machine transitions
- Verify WakeWordParser is working (check tests)

## Testing

### Unit tests

```bash
npm test -- voiceMachine.test.ts
npm test -- WakeWordParser.test.ts
npm test -- ProcessCommand.test.ts
```

### Manual testing

1. Start app on physical device
2. Grant microphone permission
3. Press "Activate" button
4. Speak: "iris describe"
5. Verify:
   - PulsingCircle shows green (listening)
   - Transcript appears
   - State changes to processing
   - TTS speaks response

## API reference

### useVoiceCommands

React hook for voice command processing.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `autoStart` | boolean | false | Auto-start listening on mount |
| `onCommand` | function | - | Called when command detected |
| `onDescription` | function | - | Called with TTS text |
| `onError` | function | - | Called on errors |

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `isListening` | boolean | Currently listening |
| `isProcessing` | boolean | Processing command |
| `isSpeaking` | boolean | Speaking response |
| `hasError` | boolean | Error occurred |
| `transcript` | string | Current transcript |
| `error` | string \| null | Error message |
| `start` | function | Start listening |
| `stop` | function | Stop listening |
| `retry` | function | Retry after error |

### useVoiceRecognition

Lower-level hook for speech recognition.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `language` | string | 'es-ES' | Recognition language |
| `onTranscript` | function | - | Called with transcript |
| `onError` | function | - | Called on errors |
| `autoInitialize` | boolean | false | Auto-initialize on mount |

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `isListening` | boolean | Currently listening |
| `transcript` | string | Current transcript |
| `confidence` | number | Confidence score 0-1 |
| `error` | Error \| null | Error object |
| `startListening` | function | Start recognition |
| `stopListening` | function | Stop recognition |

## Performance

### Latency

| Stage | Duration |
|-------|----------|
| Wake word detection | < 100ms |
| Speech recognition | Real-time |
| Command processing | < 50ms |
| TTS start | < 200ms |

### Battery impact

- Listening: ~5% per hour
- Processing: Negligible
- TTS: ~2% per hour

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

MIT
