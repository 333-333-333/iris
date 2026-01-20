# Visual Q&A feature - Setup guide

## Overview

This feature allows Iris to answer specific questions about the last captured image using Groq with Llama 4 Vision.

### Usage examples

```
User: "Iris, describe"
Iris: "I see a red shirt on a white table next to blue jeans"

User: "Iris, what size is the shirt?"
Iris: "The label indicates size M (medium)"

User: "Iris, what brand are the jeans?"
Iris: "They are Levi's 501"

User: "Iris, how much does the shirt cost?"
Iris: "The price on the label is $29.99"
```

## Why Groq with Llama 4 Vision

| Feature | Groq | Gemini | Azure CV |
|---------|------|--------|----------|
| Latency | ~200-400ms | ~1-2s | ~500-800ms |
| Free tier | 14,400 req/day | 1,500 req/day | 5,000 req/month |
| Cost | Free | Free | $1/1,000 req |
| OCR | Included | Limited | Excellent |
| Contextual Q&A | Excellent | Good | No |
| Speed | Ultra fast | Slow | Medium |

Winner: Groq is the fastest with the best free tier.

## Step 1: Get Groq API key

### Create account

1. Go to https://console.groq.com/keys
2. Create free account using email or GitHub
3. No credit card required
4. Instant activation

### Generate API key

1. Click "Create API Key"
2. Name it (e.g., "Iris Mobile App")
3. Copy the key (starts with `gsk_...`)

Important: Save the key immediately, it is only shown once.

## Step 2: Configure the project

### Add API key to .env file

```bash
cd mobile/
```

If .env does not exist, create it:

```bash
cp .env.example .env
```

Edit .env and add your key:

```env
# Groq AI Configuration
EXPO_PUBLIC_GROQ_API_KEY=gsk_YOUR_KEY_HERE
```

### Verify installation

```bash
npm list groq-sdk
```

You should see:

```
iris-mobile@1.0.0
└── groq-sdk@0.x.x
```

If not installed:

```bash
npm install groq-sdk
```

## Architecture

### Complete flow

```
1. User: "Iris, describe"
   ↓
   AnalyzeSceneUseCase
   ↓
   TFLite detects basic objects
   ↓
   ContextRepository.saveContext({ imageUri, objects, description })
   ↓
   Speaks: "I see a red shirt and jeans"

2. User: "Iris, what size is the shirt?"
   ↓
   CommandIntent detects QUESTION
   ↓
   ProcessCommandUseCase.handleQuestion()
   ↓
   AnswerQuestionUseCase.execute()
   ↓
   ContextRepository.getLastContext() retrieves imageUri + objects
   ↓
   GroqVisionAdapter.answerQuestion(imageUri, question, context)
   ↓
   Llama 4 Vision analyzes image + question
   ↓
   Speaks: "The label indicates size M"
```

### Components created

| File | Purpose |
|------|---------|
| `GroqVisionAdapter.ts` | Groq adapter with Llama 4 Vision |
| `IContextRepository.ts` | Port to store visual context |
| `InMemoryContextRepository.ts` | In-memory implementation |
| `AnswerQuestionUseCase.ts` | Use case to answer questions |
| `groq.ts` | Groq configuration |

### Changes to existing files

| File | Change |
|------|--------|
| `IVisionService.ts` | Added `answerQuestion()` method |
| `AnalyzeSceneUseCase.ts` | Saves context after analysis |
| `CommandIntent.ts` | Added `IntentType.QUESTION` with regex patterns |
| `.env.example` | Added Groq configuration |

## How to use the feature

### Supported voice commands

#### DESCRIBE (existing)
```
"Iris, describe"
"Iris, what do you see"
"Iris, what's in front of me"
```

#### QUESTION (new)
```
# Color
"Iris, what color is it?"
"Iris, what color is the shirt?"

# Size
"Iris, what size is it?"
"Iris, what size is it?"

# Brand
"Iris, what brand is it?"
"Iris, what brand is it?"

# Price
"Iris, how much does it cost?"
"Iris, what is the price?"

# General
"Iris, tell me the color"
"Iris, what is the size"
```

### Limitations

1. Temporal context: Context expires after 5 minutes
2. Requires DESCRIBE first: You cannot ask questions without capturing an image first
3. Only last image: Questions refer to the last photo taken

## Testing

### Manual test

