# Build Instructions - Iris Vision Assistant

## Prerequisites

- macOS (for iOS builds)
- Android Studio (for Android builds)
- Node.js >= 18
- Physical device (Android or iPhone)

---

## Option 1: Android Build with ADB Wireless (Recommended)

### Step 1: Configure ADB Wireless

**First time (USB cable required):**

```bash
# 1. Enable "USB Debugging" on your Android:
#    Settings > About phone > Tap "Build number" 7 times
#    Settings > Developer options > USB debugging (enable)

# 2. Connect phone via USB temporarily

# 3. Verify connection
adb devices
# Should show your device

# 4. Enable WiFi debugging
adb tcpip 5555

# 5. Get your phone's IP address
#    Settings > About phone > Status > IP address
#    Example: 192.168.1.100

# 6. Disconnect USB cable

# 7. Connect via WiFi
adb connect 192.168.1.100:5555

# 8. Verify
adb devices
# Should show: 192.168.1.100:5555  device
```

**For subsequent times (no USB needed):**

```bash
adb connect <PHONE-IP>:5555
```

### Step 2: Build and Install

```bash
cd mobile

# Clean previous build
rm -rf android

# Prebuild (generates native code)
npx expo prebuild --clean --platform android

# Build and install on device
npx expo run:android
```

This will:
1. Compile the app
2. Install on your phone
3. Start Metro bundler
4. Open the app automatically

### Step 3: Test

1. The app will open automatically
2. Grant camera and microphone permissions
3. Say **"iris describe"**
4. The app should:
   - Capture photo
   - Analyze with TFLite
   - Speak what it sees

---

## Option 2: Build with EAS (No Cable Required)

If you don't have access to a USB cable or USB port:

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login (create account if you don't have one)
eas login

# Build for Android (APK)
eas build --platform android --profile preview

# Wait ~15-20 minutes
# Download the APK from the provided link
# Install on your phone
```

---

## Option 3: iOS Build

```bash
cd mobile

# Prebuild
npx expo prebuild --clean --platform ios

# Build (requires Mac + Xcode)
npx expo run:ios --device
```

---

## Troubleshooting

### Port 8081 in use

```bash
lsof -ti:8081 | xargs kill -9
npx expo start --clear
```

### Build fails with "module not found"

```bash
cd mobile
rm -rf node_modules
rm -rf android ios
npm install
npx expo prebuild --clean
```

### ADB can't find device

```bash
# Verify both are on the same WiFi network
adb connect <IP>:5555

# If it doesn't work, reconnect via USB
adb usb
adb tcpip 5555
adb connect <IP>:5555
```

### TFLite fails to load model

The code has automatic fallback to mock mode. Check the logs:

```bash
# Android logs
adb logcat | grep TFLite

# You should see:
# [TFLiteVisionAdapter] Model loaded successfully
# Or: [TFLiteVisionAdapter] Falling back to MOCK mode
```

### Permissions denied

```bash
# Android: Go to Settings > Apps > Iris > Permissions
# iOS: Go to Settings > Iris > Permissions
```

---

## Verify TFLite Works

### Expected logs (real mode):

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

### Expected logs (mock/fallback mode):

```
[TFLiteVisionAdapter] Falling back to MOCK mode
[TFLiteVisionAdapter] Running MOCK detection
```

---

## Complete Testing

### 1. Wake Word Detection

```
Say: "iris describe"
Expected: Vibration + photo capture + analysis
```

### 2. Vision Analysis

```
Result: "I see a person and a chair in the center"
(Or mock result if TFLite failed)
```

### 3. Repeat Command

```
Say: "iris repeat"
Expected: Repeats last description
```

### 4. Help Command

```
Say: "iris help"
Expected: Lists available commands
```

### 5. Stop Command

```
Say: "iris stop"
Expected: Stops TTS
```

---

## Expected Performance

### First execution:
- Model loading: ~500-1000ms
- Capture: ~200ms
- Inference: ~200-500ms
- **Total: ~1-2 seconds**

### Subsequent executions:
- Capture: ~200ms
- Inference: ~200-500ms
- **Total: ~500-800ms**

---

## Debug Mode

To see all logs:

```bash
# Android
adb logcat | grep -E "(TFLite|Vision|Iris|Expo)"

# Metro bundler
npx expo start --clear
# Press 'j' to open debugger
```

---

## Important Notes

1. **TFLite requires physical device** - Doesn't work on emulator
2. **Wake word requires real microphone** - Doesn't work on emulator
3. **COCO-SSD model downloaded:** ✅ `mobile/assets/models/coco_ssd_mobilenet_v1.tflite`
4. **Metro config updated:** ✅ Supports `.tflite` files
5. **Automatic fallback:** If TFLite fails, uses mock data

---

## Next Steps After Build

Once you confirm TFLite works on your device:

1. ✅ Test various objects (person, chair, laptop, cup, etc.)
2. ✅ Verify Spanish translations
3. ✅ Test in different lighting conditions
4. ✅ Measure battery drain with continuous use
5. ⚠️ Adjust minimum confidence (currently 30%)
6. ⚠️ Optimize image resize for better performance

---

## Contact

If you encounter issues, please share:
- Logs from `adb logcat | grep TFLite`
- Android version
- Phone model
- Complete error message
