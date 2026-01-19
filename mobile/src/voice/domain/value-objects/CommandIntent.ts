export enum IntentType {
  DESCRIBE = 'DESCRIBE',
  REPEAT = 'REPEAT',
  HELP = 'HELP',
  STOP = 'STOP',
  GOODBYE = 'GOODBYE',
  UNKNOWN = 'UNKNOWN',
}

interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
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

export class CommandIntent {
  readonly type: IntentType;
  readonly confidence: number;
  readonly matchedPattern: string | null;

  private constructor(
    type: IntentType,
    confidence: number,
    matchedPattern: string | null = null
  ) {
    this.type = type;
    this.confidence = confidence;
    this.matchedPattern = matchedPattern;
  }

  static create(
    type: IntentType,
    confidence: number,
    matchedPattern: string | null = null
  ): CommandIntent {
    return new CommandIntent(type, confidence, matchedPattern);
  }

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

  isActionable(): boolean {
    return this.type !== IntentType.UNKNOWN;
  }
}
