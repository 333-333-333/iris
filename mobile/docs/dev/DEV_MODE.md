# Development Mode - Iris

This document explains how to use Iris development mode to test functionalities without voice commands.

## Enable Development Mode

In the `App.tsx` file, change the `DEV_MODE` constant to `true`:

```typescript
// Development mode: change to true to activate test panel
const DEV_MODE = true;
```

## Test Screen

When `DEV_MODE` is enabled, the application shows a screen with two tabs:

### 1. Voice Tab 🎤

Displays the normal voice command panel (`VoiceCommandPanel`).

**Functionality:**
- "Activate" button to start voice recognition
- "Stop" button to halt
- Visual state indicator (listening, processing, speaking)
- Shows transcript of what is heard
- Error handling with "Retry" button

### 2. Vision Tab 👁️

Displays the vision AI test panel (`VisionTestPanel`).

**Functionality:**
- **Status indicator**: Shows if TensorFlow Lite models are loaded
  - ✓ Models loaded (green)
  - ⏳ Loading models... (yellow)

- **📁 Analyze from Gallery**: 
  - Opens gallery selector
  - Allows selecting any saved image
  - Analyzes image with TensorFlow Lite
  - Shows preview of selected image
  - Generates description in Spanish

- **📷 Capture and Analyze**: 
  - Opens camera to take new photo
  - Analyzes captured photo
  - Shows photo preview
  - Generates description in Spanish

- **🎯 Analyze Current Scene**: 
  - Automatically captures with rear camera
  - Runs object detection model (COCO-SSD)
  - Generates description in Spanish
  - Shows result on screen

- **"Clear Results" button**: 
  - Appears after analysis
  - Clears results and preview for new test

- **Visual states**:
  - 🔍 Analyzing image... (during process)
  - Preview of selected/captured image
  - Result with green background (success)
  - Error with red background (failure)

## Vision Test Flows

### Option 1: Analyze image from gallery (Recommended for development)

1. **Wait** for "✓ Models loaded" to appear
2. **Press** "📁 Analyze from Gallery"
3. **Select** an image from your gallery
4. **Wait** a few seconds while processing
5. **Read** the result on screen
6. **View** the analyzed image preview

### Option 2: Capture new photo

1. **Wait** for "✓ Models loaded" to appear
2. **Press** "📷 Capture and Analyze"
3. **Take** a photo with the camera
4. **Wait** a few seconds while processing
5. **Read** the result on screen
6. **View** the photo preview

### Option 3: Analyze current scene

1. **Wait** for "✓ Models loaded" to appear
2. **Point** the phone at some object
3. **Press** "🎯 Analyze Current Scene"
4. **Wait** a few seconds while processing
5. **Read** the result on screen

Example result:
```
I see a person, a chair, and a laptop
```

## Required Permissions

To use the vision panel you need:

- ✅ **Gallery permission**: To select saved images (requested automatically)
- ✅ **Camera permission**: To capture new photos or analyze current scene (requested automatically)

If permissions are denied, you'll see errors like:
```
Gallery access permission needed
Camera access permission needed
```

## Test Panel Architecture

```
TestScreen (page)
  ├── Voice Tab
  │   └── VoiceCommandPanel (molecule)
  │       └── useVoiceCommands (hook)
  │
  └── Vision Tab
      └── VisionTestPanel (molecule)
          └── useVisionService (hook)
              ├── ExpoCameraAdapter
              └── TFLiteVisionAdapter
```

## Key Files

| File | Description |
|------|-------------|
| `App.tsx` | Entry point - enables/disables DEV_MODE |
| `TestScreen.tsx` | Test screen with tabs |
| `VisionTestPanel.tsx` | Vision test panel |
| `ImagePicker.tsx` | Component to select/capture images |
| `VoiceCommandPanel.tsx` | Voice command panel |

## Disable Development Mode

To return to normal mode (with wake word detection):

1. Open `App.tsx`
2. Change `DEV_MODE` to `false`:
   ```typescript
   const DEV_MODE = false;
   ```
3. Save and reload the app

## Debugging

To see vision logs:

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

Look for logs with prefix:
- `[VisionTestPanel]` - Test panel
- `[TFLiteVisionAdapter]` - Object detection
- `[ExpoCameraAdapter]` - Camera
- `[useVisionService]` - Vision hook

## Tests

The test panel has unit tests:

```bash
# Run panel tests
npm test VisionTestPanel.test.tsx

# Run all tests
npm test
```

Included tests:
- ✅ Correct rendering
- ✅ Model loading state
- ✅ Button disabled when not ready
- ✅ analyzeScene call
- ✅ Show successful result
- ✅ Show errors
- ✅ Clear results

## Troubleshooting

### Models don't load

**Symptom**: Stays on "⏳ Loading models..."

**Solutions**:
1. Verify `react-native-fast-tflite` is installed
2. Check console logs
3. Restart the app

### Camera error

**Symptom**: "Camera not available"

**Solutions**:
1. Check permissions in device settings
2. Close other apps using the camera
3. Restart the app

### Doesn't detect objects

**Symptom**: "No objects detected"

**Possible causes**:
1. Low light in scene
2. Objects not in COCO-SSD's 80 categories
3. Objects too far or blurry
4. Confidence score too low (< 0.5)

**Solutions**:
1. Improve lighting
2. Try common objects (person, chair, laptop, phone, etc.)
3. Get closer to objects
4. Wait for camera to focus

### Crash when pressing "Analyze Scene"

**Solutions**:
1. Verify CameraCapture is mounted in App.tsx
2. Check models are loaded (✓ green)
3. Verify camera permissions
4. Look at error logs

## Future Improvements

- [ ] Button to manually take photo before analyzing
- [ ] Show bounding boxes in preview
- [ ] Adjust confidence threshold
- [ ] Debug mode with more details (coordinates, scores, etc.)
- [ ] Analysis history
- [ ] Export results to JSON
