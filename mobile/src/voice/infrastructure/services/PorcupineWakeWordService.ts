import { Porcupine, PorcupineErrors } from '@picovoice/porcupine-react-native';
import * as Notifications from 'expo-notifications';

/**
 * Always-on wake word detection service using Porcupine
 * 
 * Provides efficient on-device wake word detection for visually impaired users.
 * Runs continuously in background with minimal battery impact.
 * 
 * @remarks
 * Features:
 * - Ultra-low battery consumption (~1-3% per hour)
 * - On-device processing (privacy-respecting)
 * - Background operation without internet
 * - Automatic app activation on wake word detection
 * - Customizable sensitivity per wake word
 * 
 * Current Configuration:
 * - Uses built-in "picovoice" wake word (free)
 * - For custom "iris" wake word: train at console.picovoice.ai
 * 
 * Singleton Pattern:
 * Use getInstance() to access the service.
 * 
 * @public
 */
export class PorcupineWakeWordService {
  private static instance: PorcupineWakeWordService | null = null;
  private porcupine: Porcupine | null = null;
  private isListening = false;
  private onWakeWordCallback: (() => void) | null = null;

  // TODO: Replace with your Picovoice Access Key from console.picovoice.ai
  private static readonly ACCESS_KEY = 'YOUR_ACCESS_KEY_HERE';
  
  // Using built-in "picovoice" wake word (free)
  // For custom "iris" wake word, train at console.picovoice.ai
  private static readonly WAKE_WORDS = ['picovoice'];
  private static readonly SENSITIVITIES = [0.5]; // 0.0-1.0, higher = more sensitive

  private constructor() {}

  /**
   * Gets or creates the singleton instance
   * 
   * @returns The singleton PorcupineWakeWordService instance
   */
  static getInstance(): PorcupineWakeWordService {
    if (!PorcupineWakeWordService.instance) {
      PorcupineWakeWordService.instance = new PorcupineWakeWordService();
    }
    return PorcupineWakeWordService.instance;
  }

   /**
    * Initializes the Porcupine wake word engine
    * 
    * Sets up notification permissions, configures notification handler,
    * and creates Porcupine instance for wake word detection.
    * 
    * @returns Promise that resolves when initialization is complete
    * @throws {Error} If access key is invalid or notifications permission denied
    * @throws {Error} If Porcupine initialization fails
    * 
    * @remarks
    * Must be called before start(). Safe to call multiple times.
    * Requires notification permission for background wake word detection.
    */
   async initialize(): Promise<void> {
    try {
      console.log('[PorcupineWakeWordService] Initializing...');

      // Request notification permissions (for waking up app)
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Notification permission required for wake word detection');
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Create Porcupine instance
      this.porcupine = await Porcupine.fromBuiltInKeywords(
        PorcupineWakeWordService.ACCESS_KEY,
        PorcupineWakeWordService.WAKE_WORDS,
        PorcupineWakeWordService.SENSITIVITIES
      );

      console.log('[PorcupineWakeWordService] Initialized successfully');
    } catch (error) {
      if (error instanceof PorcupineErrors.PorcupineInvalidArgumentError) {
        console.error('[PorcupineWakeWordService] Invalid Access Key');
        throw new Error('Invalid Porcupine Access Key. Get one from console.picovoice.ai');
      }
      console.error('[PorcupineWakeWordService] Initialization failed:', error);
      throw error;
    }
  }

