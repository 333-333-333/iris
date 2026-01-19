export interface SpeechSynthesizer {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}
