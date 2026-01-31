---
name: tsdoc-comments
description: >
  Write TSDoc-compliant code comments in English for TypeScript/JavaScript.
  Trigger: When adding documentation comments, documenting functions/classes, or improving code clarity.
license: Apache-2.0
metadata:
  author: 333-333-333
  version: "1.0"
  type: generic
  scope: [root]
  auto_invoke:
    - "Adding code documentation"
    - "Documenting functions or classes"
    - "Writing TSDoc/JSDoc comments"
    - "Improving code comments"
---

## When to Use

- Documenting public APIs, functions, classes, or interfaces
- Adding JSDoc/TSDoc comments to existing code
- Creating type documentation for TypeScript projects
- Improving code readability with standardized comments

## Critical Patterns

### 1. Always Use English
All comments MUST be written in English, regardless of the project's primary language.

### 2. TSDoc Standard Tags
Use TSDoc-compliant tags for consistency:

| Tag | Purpose | Example |
|-----|---------|---------|
| `@param` | Document function parameters | `@param userId - The unique user identifier` |
| `@returns` | Document return values | `@returns The user object or null` |
| `@throws` | Document exceptions | `@throws {Error} When user not found` |
| `@remarks` | Additional details | `@remarks This is cached for 5 minutes` |
| `@example` | Usage examples | `@example` followed by code block |
| `@public` | Public API marker | `@public` |
| `@internal` | Internal implementation | `@internal` |
| `@deprecated` | Deprecation notice | `@deprecated Use getUserById instead` |

### 3. Comment Structure
```typescript
/**
 * Brief one-line summary (required)
 * 
 * Detailed description if needed (optional)
 * Can span multiple lines.
 * 
 * @param paramName - Parameter description
 * @returns Return value description
 * @throws {ErrorType} When this error occurs
 * 
 * @example
 * ```typescript
 * const result = functionName(param);
 * ```
 */
```

### 4. Describe "Why", Not "What"
```typescript
// ❌ BAD - Describes what the code does (obvious)
/** Increments the counter by 1 */
counter++;

// ✅ GOOD - Explains why
/** Track retry attempts to prevent infinite loops */
counter++;
```

### 5. Parameter Descriptions
- Always use hyphen format: `@param name - Description`
- Include type information when helpful
- Describe constraints or valid ranges

```typescript
/**
 * @param age - User's age in years (must be 0-150)
 * @param email - Valid email address following RFC 5322
 */
```

## Code Examples

### Function Documentation
```typescript
/**
 * Fetches user data from the API with automatic retry logic
 * 
 * @param userId - Unique identifier for the user
 * @param options - Optional configuration for the request
 * @returns Promise resolving to user data or null if not found
 * @throws {NetworkError} When connection fails after retries
 * @throws {ValidationError} When userId format is invalid
 * 
 * @example
 * ```typescript
 * const user = await fetchUser('user-123', { timeout: 5000 });
 * if (user) {
 *   console.log(user.name);
 * }
 * ```
 */
async function fetchUser(userId: string, options?: RequestOptions): Promise<User | null> {
  // Implementation
}
```

### Class Documentation
```typescript
/**
 * Manages voice recognition state and audio processing
 * 
 * @remarks
 * This class handles the complete lifecycle of voice interactions,
 * including wake word detection, speech recognition, and audio feedback.
 * All processing happens on-device for privacy.
 * 
 * @public
 */
class VoiceHandler {
  /**
   * Initializes the voice recognition engine
   * 
   * @param config - Voice handler configuration
   * @throws {AudioError} When microphone access is denied
   */
  constructor(config: VoiceConfig) {
    // Implementation
  }
}
```

### Interface Documentation
```typescript
/**
 * Configuration options for the vision model
 * 
 * @public
 */
interface VisionConfig {
  /**
   * Minimum confidence threshold for object detection (0.0-1.0)
   * @defaultValue 0.6
   */
  confidenceThreshold: number;

  /**
   * Maximum number of objects to detect per frame
   * @defaultValue 10
   */
  maxDetections: number;
}
```

### Deprecated Code
```typescript
/**
 * Processes image using legacy algorithm
 * 
 * @deprecated Since version 2.0. Use {@link processImageV2} instead.
 * This method will be removed in version 3.0.
 * 
 * @param image - Image buffer to process
 */
function processImage(image: Buffer): Result {
  // Implementation
}
```

## Commands

```bash
# Validate TSDoc comments (if using eslint-plugin-tsdoc)
npx eslint --ext .ts,.tsx .

# Generate documentation from TSDoc comments
npx typedoc --out docs src/

# Check for missing documentation
npx tsc --noEmit --strict
```

## Style Guidelines

### DO
- Write in present tense: "Returns the user" not "Will return the user"
- Be concise but complete
- Use proper punctuation and grammar
- Include units in parameter descriptions: "timeout in milliseconds"
- Document edge cases and constraints
- Add `@example` for complex functions

### DON'T
- Repeat the function/parameter name: `@param user - The user` ❌
- Use abbreviations: "auth" → "authentication" ✅
- Write vague descriptions: "Handles the thing" ❌
- Mix languages: All English only
- Document obvious parameters unless there are constraints

## Resources

- **Templates**: See [assets/](assets/) for comment templates
- **TSDoc Specification**: https://tsdoc.org/
- **ESLint Plugin**: eslint-plugin-tsdoc for validation
