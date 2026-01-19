import React from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Configuration for app state lifecycle callbacks
 * 
 * @public
 */
interface UseAppStateWakeWordOptions {
  /** Callback fired when app returns to foreground */
  onForeground: () => void;
  /** Callback fired when app goes to background */
  onBackground: () => void;
}

/**
 * React hook for managing app lifecycle events
 * 
 * Monitors app state changes and triggers callbacks for foreground/background transitions.
 * Useful for controlling wake word detection based on app visibility.
 * 
 * @param options - Lifecycle callback handlers
 * 
 * @remarks
 * Typical usage:
 * - Restart wake word detection when app comes to foreground
 * - Pause non-critical operations when going to background
 * - Save state before backgrounding
 * 
 * @example
 * ```typescript
 * useAppStateWakeWord({
 *   onForeground: async () => {
 *     console.log('App is now active - restart wake word');
 *     await startWakeWordDetection();
 *   },
 *   onBackground: () => {
 *     console.log('App is backgrounded');
 *     // Cleanup here if needed
 *   },
 * });
 * ```
 * 
 * @public
 */
export function useAppStateWakeWord(options: UseAppStateWakeWordOptions) {
  const appState = React.useRef(AppState.currentState);

  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const { onForeground, onBackground } = options;

        // App came to foreground
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          console.log('[useAppStateWakeWord] App came to foreground');
          onForeground();
        }

        // App going to background
        if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
          console.log('[useAppStateWakeWord] App going to background');
          onBackground();
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [options.onForeground, options.onBackground]);
}
