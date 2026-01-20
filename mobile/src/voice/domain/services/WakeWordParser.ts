import { VoiceCommand } from '../entities/VoiceCommand';
import { CommandIntent, IntentType } from '../value-objects/CommandIntent';

/**
 * Result of parsing a voice transcript into a command and intent
 * 
 * @public
 */
export interface ParsedCommand {
  /** The voice command entity with transcript and confidence */
  command: VoiceCommand;
  /** The detected command intent and type */
  intent: CommandIntent;
  /** Extracted command text after wake word removal */
  commandText: string;
}

const DEFAULT_WAKE_WORD = 'iris';
const CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_INTENT_CONFIDENCE = 0.6;

/**
 * Parses voice transcripts into structured commands and intents
 * 
 * Detects wake words in transcripts, validates confidence levels,
 * extracts command text, and maps to specific intent types
 * (describe, repeat, help, stop, goodbye).
 * 
 * @remarks
 * Uses configurable wake word (default: "iris") and confidence thresholds.
 * Applies text normalization and handles edge cases like missing commands.
 * 
 * @public
 */
export class WakeWordParser {
  private readonly wakeWord: string;

  /**
   * Creates an instance of WakeWordParser
   * 
   * @param wakeWord - The wake word to detect (default: "iris")
   */
  constructor(wakeWord: string = DEFAULT_WAKE_WORD) {
    this.wakeWord = wakeWord.toLowerCase();
  }

  /**
   * Parses a voice transcript into a command with detected intent
   * 
   * Validates confidence level, detects wake word, extracts command text,
   * and determines intent type. Returns null if confidence is too low
   * or wake word is not detected.
   * 
   * @param text - The voice transcript to parse
   * @param confidence - Speech recognition confidence (0.0-1.0)
   * @returns Parsed command with intent or null if validation fails
   * 
   * @remarks
   * Returns null if:
   * - Text is empty or whitespace-only
   * - Confidence is below threshold (0.7)
   * - Wake word is not detected in text
   * 
   * Defaults to DESCRIBE intent when command text is empty.
   * 
   * @example
   * ```typescript
   * const parser = new WakeWordParser('iris');
   * const result = parser.parse('iris describe', 0.85);
   * if (result) {
   *   console.log('Intent:', result.intent.type);
   *   console.log('Command:', result.commandText); // "describe"
   * }
   * ```
   */
  parse(text: string, confidence: number): ParsedCommand | null {
    // Validate inputs
    if (!text || text.trim().length === 0) {
      return null;
    }

    if (confidence < CONFIDENCE_THRESHOLD) {
      return null;
    }

    // Check for wake word
    const lowerText = text.toLowerCase();
    if (!lowerText.includes(this.wakeWord)) {
      return null;
    }

    // Create VoiceCommand entity
    const command = new VoiceCommand({
      text,
      confidence,
      timestamp: Date.now(),
    });

    // Extract text after wake word
    const commandText = this.extractCommandText(text);

    // Parse intent from command text
    const intent = CommandIntent.fromText(commandText);

    // If no valid command after wake word, return null (keep listening)
    // User needs to say "Iris describe", not just "Iris"
    if (intent.type === IntentType.UNKNOWN) {
      console.log('[WakeWordParser] Wake word detected but no valid command:', commandText);
      return null;
    }

    return {
      command,
      intent,
      commandText,
    };
  }

  /**
   * Extracts command text after the wake word
   * 
   * Removes wake word, normalizes whitespace, and handles punctuation.
   * 
   * @param text - The full transcript including wake word
   * @returns Normalized command text or empty string if wake word not found
   * @internal
   */
  private extractCommandText(text: string): string {
    const lowerText = text.toLowerCase();
    const wakeWordIndex = lowerText.indexOf(this.wakeWord);

    if (wakeWordIndex === -1) {
      return '';
    }

    // Get text after wake word
    let afterWakeWord = text.slice(wakeWordIndex + this.wakeWord.length);

    // Remove leading punctuation and whitespace
    afterWakeWord = afterWakeWord.replace(/^[,\s]+/, '');

    // Normalize multiple spaces
    afterWakeWord = afterWakeWord.replace(/\s+/g, ' ').trim();

    return afterWakeWord;
  }

}
