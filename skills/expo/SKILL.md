---
name: expo
description: >
  Expo SDK patterns, managed workflow, and native module integration.
  Trigger: When working with Expo APIs, configuration, or building apps.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  scope: [mobile]
  auto_invoke:
    - "Using Expo SDK modules"
    - "Configuring app.json or app.config.js"
    - "Building with EAS"
---

## When to Use

- Using any `expo-*` package
- Configuring `app.json` or `app.config.js`
- Building with EAS Build
- Managing permissions
- Working with Expo Router

---

## Critical Patterns

### App Configuration

```javascript
// app.config.js (dynamic config - preferred)
export default ({ config }) => ({
  ...config,
  name: 'Iris',
  slug: 'iris',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    bundleIdentifier: 'com.yourcompany.iris',
    supportsTablet: false,
  },
  android: {
    package: 'com.yourcompany.iris',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  plugins: [
    // Plugins configured here
  ],
});
```

### Permissions with Config Plugins

```javascript
// app.config.js
plugins: [
  [
    'expo-camera',
    {
      cameraPermission: 'Iris needs camera to describe your surroundings',
      microphonePermission: 'Iris needs microphone for voice commands',
    },
  ],
  [
    'expo-speech',
    {
      speechRecognitionPermission: 'Iris needs speech recognition for voice commands',
    },
  ],
],
```

---

## Common Expo Modules

### Camera

```javascript
import { Camera, CameraView } from 'expo-camera';

// Request permission
const [permission, requestPermission] = Camera.useCameraPermissions();

if (!permission?.granted) {
  await requestPermission();
}

// Use camera
<CameraView 
  style={{ flex: 1 }} 
  facing="back"
  ref={cameraRef}
/>

// Take photo
const photo = await cameraRef.current.takePictureAsync({
  quality: 0.8,
  base64: true,
});
```

### Speech (TTS)

```javascript
import * as Speech from 'expo-speech';

// Speak
Speech.speak('Hello world', {
  language: 'es-ES',
  rate: 0.85,
  pitch: 1.1,
  onDone: () => console.log('Done speaking'),
});

// Stop
Speech.stop();

// Check if speaking
const isSpeaking = await Speech.isSpeakingAsync();
```

### Haptics

```javascript
import * as Haptics from 'expo-haptics';

// Light tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Success/Error/Warning
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

### Keep Awake

```javascript
import { useKeepAwake } from 'expo-keep-awake';

function App() {
  useKeepAwake(); // Prevents screen from sleeping
  return <View />;
}
```

### Brightness

```javascript
import * as Brightness from 'expo-brightness';

// Get current brightness
const brightness = await Brightness.getBrightnessAsync();

// Set brightness (0-1)
await Brightness.setBrightnessAsync(0.2);

// Restore system brightness
await Brightness.useSystemBrightnessAsync();
```

---

## EAS Build

### Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure
```

### eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {}
  }
}
```

### Build Commands

```bash
# Development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview (internal testing)
eas build --profile preview --platform all

# Production
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Development Commands

```bash
# Start dev server
npx expo start

# Clear cache
npx expo start --clear

# Run on specific platform
npx expo run:ios
npx expo run:android

# Install compatible package
npx expo install expo-camera

# Check for issues
npx expo-doctor

# Prebuild (generate native projects)
npx expo prebuild

# Upgrade Expo SDK
npx expo install expo@latest
npx expo install --fix
```

---

## Environment Variables

```javascript
// app.config.js
export default {
  extra: {
    apiUrl: process.env.API_URL,
    eas: {
      projectId: 'your-project-id',
    },
  },
};

// Access in app
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig.extra.apiUrl;
```

---

## Anti-patterns

| Don't | Do |
|-------|-----|
| `npm install` for Expo packages | `npx expo install` (ensures compatibility) |
| Hardcode permissions text | Use config plugins in app.config.js |
| Ignore SDK version compatibility | Check docs for supported versions |
| Mix managed and bare workflows | Stick to one or use prebuild |