```bash
# 1. Start app
npx expo start

# 2. In the app, say:
"Iris, describe"

# Wait for description...

# 3. Then ask:
"Iris, what color is it?"

# Should respond about the color of the objects
```

### Programmatic test (pending)

```typescript
// TODO: Create tests for AnswerQuestionUseCase
describe('AnswerQuestionUseCase', () => {
  it('should answer question with fresh context', async () => {
    // ...
  });
  
  it('should throw error if no context', async () => {
    // ...
  });
  
  it('should throw error if context is stale', async () => {
    // ...
  });
});
```

## Free tier limits

### Groq free tier

- 14,400 requests/day (approximately 600 req/hour, 10 req/minute)
- 30 requests/minute (burst)
- 14,400 tokens/minute
- 5 images per request
- Maximum image size: 20MB
- Maximum resolution: 33 megapixels

### In practice

For an average user:
- 100 descriptions/day: OK
- 200 questions/day: OK
- 300 requests/day total: OK (plenty of margin)

## Troubleshooting

### Error: "API key not found"

```
[GroqConfig] API key not found!
```

Solution:
1. Verify that `.env` exists in `mobile/`
2. Verify that the variable is `EXPO_PUBLIC_GROQ_API_KEY`
3. Restart Metro bundler: `npx expo start --clear`

### Error: "Invalid API key"

```
Error answering question with Groq: Invalid Groq API key
```

Solution:
1. Verify that the key starts with `gsk_`
2. Verify that you copied the complete key
3. Generate a new key at https://console.groq.com/keys

### Error: "Rate limit exceeded"

```
You have reached the Groq request limit. Try again later.
```

Solution:
1. Wait 1 minute (rate limit is per minute)
2. If it persists, wait until the next day (14,400/day)

### Error: "No visual context"

```
No visual context available. Say "describe" first.
```

Solution:
1. Say "Iris, describe" to capture an image
2. Then ask your question

### Error: "Context too old"

```
The visual context is too old (6 minutes). Say "describe" to capture a new image.
```

Solution:
1. Say "Iris, describe" to capture a new image
2. Ask your question within the next 5 minutes

## Advanced configuration

### Change Llama 4 model

By default uses `llama-4-scout` (faster). For more precision:

```typescript
// In the code that instantiates GroqVisionAdapter:
const adapter = new GroqVisionAdapter({
  apiKey: getGroqApiKey(),
  model: 'meta-llama/llama-4-maverick-17b-128e-instruct',  // More precise
  temperature: 0.3,
  maxTokens: 150,
});
```

### Change context expiration time

```typescript
// In AnswerQuestionUseCase:
const result = await answerQuestionUseCase.execute(question, {
  maxContextAge: 10 * 60 * 1000,  // 10 minutes instead of 5
});
```

### Use AsyncStorage instead of memory

If you want the context to persist when closing the app:

```typescript
// Create AsyncStorageContextRepository.ts (pending implementation)
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageContextRepository implements IContextRepository {
  async saveContext(context: VisualContext): Promise<void> {
    await AsyncStorage.setItem('visual_context', JSON.stringify(context));
  }
  
  async getLastContext(): Promise<VisualContext | null> {
    const json = await AsyncStorage.getItem('visual_context');
    return json ? JSON.parse(json) : null;
  }
  
  // ...
}
```

## Next steps

- [ ] Implement `handleQuestion()` in `ProcessCommandUseCase`
- [ ] Update help messages with question examples
- [ ] Write tests for `AnswerQuestionUseCase`
- [ ] Write tests for `GroqVisionAdapter`
- [ ] Implement `AsyncStorageContextRepository` (optional)
- [ ] Add analytics for usage tracking
- [ ] Document in AGENTS.md

## References

- Groq Documentation: https://console.groq.com/docs/vision
- Llama 4 Vision Models: https://console.groq.com/docs/models
- Groq Playground: https://console.groq.com/playground
- Rate Limits: https://console.groq.com/docs/rate-limits

## Summary

This feature transforms Iris from a simple scene descriptor to an interactive visual assistant that can answer specific questions about what it sees.

Key benefits:
- Ultra-fast (~200-400ms with Groq)
- Generous free tier (14,400 req/day)
- Accurate responses with Llama 4 Vision
- Supports OCR (read text in images)
- Temporal context (multiple questions about the same image)
