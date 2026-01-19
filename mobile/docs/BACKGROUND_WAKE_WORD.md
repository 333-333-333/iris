# Background wake word detection

Always-on wake word detection for Iris, even when app is in background.

## Overview

Iris can listen for "iris" wake word continuously in the background and automatically open the app when detected.

## Architecture

### Components

```
Background Service (always running)
    ↓
Porcupine Wake Word Engine (on-device, low power)
    ↓
Detects "iris" → Foreground app
    ↓
Expo Speech Recognition (full transcription)
    ↓
Process command → Speak response
```

### Flow

```
App in background
    ↓
Porcupine listening (< 1% battery/hour)
    ↓
User says: "iris describe"
    ↓
Porcupine detects "iris"
    ↓
Trigger notification → Open app
    ↓
Start speech recognition for full command
    ↓
Process "describe" command
```

## Setup

### 1. Get Porcupine access key

Sign up at [Picovoice Console](https://console.picovoice.ai/):

1. Create account
2. Create new project
3. Copy Access Key

### 2. Install dependencies

```bash
npm install @picovoice/porcupine-react-native
npx expo install expo-background-fetch expo-task-manager expo-notifications
```

### 3. Configure permissions

Update `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@picovoice/porcupine-react-native",
        {
          "recordPermission": "Iris necesita acceso al micrófono para escuchar el comando 'iris'"
        }
      ]
    ],
    "android": {
      "permissions": [
        "RECORD_AUDIO",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_MICROPHONE",
        "WAKE_LOCK"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSMicrophoneUsageDescription": "Iris escucha continuamente el comando 'iris' para activarse"
      }
    }
  }
}
```

### 4. Configure background task

Create `src/voice/infrastructure/services/BackgroundWakeWordService.ts`:

```typescript
import { Porcupine } from '@picovoice/porcupine-react-native';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const WAKE_WORD_TASK = 'wake-word-detection';
const ACCESS_KEY = 'YOUR_PICOVOICE_ACCESS_KEY'; // From console

export class BackgroundWakeWordService {
  private static porcupine: Porcupine | null = null;

  static async initialize() {
    // Request notification permissions
    await Notifications.requestPermissionsAsync();

    // Create Porcupine instance with "iris" wake word
    this.porcupine = await Porcupine.create(
      ACCESS_KEY,
      ['picovoice'], // Use built-in wake word, or train custom "iris"
      [0.5] // Sensitivity (0-1)
    );

    // Register background task
    await TaskManager.defineTask(WAKE_WORD_TASK, async () => {
      try {
        // Porcupine processes audio buffer
        const keywordIndex = await this.porcupine?.process(audioBuffer);
        
        if (keywordIndex >= 0) {
          // Wake word detected!
          await this.onWakeWordDetected();
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Wake word task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  private static async onWakeWordDetected() {
    // Show notification to bring app to foreground
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Iris activado',
        body: 'Di tu comando',
        sound: true,
        priority: 'high',
        data: { action: 'WAKE_WORD_DETECTED' },
      },
      trigger: null, // Immediate
    });

    // On Android: Start foreground service
    // On iOS: App will open from notification
  }

  static async start() {
    await BackgroundFetch.registerTaskAsync(WAKE_WORD_TASK, {
      minimumInterval: 1, // Check every second
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }

  static async stop() {
    await BackgroundFetch.unregisterTaskAsync(WAKE_WORD_TASK);
    await this.porcupine?.delete();
  }
}
```

### 5. Handle notification tap

In `App.tsx`:

```typescript
import * as Notifications from 'expo-notifications';

export default function App() {
  React.useEffect(() => {
    // Listen for notification tap
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        if (data.action === 'WAKE_WORD_DETECTED') {
          // User tapped notification, start listening
          startVoiceRecognition();
        }
      }
    );

    return () => subscription.remove();
  }, []);

  // ...
}
```

### 6. Start background service

```typescript
import { BackgroundWakeWordService } from '@/voice/infrastructure/services/BackgroundWakeWordService';

// On app mount
React.useEffect(() => {
  BackgroundWakeWordService.initialize();
  BackgroundWakeWordService.start();

  return () => {
    BackgroundWakeWordService.stop();
  };
}, []);
```

## Limitations

### iOS
- Background audio drains battery faster
- User must grant "Allow while using app" permission
- iOS may terminate background audio after some time
- Requires AudioSession configuration

### Android
- Must show persistent notification while listening
- Foreground service required
- Some manufacturers (Xiaomi, Huawei) kill background services aggressively

### Both platforms
- Battery drain: ~5-10% per hour with continuous listening
- Not recommended for 24/7 operation
- Consider "smart activation" (only listen during certain hours)

## Alternative: Button + Quick Launch

For better UX and battery life, consider:

1. **Widget/Quick Action**: Add home screen widget
2. **Siri Shortcut** (iOS): "Hey Siri, open Iris" → starts listening
3. **Google Assistant** (Android): "Ok Google, talk to Iris"
4. **Accessibility Service**: Volume button shortcut

### Widget implementation

```typescript
// iOS Widget
import WidgetKit

struct IrisWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "IrisWidget") { _ in
      Button("Activar Iris") {
        // Open app + start listening
      }
    }
  }
}
```

### Siri Shortcut

```typescript
import * as IntentExtensions from 'expo-intent-extensions';

// Add to Siri: "Activar Iris"
IntentExtensions.addShortcut({
  title: 'Activar Iris',
  phrase: 'Activar Iris',
  onInvoke: () => {
    // Open app + start listening
  }
});
```

## Recommended approach

For Iris (accessibility app), I recommend:

### Phase 1: Quick Access (Current)
✅ Home screen icon → Tap → Starts listening
✅ No battery drain
✅ Simple, reliable

### Phase 2: Widget/Shortcut
✅ Add widget: "Activar Iris"
✅ Siri Shortcut: "Hey Siri, activate Iris"
✅ Still no background drain

### Phase 3: Background Wake Word (Optional)
⚠️ Only if user explicitly enables it
⚠️ Show battery warning
⚠️ Limit to certain hours (e.g., 8am-10pm)

## Battery optimization

If implementing background wake word:

```typescript
class OptimizedBackgroundService {
  private isActive = false;
  private activeHours = { start: 8, end: 22 }; // 8am-10pm

  shouldListen(): boolean {
    const hour = new Date().getHours();
    return hour >= this.activeHours.start && hour < this.activeHours.end;
  }

  async processAudio() {
    if (!this.shouldListen()) {
      return; // Don't process outside active hours
    }

    // Process audio with Porcupine
  }
}
```

## Privacy

Background listening concerns:

- ✅ All processing on-device (Porcupine)
- ✅ No audio sent to servers
- ✅ Only listens for specific wake word
- ✅ No recording/storage of audio
- ❌ Still "always listening" which may concern users

**Recommendation**: Make it opt-in with clear explanation.

## Testing

### Test wake word detection

```typescript
// In dev mode, simulate wake word
if (__DEV__) {
  BackgroundWakeWordService.onWakeWordDetected(); // Manually trigger
}
```

### Test background task

```bash
# Android
adb shell am broadcast -a android.intent.action.BOOT_COMPLETED

# iOS
# Put app in background, wait, check logs
```

## Cost

Porcupine pricing (as of 2024):
- Free tier: 3 devices
- Indie: $55/month for 100 devices
- Business: Custom pricing

For open source/accessibility project, contact Picovoice for free/discounted access.

## Conclusion

**For Iris, I recommend**:
1. Start with button + quick access (current)
2. Add Siri Shortcut / Google Assistant integration
3. Only add background wake word if users request it
4. Make it opt-in with battery warnings

Background wake word is technically feasible but may not be necessary for the use case.
