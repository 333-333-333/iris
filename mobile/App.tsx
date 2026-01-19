import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { HomeScreen } from './src/shared/presentation/components/pages/HomeScreen';
import { TestScreen } from './src/shared/presentation/components/pages/TestScreen';
import { WakeWordStatusBar } from './src/shared/presentation/components/atoms/WakeWordStatusBar';
import { CameraCapture } from './src/vision/presentation/components/CameraCapture';
import { useContinuousWakeWord } from './src/voice/presentation/hooks/useContinuousWakeWord';
import { useAppStateWakeWord } from './src/voice/presentation/hooks/useAppStateWakeWord';
import { useVisionService } from './src/vision/presentation/hooks/useVisionService';

/** Set to true to enable development mode with testing UI instead of home screen */
const DEV_MODE = true;

/**
 * Root application component for Iris voice assistant
 * 
 * Orchestrates the complete voice-vision interaction flow:
 * - Initializes vision models (on-device TensorFlow Lite + cloud adapters)
 * - Manages wake word detection and continuous listening
 * - Handles app foreground/background lifecycle for wake word service
 * - Routes between home screen and test screen based on dev mode
 * - Provides camera capture and status monitoring
 * 
 * @returns The root React Native component tree
 * 
 * @remarks
 * This component serves as the entry point for the entire application.
 * All critical services (vision, voice, speech synthesis) are initialized here
 * and passed down to child screens through props.
 * 
 * @public
 */
export default function App(): React.JSX.Element {
  // Initialize vision service (preloads models in background)
  const { visionService, cameraAdapter, isReady: visionReady } = useVisionService({
    preload: true,
  });

  console.log('[App] Vision service ready:', visionReady);

  // Wake word detection with auto-start
  const { isActive, lastTranscript, start } = useContinuousWakeWord({
    onWakeWord: (transcript) => {
      console.log('[App] Wake word detected:', transcript);
      // Wake word detected - HomeScreen will handle the command
    },
    autoStart: true,
  });

  // Handle app state changes (restart wake word on foreground)
  useAppStateWakeWord({
    onForeground: async () => {
      if (!isActive) {
        try {
          await start();
        } catch (error) {
          console.error('[App] Failed to restart wake word:', error);
        }
      }
    },
    onBackground: () => {
      console.log('[App] Wake word continues in background');
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {!DEV_MODE && (
          <WakeWordStatusBar isActive={isActive} lastTranscript={lastTranscript} />
        )}
        
        {DEV_MODE ? (
          <TestScreen visionService={visionService} />
        ) : (
          <HomeScreen 
            wakeWordActive={isActive} 
            lastTranscript={lastTranscript}
            visionService={visionService}
          />
        )}
        
        {/* Camera component (invisible but active) */}
        <CameraCapture 
          onAdapterReady={(adapter) => {
            // Camera adapter is ready
            console.log('[App] Camera adapter ready');
          }} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A2E', // Match HomeScreen background
  },
  container: {
    flex: 1,
  },
});
