# Development Setup - Iris Mobile

Guide to configure the Iris development environment.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

## Initial Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Verify Configuration

Make sure `app.json` has all necessary plugins:

```json
{
  "expo": {
    "plugins": [
      ["expo-camera", {...}],
      ["expo-image-picker", {...}],
      ["expo-speech-recognition", {...}]
    ]
  }
}
```

### 3. Prebuild (Required after app.json changes)

When you add or modify plugins in `app.json`, you need to rebuild native projects:

```bash
# Clean previous builds
npx expo prebuild --clean

# Or platform-specific
npx expo prebuild --platform android --clean
npx expo prebuild --platform ios --clean
```

## Development Commands

### Start Development Server

```bash
# Development mode with Expo Go
npx expo start

# Development build mode (recommended for native plugins)
npx expo start --dev-client
```

### Run on Device

#### Android

```bash
# Development build
npx expo run:android

# Release build
npx expo run:android --variant release
```

#### iOS

```bash
# Development build
npx expo run:ios

# Release build
npx expo run:ios --configuration Release
```

## Troubleshooting

### Error: "Unable to resolve expo-image-picker"

**Problem:** The `expo-image-picker` package is not installed.

**Solution:**
```bash
npm install expo-image-picker
npx expo prebuild --clean
npx expo run:android  # or npx expo run:ios
```

### Error: Permissions not working

**Problem:** Permissions in `app.json` were not applied.

**Solution:**
```bash
# Clean and rebuild
npx expo prebuild --clean
npx expo run:android  # or npx expo run:ios
```

### Error: "Module not found" after installing package

**Problem:** Metro cache is not updated.

**Solution:**
```bash
# Clear Metro cache
npx expo start --clear

# Or completely restart
rm -rf node_modules
npm install
npx expo start --clear
```

### Error: Build fails with TensorFlow Lite

**Problem:** TFLite models are not being packaged correctly.

**Solution:**
```bash
# Verify model exists
ls assets/models/coco_ssd_mobilenet_v1.tflite

# Rebuild
npx expo prebuild --clean
npx expo run:android
```

### Error: Camera doesn't work on Android

**Problem:** Permissions not configured correctly.

**Solution:**
1. Verify `app.json` has permissions:
   ```json
   "permissions": [
     "CAMERA",
     "READ_MEDIA_IMAGES",
     ...
   ]
   ```

2. Rebuild:
   ```bash
   npx expo prebuild --clean --platform android
   npx expo run:android
   ```

3. On device, go to Settings > Apps > Iris > Permissions and enable manually.

## Recommended Workflow

### Normal Development (no app.json changes)

```bash
# 1. Start server
npx expo start

# 2. Press 'a' for Android or 'i' for iOS
```

### After Installing New Native Package

```bash
# 1. Install package
npm install <package>

# 2. Update app.json if necessary
# (add plugin or permissions)

# 3. Clean and rebuild
npx expo prebuild --clean

# 4. Run on device
npx expo run:android  # or run:ios
```

### After Modifying app.json

```bash
# 1. Clean previous builds
npx expo prebuild --clean

# 2. Rebuild for desired platform
npx expo run:android  # or run:ios
```

## Permissions Structure

### iOS (infoPlist)

```json
{
  "NSCameraUsageDescription": "Reason to use camera",
  "NSPhotoLibraryUsageDescription": "Reason to access gallery",
  "NSMicrophoneUsageDescription": "Reason to use microphone",
  "NSSpeechRecognitionUsageDescription": "Reason for speech recognition"
}
```

### Android (permissions)

```json
{
  "permissions": [
    "CAMERA",
    "READ_MEDIA_IMAGES",
    "READ_EXTERNAL_STORAGE",
    "RECORD_AUDIO"
  ]
}
```

## Testing

### Run Tests

```bash
# All tests
npm test

# Specific tests
npm test ImagePicker.test.tsx

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Linting

```bash
# Run linter
npm run lint

# Auto-fix
npm run lint -- --fix
```

## Production Build

### Android

```bash
# Local APK build
eas build --platform android --profile preview --local

# Google Play build
eas build --platform android --profile production
```

### iOS

```bash
# Local build
eas build --platform ios --profile preview --local

# App Store build
eas build --platform ios --profile production
```

## Environment Variables

The project uses development mode controlled by constant in `App.tsx`:

```typescript
const DEV_MODE = true;  // Activate test panel
```

For production, change to:

```typescript
const DEV_MODE = false;  // Normal mode with wake word
```

## Useful Resources

- [Expo Docs](https://docs.expo.dev/)
- [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native Docs](https://reactnative.dev/)
- [TensorFlow Lite](https://www.tensorflow.org/lite)

## Complete Setup Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] `expo-image-picker` installed
- [ ] `app.json` configured with plugins
- [ ] Prebuild executed (`npx expo prebuild --clean`)
- [ ] App running on device
- [ ] Camera permissions granted
- [ ] Gallery permissions granted
- [ ] TFLite models loaded (see logs)
- [ ] Tests passing (`npm test`)
