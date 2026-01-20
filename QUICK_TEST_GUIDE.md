# Quick test guide - Visual Q&A feature

## Prerequisites

1. Groq API key configured in `.env`:
```bash
cat mobile/.env | grep GROQ
# Should show: EXPO_PUBLIC_GROQ_API_KEY=gsk_...
```

2. Dependencies installed:
```bash
cd mobile
npm list groq-sdk
# Should show: groq-sdk@0.x.x
```

## How to test

### Step 1: Start the app

```bash
cd mobile
npx expo start
```

Then scan the QR code with Expo Go app on your phone.

### Step 2: Test help message

Say: "Iris, ayuda" or "Iris, help"

Expected response:
```
Puedes decir:
describe, para ver lo que hay frente a ti.
repite, para escuchar la última descripción.
pregúntame sobre color, talla, precio o marca después de describir.
ayuda, para escuchar estos comandos.
adiós, para cerrar.
```

### Step 3: Test describe command

Say: "Iris, describe"

Expected:
- App captures photo
- Analyzes with TFLite (local)
- Saves context to memory
- Speaks description: "Veo [objects in scene]"

### Step 4: Test question commands

After describing, try these questions:

#### Color
Say: "Iris, qué color tiene?"
Expected: Groq analyzes and responds with color

#### Size
Say: "Iris, qué talla es?"
Expected: Groq reads size from label/tag

#### Price
Say: "Iris, cuánto cuesta?"
Expected: Groq reads price from label

#### Brand
Say: "Iris, qué marca es?"
Expected: Groq identifies brand

### Step 5: Test error cases

#### No context
Say: "Iris, qué color tiene?" WITHOUT saying "describe" first

Expected error:
```
No hay contexto visual disponible. Di describe primero para capturar una imagen.
```

#### Stale context
1. Say: "Iris, describe"
2. Wait 6+ minutes
3. Say: "Iris, qué color tiene?"

Expected error:
```
El contexto visual es muy antiguo (X minutos). Di describe para capturar una nueva imagen.
```

## Verify in logs

### Success logs

```
[GroqVisionAdapter] Initializing Groq Llama 4 Vision...
[GroqVisionAdapter] ✓ Groq initialized successfully

[AnalyzeSceneUseCase] Saving visual context for Q&A...
[InMemoryContextRepository] Saving context: { imageUri: ..., objects: 3 }

[CommandIntent] Detected intent: QUESTION
[ProcessCommandUseCase] Answering question: qué color tiene
[AnswerQuestionUseCase] Using context: { imageUri: ..., age: 2341ms }
[GroqVisionAdapter] Answering question: qué color tiene
[GroqVisionAdapter] ✓ Question answered in 287ms
[GroqVisionAdapter] Answer generated: La camisa es roja
```

### Error logs to watch for

```
[GroqConfig] ✗ API key no encontrada!
→ Fix: Check .env file has EXPO_PUBLIC_GROQ_API_KEY

[AnswerQuestionUseCase] No hay contexto visual disponible
→ Expected: User needs to say "describe" first

[GroqVisionAdapter] Question answering failed: Rate limit exceeded
→ Wait 1 minute and try again
```

## Common issues

### Issue 1: Help message not mentioning questions

Check: Is ProcessCommandUseCase using the updated HELP_MESSAGE?

```bash
cd mobile
grep -A 5 "HELP_MESSAGE" src/voice/application/use-cases/ProcessCommand.ts
```

Should show:
```typescript
const HELP_MESSAGE = `
Puedes decir: 
describe, para ver lo que hay frente a ti.
repite, para escuchar la última descripción.
pregúntame sobre color, talla, precio o marca después de describir.
ayuda, para escuchar estos comandos.
adiós, para cerrar.
`.trim();
```

### Issue 2: Question not detected

Test intent detection:
```bash
cd mobile
node test-question-intent.js
```

All tests should pass.

### Issue 3: Groq not responding

Check:
1. Internet connection
2. API key is valid: `cat mobile/.env | grep GROQ`
3. Logs show: `[GroqVisionAdapter] ✓ Groq initialized successfully`

### Issue 4: Context not saved

Check logs for:
```
[AnalyzeSceneUseCase] Saving visual context for Q&A...
[InMemoryContextRepository] Saving context
```

If missing, verify:
1. `useVisionService` is creating `InMemoryContextRepository`
2. `VisionServiceBridge` receives the repository
3. `AnalyzeSceneUseCase` has the repository injected

## Expected performance

| Action | Time |
|--------|------|
| DESCRIBE (TFLite + save context) | ~500-800ms |
| QUESTION (Groq Llama 4 Vision) | ~200-400ms |
| Total (Describe + Question) | ~700-1200ms |

## Debugging commands

```bash
# Check if Groq is configured
cat mobile/.env | grep GROQ

# Check if groq-sdk is installed
cd mobile && npm list groq-sdk

# Test intent patterns
cd mobile && node test-question-intent.js

# Check TypeScript compilation
cd mobile && npx tsc --noEmit 2>&1 | grep -i "groq\|question\|context"

# Start with clear cache
cd mobile && npx expo start --clear
```

## Success criteria

- [ ] Help message mentions "pregúntame sobre color, talla, precio o marca"
- [ ] "Iris, describe" captures photo and saves context
- [ ] "Iris, qué color tiene?" after describe works
- [ ] "Iris, qué talla es?" after describe works
- [ ] "Iris, cuánto cuesta?" after describe works
- [ ] Questions without describe show error message
- [ ] Groq responds in ~200-400ms
- [ ] No TypeScript errors
- [ ] Logs show successful context save and retrieval

## Next steps after testing

Once all tests pass:
1. Test with real objects (shirts, products with labels)
2. Test OCR capability (reading text from images)
3. Test in different lighting conditions
4. Test rate limiting (30 req/min)
5. Monitor Groq API usage
