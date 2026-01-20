# Visual Q&A feature - Test checklist

## Before testing

### 1. Verify configuration

```bash
cd /Users/david/Desktop/projects/iris/mobile

# Check Groq API key is configured
cat .env | grep GROQ_API_KEY
# Should show: EXPO_PUBLIC_GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
```

### 2. Verify installation

```bash
# Check groq-sdk is installed
npm list groq-sdk
# Should show: groq-sdk@0.x.x
```

### 3. Verify intent detection works

```bash
# Run test script
node test-question-intent.js
# Should show: ✓ All tests passed!
```

## Start the app

```bash
# Option 1: Clear cache and start fresh (RECOMMENDED)
npx expo start --clear

# Option 2: Just start
npx expo start
```

## Test sequence

### Test 1: Help message

1. Start app on phone
2. Say: "Iris, ayuda"
3. Listen to response

EXPECTED:
```
Puedes decir:
describe, para ver lo que hay frente a ti.
repite, para escuchar la última descripción.
pregúntame sobre color, talla, precio o marca después de describir.  ← NEW LINE
ayuda, para escuchar estos comandos.
adiós, para cerrar.
```

IF NOT WORKING:
- Restart Metro bundler: `npx expo start --clear`
- Check logs for: `[ProcessCommandUseCase] Help`
- Verify ProcessCommand.ts has updated HELP_MESSAGE

### Test 2: Describe + save context

1. Point camera at an object
2. Say: "Iris, describe"
3. Check logs

EXPECTED LOGS:
```
[AnalyzeSceneUseCase] Starting scene analysis...
[TFLiteVisionAdapter] Detected N objects
[AnalyzeSceneUseCase] Saving visual context for Q&A...
[InMemoryContextRepository] Saving context
[AnalyzeSceneUseCase] ✓ Context saved
```

EXPECTED SPEECH:
"Veo [description of objects]"

### Test 3: Question about color

1. After describe, say: "Iris, qué color tiene?"
2. Check logs

EXPECTED LOGS:
```
[CommandIntent] Matched pattern: "qué color"
[CommandIntent] Intent type: QUESTION
[ProcessCommandUseCase] Answering question: qué color tiene
[AnswerQuestionUseCase] Processing question
[AnswerQuestionUseCase] Using context: { imageUri: ..., objects: N }
[GroqVisionAdapter] Answering question: qué color tiene
[GroqVisionAdapter] ✓ Groq responded in XXXms
[GroqVisionAdapter] Answer generated: [answer]
```

EXPECTED SPEECH:
"[Color description]"

### Test 4: Question about size

1. After describe, say: "Iris, qué talla es?" or "Iris, qué tamaño tiene?"
2. Check logs for same pattern as Test 3

EXPECTED SPEECH:
"[Size information]"

### Test 5: Error - no context

1. Close and reopen app (to clear context)
2. Say: "Iris, qué color tiene?" WITHOUT saying describe first
3. Check logs

EXPECTED LOGS:
```
[AnswerQuestionUseCase] No hay contexto visual disponible
```

EXPECTED SPEECH:
"No hay contexto visual disponible. Di describe primero para capturar una imagen."

## Troubleshooting

### Problem: Help message does not mention questions

Solution:
```bash
# 1. Verify the code has the updated message
cat src/voice/application/use-cases/ProcessCommand.ts | grep -A 6 "HELP_MESSAGE"

# 2. Restart Metro with clear cache
npx expo start --clear

# 3. Hard reload in app:
# - Shake device
# - Tap "Reload"
```

### Problem: Question intent not detected

Solution:
```bash
# 1. Test patterns
node test-question-intent.js

# 2. Check logs when saying question
# Look for: [CommandIntent] Intent type: QUESTION

# 3. If shows UNKNOWN, check CommandIntent.ts has QUESTION patterns
```

### Problem: Groq not responding

Solution:
```bash
# 1. Check API key
cat .env | grep GROQ

# 2. Check internet connection
ping -c 1 google.com

# 3. Check logs for initialization
# Look for: [GroqVisionAdapter] ✓ Groq initialized successfully

# 4. Check for errors
# Look for: [GroqVisionAdapter] Failed to initialize
```

### Problem: Context not saved

Solution:
```bash
# 1. Check logs after describe
# Look for: [InMemoryContextRepository] Saving context

# 2. If missing, check useVisionService.ts creates repository
grep -A 5 "InMemoryContextRepository" src/vision/presentation/hooks/useVisionService.ts

# 3. Restart app completely
```

## Success criteria

Mark each as complete:

- [ ] Help message includes "pregúntame sobre color, talla, precio o marca"
- [ ] "describe" command saves context (check logs)
- [ ] "qué color tiene?" works after describe
- [ ] "qué talla es?" works after describe
- [ ] "cuánto cuesta?" works after describe
- [ ] Question without describe shows error
- [ ] Groq responds in < 500ms
- [ ] No console errors
- [ ] No TypeScript errors

## If all tests pass

Congratulations! The Visual Q&A feature is working correctly.

Next steps:
1. Test with real products (clothing, food packages)
2. Test OCR capability (reading labels, prices, sizes)
3. Test multiple questions on same image
4. Test context expiration (wait 6 minutes)
5. Monitor Groq API usage at https://console.groq.com/usage

## If tests fail

Check logs carefully and follow troubleshooting steps above.

Common issues:
1. Metro bundler cache - Solution: `npx expo start --clear`
2. Old app version - Solution: Force reload in Expo Go
3. Missing API key - Solution: Check .env file
4. Internet connectivity - Solution: Check WiFi
5. Groq rate limit - Solution: Wait 1 minute

## Logs location

Metro bundler console shows all logs in real-time.

Look for these prefixes:
- `[GroqVisionAdapter]` - Groq interactions
- `[AnswerQuestionUseCase]` - Q&A logic
- `[InMemoryContextRepository]` - Context storage
- `[ProcessCommandUseCase]` - Command processing
- `[CommandIntent]` - Intent detection
