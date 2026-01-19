interface VoiceCommandProps {
  text: string;
  confidence: number;
  timestamp: number;
}

const DEFAULT_WAKE_WORD = 'iris';
const CONFIDENCE_THRESHOLD = 0.7;

export class VoiceCommand {
  readonly text: string;
  readonly confidence: number;
  readonly timestamp: number;

  constructor({ text, confidence, timestamp }: VoiceCommandProps) {
    this.text = text;
    this.confidence = confidence;
    this.timestamp = timestamp;
  }

  isValid(): boolean {
    return this.confidence >= CONFIDENCE_THRESHOLD;
  }

  containsWakeWord(wakeWord: string = DEFAULT_WAKE_WORD): boolean {
    return this.text.toLowerCase().includes(wakeWord.toLowerCase());
  }

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
