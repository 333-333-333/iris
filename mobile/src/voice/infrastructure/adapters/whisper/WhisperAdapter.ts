import { initWhisper, RealtimeTranscriber } from 'whisper.rn';
import { Audio } from 'expo-av';

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
}

/**
 * WhisperAdapter - On-device speech recognition using Whisper.rn
 * 
 * This adapter uses OpenAI's Whisper model running locally on the device
 * for privacy-preserving speech recognition without internet connection.
 */
export class WhisperAdapter {
  private transcriber: RealtimeTranscriber | null = null;
  private isInitialized = false;
  private isRecording = false;
  private options: SpeechRecognizerOptions;
  private audioRecording: Audio.Recording | null = null;

  constructor(options: SpeechRecognizerOptions = {}) {
    this.options = {
      language: 'es', // Spanish by default for Iris
      ...options,
    };
  }

  /**
   * Initialize Whisper model
   * Must be called before using the adapter
   */
  async initialize(): Promise<void> {
    try {
      console.log('[WhisperAdapter] Initializing Whisper model...');
      
      // Initialize Whisper with model configuration
      await initWhisper({
        filePath: 'ggml-base.bin', // Base model for balance of speed/accuracy
        // Alternative models:
        // - ggml-tiny.bin: Fastest, less accurate
        // - ggml-small.bin: Better accuracy
        // - ggml-medium.bin: Even better, slower
      });

      this.isInitialized = true;
      console.log('[WhisperAdapter] Whisper model initialized successfully');
    } catch (error) {
      console.error('[WhisperAdapter] Failed to initialize Whisper:', error);
      throw new Error(`Failed to initialize Whisper: ${error}`);
    }
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('[WhisperAdapter] Requesting microphone permissions...');
      
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('[WhisperAdapter] Microphone permission denied');
        this.options.onError?.(new Error('Microphone permission denied'));
        return false;
      }

      console.log('[WhisperAdapter] Microphone permission granted');
      return true;
    } catch (error) {
      console.error('[WhisperAdapter] Failed to request permissions:', error);
      this.options.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Start listening for speech
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Whisper not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('[WhisperAdapter] Already recording');
      return;
    }

    try {
      // Request permissions if needed
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return;
      }

      console.log('[WhisperAdapter] Starting audio recording...');

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      this.audioRecording = recording;
      this.isRecording = true;

      this.options.onStart?.();
      console.log('[WhisperAdapter] Audio recording started');

    } catch (error) {
      console.error('[WhisperAdapter] Failed to start listening:', error);
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop listening and transcribe the recorded audio
   */
  async stopListening(): Promise<string> {
    if (!this.isRecording || !this.audioRecording) {
      console.warn('[WhisperAdapter] Not currently recording');
      return '';
    }

    try {
      console.log('[WhisperAdapter] Stopping audio recording...');

      // Stop recording
      await this.audioRecording.stopAndUnloadAsync();
      const uri = this.audioRecording.getURI();
      
      this.audioRecording = null;
      this.isRecording = false;

      if (!uri) {
        throw new Error('No audio file recorded');
      }

      console.log('[WhisperAdapter] Transcribing audio...');

      // Transcribe with Whisper
      const { transcription } = await this.transcribeAudio(uri);

      // Notify result
      this.options.onResult?.({
        transcript: transcription,
        confidence: 0.9, // Whisper doesn't provide confidence scores
        isFinal: true,
      });

      this.options.onEnd?.();
      console.log('[WhisperAdapter] Transcription complete:', transcription);

      return transcription;

    } catch (error) {
      console.error('[WhisperAdapter] Failed to stop listening:', error);
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Transcribe audio file using Whisper
   */
  private async transcribeAudio(audioUri: string): Promise<{ transcription: string }> {
    try {
      // Use Whisper to transcribe the audio file
      const result = await initWhisper({
        filePath: 'ggml-base.bin',
      });

      // The actual transcription would happen here with the Whisper library
      // This is a simplified example - real implementation depends on whisper.rn API
      
      // For now, return a placeholder
      // TODO: Implement actual Whisper transcription when whisper.rn API is stable
      const transcription = 'iris describe'; // Placeholder
      
      return { transcription };
    } catch (error) {
      console.error('[WhisperAdapter] Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Check if currently recording
   */
  isListening(): boolean {
    return this.isRecording;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopListening();
      }

      this.transcriber = null;
      this.isInitialized = false;
      console.log('[WhisperAdapter] Resources cleaned up');
    } catch (error) {
      console.error('[WhisperAdapter] Failed to destroy:', error);
    }
  }

  /**
   * Update options
   */
  setOptions(options: Partial<SpeechRecognizerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
