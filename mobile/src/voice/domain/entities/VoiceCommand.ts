/**
 * Properties for creating a VoiceCommand entity
 * 
 * @internal
 */
interface VoiceCommandProps {
  /** The raw voice transcript text */
  text: string;
  /** Speech recognition confidence score (0.0-1.0) */
  confidence: number;
  /** Timestamp when command was recorded (milliseconds since epoch) */
  timestamp: number;
}

const DEFAULT_WAKE_WORD = 'iris';
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Domain entity representing a voice command
 * 
 * Encapsulates the raw voice transcript with associated metadata
 * and provides methods for validation and wake word detection.
 * Immutable value object following Domain-Driven Design principles.
 * 
 * @remarks
 * Commands are validated based on a confidence threshold (default: 0.7).
 * Includes utility methods for wake word detection and text extraction.
 * 
 * @public
 */
export class VoiceCommand {
  /** The raw voice transcript text */
  readonly text: string;
  /** Speech recognition confidence score (0.0-1.0) */
  readonly confidence: number;
  /** Timestamp when command was recorded (milliseconds since epoch) */
  readonly timestamp: number;

  /**
   * Creates an instance of VoiceCommand
   * 
   * @param props - Command properties including text, confidence, and timestamp
   */
  constructor({ text, confidence, timestamp }: VoiceCommandProps) {
    this.text = text;
    this.confidence = confidence;
    this.timestamp = timestamp;
  }

  /**
   * Checks if the command meets the confidence threshold
   * 
   * Validates that speech recognition confidence is above the minimum threshold
   * to ensure reliable command processing.
   * 
   * @returns True if confidence is at or above threshold (0.7)
   * 
   * @example
   * ```typescript
   * if (command.isValid()) {
   *   await processCommand(command);
   * }
   * ```
   */
  isValid(): boolean {
    return this.confidence >= CONFIDENCE_THRESHOLD;
  }

  /**
   * Checks if the command text contains a wake word
   * 
   * Case-insensitive comparison for flexible wake word detection.
   * 
   * @param wakeWord - The wake word to check for (default: "iris")
   * @returns True if wake word is found in command text
   * 
   * @example
   * ```typescript
   * if (command.containsWakeWord('iris')) {
   *   // Wake word detected
   * }
   * ```
   */
  containsWakeWord(wakeWord: string = DEFAULT_WAKE_WORD): boolean {
    return this.text.toLowerCase().includes(wakeWord.toLowerCase());
  }

  /**
   * Extracts command text after the wake word
   * 
   * Returns text that appears after the wake word, useful for
   * determining the actual command intent from the full transcript.
   * 
   * @param wakeWord - The wake word to remove (default: "iris")
   * @returns Trimmed text after wake word or empty string if not found
   * 
   * @example
   * ```typescript
   * const text = command.getTextAfterWakeWord('iris');
   * // If command.text = "iris describe", returns "describe"
   * ```
   */
  getTextAfterWakeWord(wakeWord: string = DEFAULT_WAKE_WORD): string {
    const lowerText = this.text.toLowerCase();
    const lowerWakeWord = wakeWord.toLowerCase();
    const index = lowerText.indexOf(lowerWakeWord);

    if (index === -1) {
      return '';
    }

    return this.text.slice(index + wakeWord.length).trim();
  }
}
