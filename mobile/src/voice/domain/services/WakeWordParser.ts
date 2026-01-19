import { VoiceCommand } from '../entities/VoiceCommand';
import { CommandIntent, IntentType } from '../value-objects/CommandIntent';

export interface ParsedCommand {
  command: VoiceCommand;
  intent: CommandIntent;
  commandText: string;
}

const DEFAULT_WAKE_WORD = 'iris';
const CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_INTENT_CONFIDENCE = 0.6;

export class WakeWordParser {
  private readonly wakeWord: string;

  constructor(wakeWord: string = DEFAULT_WAKE_WORD) {
    this.wakeWord = wakeWord.toLowerCase();
  }

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
    let intent = CommandIntent.fromText(commandText);

    // Default to DESCRIBE if wake word detected but no specific command
    if (intent.type === IntentType.UNKNOWN) {
      intent = this.createDefaultIntent();
    }

    return {
      command,
      intent,
      commandText,
    };
  }

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

  private createDefaultIntent(): CommandIntent {
    // Create a DESCRIBE intent with lower confidence when no specific command detected
    return CommandIntent.create(
      IntentType.DESCRIBE,
      DEFAULT_INTENT_CONFIDENCE,
      'default'
    );
  }
}