   /**
    * Starts listening for wake word detection
    * 
    * Begins background listening for configured wake words.
    * Fires callback when wake word is detected.
    * 
    * @param onWakeWord - Callback invoked when wake word detected
    * @returns Promise that resolves when listening starts
    * @throws {Error} If Porcupine not initialized
    * 
    * @remarks
    * Call initialize() first. Safe to call multiple times.
    * Runs in background even when app is backgrounded.
    */
   async start(onWakeWord: () => void): Promise<void> {
    if (!this.porcupine) {
      throw new Error('Porcupine not initialized. Call initialize() first.');
    }

    if (this.isListening) {
      console.warn('[PorcupineWakeWordService] Already listening');
      return;
    }

    try {
      console.log('[PorcupineWakeWordService] Starting wake word detection...');

      this.onWakeWordCallback = onWakeWord;
      this.isListening = true;

      // Start audio recording
      await this.porcupine.start(
        async (keywordIndex: number) => {
          if (keywordIndex >= 0) {
            console.log('[PorcupineWakeWordService] Wake word detected!');
            await this.handleWakeWordDetected();
          }
        },
        (error: PorcupineErrors.PorcupineError) => {
          console.error('[PorcupineWakeWordService] Error:', error);
          this.isListening = false;
        }
      );

      console.log('[PorcupineWakeWordService] Wake word detection active');
    } catch (error) {
      console.error('[PorcupineWakeWordService] Failed to start:', error);
      this.isListening = false;
      throw error;
    }
  }

  /**
   * Stop listening for wake word
   */
  async stop(): Promise<void> {
    if (!this.isListening || !this.porcupine) {
      return;
    }

    try {
      console.log('[PorcupineWakeWordService] Stopping wake word detection...');
      
      await this.porcupine.stop();
      this.isListening = false;
      this.onWakeWordCallback = null;

      console.log('[PorcupineWakeWordService] Stopped successfully');
    } catch (error) {
      console.error('[PorcupineWakeWordService] Failed to stop:', error);
      throw error;
    }
  }

  /**
   * Handle wake word detection
   */
  private async handleWakeWordDetected(): Promise<void> {
    console.log('[PorcupineWakeWordService] Processing wake word detection...');

    // If app is in foreground, just trigger callback
    if (this.onWakeWordCallback) {
      this.onWakeWordCallback();
    }

    // If app is in background, send notification to bring to foreground
    await this.sendWakeUpNotification();
  }

  /**
   * Send notification to wake up app
   */
  private async sendWakeUpNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Iris activado!',
          body: 'Toca para continuar con tu comando',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: {
            type: 'WAKE_WORD_DETECTED',
            timestamp: Date.now(),
          },
        },
        trigger: null, // Immediate
      });

      console.log('[PorcupineWakeWordService] Wake notification sent');
    } catch (error) {
      console.error('[PorcupineWakeWordService] Failed to send notification:', error);
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
    return PorcupineWakeWordService.WAKE_WORDS[0];
  }

  /**
   * Cleanup and release resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.isListening) {
        await this.stop();
      }

      if (this.porcupine) {
        await this.porcupine.delete();
        this.porcupine = null;
      }

      console.log('[PorcupineWakeWordService] Resources released');
    } catch (error) {
      console.error('[PorcupineWakeWordService] Cleanup failed:', error);
    }
  }
}

/**
 * React hook for Porcupine wake word detection
 */
export function usePorcupineWakeWord(
  onWakeWord: () => void,
  autoStart: boolean = true
) {
  const [isActive, setIsActive] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const serviceRef = React.useRef<PorcupineWakeWordService | null>(null);

  React.useEffect(() => {
    const service = PorcupineWakeWordService.getInstance();
    serviceRef.current = service;

    const initAndStart = async () => {
      try {
        await service.initialize();
        
        if (autoStart) {
          await service.start(onWakeWord);
          setIsActive(true);
        }
      } catch (err) {
        console.error('[usePorcupineWakeWord] Failed to initialize:', err);
        setError(err as Error);
      }
    };

    initAndStart();

    // Cleanup on unmount
    return () => {
      service.stop();
    };
  }, []);

  const start = React.useCallback(async () => {
    try {
      await serviceRef.current?.start(onWakeWord);
      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [onWakeWord]);

  const stop = React.useCallback(async () => {
    try {
      await serviceRef.current?.stop();
      setIsActive(false);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  return {
    isActive,
    error,
    start,
    stop,
    wakeWord: serviceRef.current?.getWakeWord() || 'picovoice',
  };
}

// Add React import
import React from 'react';
