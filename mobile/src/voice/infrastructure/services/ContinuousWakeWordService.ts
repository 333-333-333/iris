import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import * as Haptics from 'expo-haptics';

/**
 * Wake word detection using continuous speech recognition
 * 
 * Implements always-on wake word detection using Expo's speech recognition
 * in continuous mode. Simpler alternative to Porcupine that works fully
 * within the Expo managed workflow.
 * 
 * @remarks
 * How it works:
 * 1. Continuously listens for speech using device speech engine
 * 2. Filters partial results for "iris" wake word
 * 3. Triggers full command recognition when wake word detected
 * 
 * Pros:
 * - ✅ No native modules needed (pure Expo)
 * - ✅ Works with Expo managed workflow
 * - ✅ Simple implementation
 * 
 * Cons:
 * - ⚠️ Requires internet (uses device's speech recognition)
 * - ⚠️ Higher battery usage (~5% per hour vs 1-3% with Porcupine)
 * - ⚠️ Audio sent to Google/Apple servers
 * - ⚠️ Subject to speech recognition rate limits
 * 
 * Singleton Pattern:
 * Use getInstance() to access the service.
 * 
 * @public
 */
export class ContinuousWakeWordService {
  private static instance: ContinuousWakeWordService | null = null;
  private isListening = false;
  private lastWakeWordTime = 0;
  private wakeWordCooldown = 2000; // 2 seconds between detections
  private onWakeWordCallback: ((transcript: string) => void) | null = null;

  private constructor() {}

  /**
   * Gets or creates the singleton instance
   * 
   * @returns The singleton ContinuousWakeWordService instance
   */
  static getInstance(): ContinuousWakeWordService {
    if (!ContinuousWakeWordService.instance) {
      ContinuousWakeWordService.instance = new ContinuousWakeWordService();
    }
    return ContinuousWakeWordService.instance;
  }

   /**
    * Starts continuous listening for wake word
    * 
    * Begins continuous speech recognition and monitors partial results
    * for the "iris" wake word. Includes debouncing to prevent duplicate detections.
    * 
    * @param onWakeWord - Callback invoked with transcript when wake word detected
    * @returns Promise that resolves when listening starts
    * @throws {Error} If speech recognition not available or permission denied
    * 
    * @remarks
    * Safe to call multiple times. Includes 2-second cooldown between wake word detections
    * to prevent rapid re-triggering.
    */
   async start(onWakeWord: (transcript: string) => void): Promise<void> {
    if (this.isListening) {
      console.warn('[ContinuousWakeWordService] Already listening');
      return;
    }

    try {
      console.log('[ContinuousWakeWordService] Starting continuous listening...');

      // Check if available
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        throw new Error('Speech recognition not available');
      }

      // Request permissions
      const { status, granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission denied');
      }

      this.onWakeWordCallback = onWakeWord;
      this.isListening = true;

      // Start continuous recognition
      await ExpoSpeechRecognitionModule.start({
        lang: 'es-ES',
        interimResults: true, // Get partial results in real-time
        maxAlternatives: 1,
        continuous: true, // Keep listening after each result
        recordingOptions: {
          persist: false,
        },
      });

      console.log('[ContinuousWakeWordService] Listening for "iris"...');
    } catch (error) {
      console.error('[ContinuousWakeWordService] Failed to start:', error);
      this.isListening = false;
      throw error;
    }
  }

   /**
    * Stops continuous listening for wake word
    * 
    * @returns Promise that resolves when listening stops
    * 
    * @remarks
    * Safe to call if not currently listening.
    */
   async stop(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      console.log('[ContinuousWakeWordService] Stopping...');
      
      await ExpoSpeechRecognitionModule.stop();
      this.isListening = false;
      this.onWakeWordCallback = null;

      console.log('[ContinuousWakeWordService] Stopped');
    } catch (error) {
      console.error('[ContinuousWakeWordService] Failed to stop:', error);
      throw error;
    }
  }

  /**
   * Process speech result to detect wake word
   * Call this from useSpeechRecognitionEvent('result', handleResult)
   */
  handleResult(event: any): void {
    if (!event.results || event.results.length === 0) {
      return;
    }

    const result = event.results[0];
    const transcript = (result.transcript || '').toLowerCase().trim();
    const isFinal = result.isFinal || false;

    // Check if transcript contains "iris"
    if (this.containsWakeWord(transcript)) {
      // Apply cooldown to avoid multiple triggers
      const now = Date.now();
      if (now - this.lastWakeWordTime < this.wakeWordCooldown) {
        return;
      }
      this.lastWakeWordTime = now;

      console.log('[ContinuousWakeWordService] Wake word detected in:', transcript);

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Trigger callback with full transcript
      if (this.onWakeWordCallback) {
        this.onWakeWordCallback(transcript);
      }
    }
  }

  /**
   * Check if transcript contains wake word
   */
  private containsWakeWord(transcript: string): boolean {
    // Normalize text
    const normalized = transcript
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents

    // Check for "iris" variations
    const wakeWords = [
      'iris',
      'iri',
      'hiri',
      'hiris',
      'ayris',
    ];

    return wakeWords.some(word => normalized.includes(word));
  }

  /**
   * Handle error from speech recognition
   */
  handleError(event: any): void {
    const errorCode = event.error;
    console.error('[ContinuousWakeWordService] Error:', errorCode);
    
    // Don't restart for these errors:
    // - 'no-speech': Normal when no one is speaking (will auto-restart via handleEnd)
    // - 'no-match': Normal when speech doesn't match expectations
    // - 'not-allowed': Permission denied
    // - 'service-not-allowed': Service blocked
    const shouldNotRestart = [
      'no-speech',
      'no-match',
      'not-allowed',
      'service-not-allowed'
    ];
    
    if (shouldNotRestart.includes(errorCode)) {
      console.log('[ContinuousWakeWordService] Error is recoverable, waiting for end event');
      return;
    }
    
    // For other errors, try to restart after a delay
    setTimeout(() => {
      if (this.isListening && this.onWakeWordCallback) {
        console.log('[ContinuousWakeWordService] Restarting after error...');
        this.start(this.onWakeWordCallback);
      }
    }, 1000);
  }

  /**
   * Handle end of recognition (restart if needed)
   */
  handleEnd(): void {
    console.log('[ContinuousWakeWordService] Recognition ended');
    
    // Mark as not listening so we can restart
    const wasListening = this.isListening;
    const callback = this.onWakeWordCallback;
    
    this.isListening = false;
    
    // Restart if we're supposed to be listening
    if (wasListening && callback) {
      setTimeout(() => {
        console.log('[ContinuousWakeWordService] Restarting continuous listening...');
        this.start(callback);
      }, 500);
    }
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Get wake word being listened for
   */
  getWakeWord(): string {
    return 'iris';
  }
}
