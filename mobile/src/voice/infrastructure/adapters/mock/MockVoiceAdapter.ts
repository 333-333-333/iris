/**
 * MockVoiceAdapter - Mock implementation for testing without real voice recognition
 * 
 * This adapter simulates voice recognition for development/testing purposes.
 * Use this when you don't have access to a real device or want to test the flow
 * without actual speech recognition.
 */
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognizerOptions {
  language?: string;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onPartialResult?: (result: SpeechRecognitionResult) => void;
}

export class MockVoiceAdapter {
  private isInitialized = false;
  private isRecording = false;
  private options: SpeechRecognizerOptions;
  private mockTimeout: NodeJS.Timeout | null = null;

  constructor(options: SpeechRecognizerOptions = {}) {
    this.options = {
      language: 'es-ES',
      ...options,
    };
  }

  async initialize(): Promise<void> {
    console.log('[MockVoiceAdapter] Initializing mock voice recognition...');
    this.isInitialized = true;
    console.log('[MockVoiceAdapter] Mock voice recognition initialized');
  }

  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Mock voice not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('[MockVoiceAdapter] Already recording');
      return;
    }

    console.log('[MockVoiceAdapter] Starting mock voice recognition...');
    this.isRecording = true;
    this.options.onStart?.();

    // Simulate voice detection after 2 seconds
    this.mockTimeout = setTimeout(() => {
      // Simulate saying "iris describe"
      const mockTranscript = 'iris describe';
      
      console.log('[MockVoiceAdapter] Mock transcript:', mockTranscript);
      
      this.options.onResult?.({
        transcript: mockTranscript,
        confidence: 0.95,
        isFinal: true,
      });

      this.isRecording = false;
      this.options.onEnd?.();
    }, 2000);
  }

  async stopListening(): Promise<void> {
    if (!this.isRecording) {
      console.warn('[MockVoiceAdapter] Not currently recording');
      return;
    }

    console.log('[MockVoiceAdapter] Stopping mock voice recognition...');

    if (this.mockTimeout) {
      clearTimeout(this.mockTimeout);
      this.mockTimeout = null;
    }

    this.isRecording = false;
    this.options.onEnd?.();
  }

  async cancel(): Promise<void> {
    console.log('[MockVoiceAdapter] Cancelling mock voice recognition...');
    await this.stopListening();
  }

  isListening(): boolean {
    return this.isRecording;
  }

  async getAvailableServices(): Promise<string[]> {
    return ['mock-service'];
  }

  async destroy(): Promise<void> {
    if (this.mockTimeout) {
      clearTimeout(this.mockTimeout);
      this.mockTimeout = null;
    }
    this.isInitialized = false;
    console.log('[MockVoiceAdapter] Mock resources cleaned up');
  }

  setOptions(options: Partial<SpeechRecognizerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
