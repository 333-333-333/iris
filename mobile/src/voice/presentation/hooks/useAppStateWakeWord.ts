import React from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppStateWakeWordOptions {
  onForeground: () => void;
  onBackground: () => void;
}

/**
 * Hook to handle app state changes for wake word service
 * 
 * Restarts wake word detection when app comes to foreground
 * and handles cleanup when going to background.
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
