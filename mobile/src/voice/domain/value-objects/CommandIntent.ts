/**
 * Enumeration of supported command intents in the voice system
 * 
 * @remarks
 * Each intent represents a distinct user action or request type.
 * UNKNOWN is used for unrecognized or ambiguous commands.
 * 
 * @public
 */
export enum IntentType {
  /** User wants scene description */
  DESCRIBE = 'DESCRIBE',
  /** User wants to replay last description */
  REPEAT = 'REPEAT',
  /** User wants help with available commands */
  HELP = 'HELP',
  /** User wants to stop current speech output */
  STOP = 'STOP',
  /** User wants to exit the application */
  GOODBYE = 'GOODBYE',
  /** Command was not recognized */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Pattern matching configuration for detecting command intents
 * 
 * @internal
 */
interface IntentPattern {
  /** The intent type this pattern represents */
  type: IntentType;
  /** Regular expressions to match against command text (Spanish and English) */
  patterns: RegExp[];
  /** Base confidence score for this pattern type (0.0-1.0) */
  baseConfidence: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: IntentType.DESCRIBE,
    patterns: [
      /\bdescrib[ea]?\b/i,
      /\bqu[eé]\s+(hay|ves|tienes?)\b/i,
      /\bwhat('s|.is)?\s+(in\s+front|around|there)\b/i,
    ],
    baseConfidence: 0.9,
  },
  {
    type: IntentType.REPEAT,
    patterns: [
      /\brepite\b/i,
      /\brepetir\b/i,
      /\brepeat\b/i,
      /\botra\s+vez\b/i,
      /\bde\s+nuevo\b/i,
    ],
    baseConfidence: 0.95,
  },
  {
    type: IntentType.HELP,
    patterns: [
      /\bayuda\b/i,
      /\bhelp\b/i,
      /\bqu[eé]\s+puedes\s+hacer\b/i,
      /\bcomandos\b/i,
    ],
    baseConfidence: 0.95,
  },
  {
    type: IntentType.STOP,
    patterns: [
      /\bdetente\b/i,
      /\bpara\b/i,
      /\bstop\b/i,
      /\bsilencio\b/i,
      /\bc[aá]llate\b/i,
    ],
    baseConfidence: 0.95,
  },
  {
    type: IntentType.GOODBYE,
    patterns: [
      /\badi[oó]s\b/i,
      /\bchao\b/i,
      /\bhasta\s+luego\b/i,
      /\bgoodbye\b/i,
      /\bbye\b/i,
    ],
    baseConfidence: 0.95,
  },
];

/**
 * Domain value object representing a parsed command intent
 * 
 * Encapsulates the detected command type with confidence score and pattern matching info.
 * Immutable value object following Domain-Driven Design principles.
 * 
 * @remarks
 * Supports multilingual patterns in Spanish and English.
 * Confidence scores are dynamically adjusted based on text length and match quality.
 * 
 * @public
 */
export class CommandIntent {
  /** The detected command intent type */
  readonly type: IntentType;
  /** Confidence score for this intent (0.0-1.0) */
  readonly confidence: number;
  /** The regex pattern that matched this intent or null if unrecognized */
  readonly matchedPattern: string | null;

  /**
   * Creates an instance of CommandIntent
   * 
   * @param type - The intent type
   * @param confidence - Confidence score (0.0-1.0)
   * @param matchedPattern - The pattern text that was matched
   * @internal
   */
  private constructor(
    type: IntentType,
    confidence: number,
    matchedPattern: string | null = null
  ) {
    this.type = type;
    this.confidence = confidence;
    this.matchedPattern = matchedPattern;
  }

  /**
   * Factory method to create a CommandIntent
   * 
   * @param type - The intent type to create
   * @param confidence - Confidence score (0.0-1.0)
   * @param matchedPattern - Optional pattern that was matched
   * @returns A new CommandIntent instance
   * 
   * @example
   * ```typescript
   * const intent = CommandIntent.create(IntentType.DESCRIBE, 0.9, 'describe');
   * ```
   */
  static create(
    type: IntentType,
    confidence: number,
    matchedPattern: string | null = null
  ): CommandIntent {
    return new CommandIntent(type, confidence, matchedPattern);
  }

  /**
   * Parses command text to detect intent type
   * 
   * Matches text against predefined patterns for each intent type.
   * Supports both Spanish and English command phrases.
   * Adjusts confidence based on match quality and text length.
   * 
   * @param text - The command text to parse
   * @returns CommandIntent with detected type or UNKNOWN if no match
   * 
   * @remarks
   * Confidence adjustment formula: base + (matchLength / textLength * 0.1), capped at 1.0
   * Empty text returns UNKNOWN intent with 0 confidence.
   * 
   * @example
   * ```typescript
   * const intent = CommandIntent.fromText('describe');
   * // Returns DESCRIBE intent with 0.9+ confidence
   * 
   * const intent2 = CommandIntent.fromText('qué hay');
   * // Returns DESCRIBE intent (Spanish equivalent)
   * ```
   */
  static fromText(text: string): CommandIntent {
    if (!text || text.trim().length === 0) {
      return new CommandIntent(IntentType.UNKNOWN, 0, null);
    }

    const normalizedText = text.toLowerCase().trim();

    for (const { type, patterns, baseConfidence } of INTENT_PATTERNS) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          // Adjust confidence based on match position and text length
          const matchRatio = match[0].length / normalizedText.length;
          const confidence = Math.min(baseConfidence + matchRatio * 0.1, 1.0);
          
          return new CommandIntent(type, confidence, match[0]);
        }
      }
    }

    return new CommandIntent(IntentType.UNKNOWN, 0, null);
  }

  /**
   * Checks if this intent represents an actionable command
   * 
   * Returns false only for UNKNOWN intents.
   * 
   * @returns True if intent can be processed as a valid command
   * 
   * @example
   * ```typescript
   * if (intent.isActionable()) {
   *   await processIntent(intent);
   * }
   * ```
   */
  isActionable(): boolean {
    return this.type !== IntentType.UNKNOWN;
  }
}
