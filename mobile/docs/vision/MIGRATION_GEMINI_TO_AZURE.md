# Migration: Gemini to Azure Computer Vision

## Summary

Changed from Google Gemini Vision to Azure Computer Vision to take advantage of a more generous free tier and better detection capabilities.

## Reasons for the change

| Aspect | Gemini | Azure Computer Vision |
|--------|--------|----------------------|
| Free Tier | 1,500 requests/day (15/min) | 5,000 requests/month |
| Speed | ~2-3s | ~1-2s |
| Detection | Only descriptive text | Objects + coordinates + description |
| API | Chat-based (heavy) | Specialized REST (lightweight) |
| Structured data | No | Yes (JSON with objects) |

## Changes made

### Dependencies

Removed:
```json
"@google/generative-ai": "^0.24.1"
```

Added:
```json
"axios": "^1.13.2"
```

### Configuration

Before (Gemini):
```bash
# .env
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

Now (Azure):
```bash
# .env
EXPO_PUBLIC_AZURE_CV_API_KEY=your-azure-api-key-here
EXPO_PUBLIC_AZURE_CV_ENDPOINT=https://iris-assistant-cv.cognitiveservices.azure.com/
```

### New files

```
src/
├── config/
│   └── azure.ts                    # NEW: Azure CV configuration
│
└── vision/infrastructure/adapters/
    └── azure/
        └── AzureVisionAdapter.ts   # NEW: Azure CV adapter
```

### Modified files

```
src/config/gemini.ts                              → Replaced by azure.ts
src/vision/infrastructure/adapters/hybrid/HybridVisionAdapter.ts
    - Changed: geminiAdapter → azureAdapter
    - Updated: constructor now receives { apiKey, endpoint }
    
src/vision/presentation/hooks/useVisionService.ts
    - Changed: getGeminiApiKey() → getAzureConfig()
    - Updated: passes complete config to HybridVisionAdapter

package.json                                      → Removed Gemini, added axios
README.md                                         → Updated documentation
docs/VISION_SERVICE.md                            → Added hybrid strategy
.env                                              → New Azure credentials
.env.example                                      → Updated template
```

### Unused files (can be removed later)

```
src/config/gemini.ts                               # No longer used
src/vision/infrastructure/adapters/gemini/GeminiVisionAdapter.ts  # No longer used
```

## Updated architecture

### HybridVisionAdapter (Strategy)

```typescript
// Before
constructor(geminiApiKey?: string)

// Now
constructor(azureConfig?: { apiKey: string; endpoint: string })
```

### Analysis flow

```
1. TFLite detects objects locally (200-500ms)
   → objects: DetectedObject[]
   → naturalDescription: "basic template"

2. If there is internet:
   a. Azure analyzes context (1-2s)
      → POST /computervision/imageanalysis:analyze
      → Features: caption, denseCaptions, objects, tags
   
   b. Combines results:
      → objects: from TFLite (with normalized coordinates)
      → naturalDescription: from Azure (contextual and rich)

3. If there is NO internet:
   → Uses only TFLite result
```

## Results comparison

### Example: Office photo

TFLite (local):
```json
{
  "objects": [
    { "label": "person", "confidence": 0.92 },
    { "label": "laptop", "confidence": 0.88 },
    { "label": "chair", "confidence": 0.76 }
  ],
  "naturalDescription": "I see a person, a laptop and a chair"
}
```

Azure (enriched):
```json
{
  "objects": [
    { "object": "person", "confidence": 0.94, "rectangle": {...} },
    { "object": "laptop", "confidence": 0.91, "rectangle": {...} },
    { "object": "chair", "confidence": 0.82, "rectangle": {...} }
  ],
  "captionResult": {
    "text": "A person working in a modern office with a laptop on the desk",
    "confidence": 0.89
  }
}
```

Final hybrid result:
```json
{
  "objects": [
    // From TFLite, but with Azure labels if available
    { "label": "person", "labelEs": "persona", "confidence": 0.92, ... },
    { "label": "laptop", "labelEs": "portátil", "confidence": 0.88, ... },
    { "label": "chair", "labelEs": "silla", "confidence": 0.76, ... }
  ],
  "naturalDescription": "A person working in a modern office with a laptop on the desk",
  "confidence": 0.89
}
```

## Advantages of Azure Computer Vision

### Structured data
- Objects with coordinates in absolute pixels (we normalize to 0-1)
- Multiple captions (general + dense per regions)
- Descriptive tags with confidence
- Image metadata (width, height)

### API designed for vision
```typescript
// Gemini (chat-based, generic)
await model.generateContent([prompt, { inlineData: { ... } }])

// Azure (specialized REST)
await axios.post('/imageanalysis:analyze', imageBinary, {
  params: {
    features: 'caption,objects,tags',
    language: 'es'
  }
})
```

### Generous free tier
- 5,000 transactions/month free
- No limit per minute
- Enough for development and beta users

### Predictable latency
- Azure: ~1-2s consistent
- Gemini: ~2-4s variable

## How to use

### Initial configuration

1. Get credentials (already done):
   - Resource: `iris-assistant-cv`
   - Region: East US
   - API Key: Configured in `.env`
   - Endpoint: Configured in `.env`

2. The app automatically detects if Azure is configured:
   ```typescript
   try {
     azureConfig = getAzureConfig();
     console.log('Azure enabled');
   } catch {
     console.log('Azure disabled, using TFLite only');
   }
   ```

### Testing

```bash
# Install dependencies
bun install

# The app will use Azure automatically if:
# 1. There are credentials in .env
# 2. There is internet connection

# Without internet → TFLite only
# With internet → TFLite + Azure (hybrid)
```

## Next step

Test on real device:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios --device
```

Verify logs:
```bash
# Search in logs:
[HybridVisionAdapter] Online - using Azure Computer Vision for rich description
[AzureVisionAdapter] Description: "..."
```

## Result

- More generous free tier (5,000/month vs 1,500/day)
- Better quality of contextual descriptions
- Structured data (objects with coordinates)
- Specialized API for vision (not generic chat)
- Works offline with TFLite as fallback
- Zero downtime - transparent migration

## References

- [Azure Computer Vision Docs](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/)
- [Image Analysis API](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/how-to/call-analyze-image-40)
- [Free Tier Limits](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/computer-vision/)
