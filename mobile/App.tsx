import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { HomeScreen } from './src/shared/presentation/components/pages/HomeScreen';
import { WakeWordStatusBar } from './src/shared/presentation/components/atoms/WakeWordStatusBar';
import { CameraCapture } from './src/vision/presentation/components/CameraCapture';
import { useContinuousWakeWord } from './src/voice/presentation/hooks/useContinuousWakeWord';
import { useAppStateWakeWord } from './src/voice/presentation/hooks/useAppStateWakeWord';
import { useVisionService } from './src/vision/presentation/hooks/useVisionService';

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
        <WakeWordStatusBar isActive={isActive} lastTranscript={lastTranscript} />
        <HomeScreen 
          wakeWordActive={isActive} 
          lastTranscript={lastTranscript}
          visionService={visionService}
        />
        
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
