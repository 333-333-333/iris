import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';

import { HomeScreen } from './src/shared/presentation/components/pages/HomeScreen';
import { CameraCapture } from './src/vision/presentation/components/CameraCapture';
import { useVisionService } from './src/vision/presentation/hooks/useVisionService';
import { useIrisMachine } from './src/voice/presentation/hooks/useIrisMachine';
import { colors } from './src/shared/theme';

/**
 * Root application component for Iris voice assistant
 * 
 * Uses XState machine to orchestrate the complete voice assistant flow:
 * 1. initializing: Load vision models, request camera/mic permissions
 * 2. listening: Continuous wake word detection ("Iris")
 * 3. processing: Capture photo, analyze scene
 * 4. speaking: Text-to-speech response
 * 
 * The machine ensures proper sequencing - no race conditions!
 * 
 * @returns The root React Native component tree
 * @public
 */
export default function App(): React.JSX.Element {
  // Initialize vision service (creates adapters)
  const { visionService, cameraAdapter } = useVisionService({
    preload: false, // Machine handles preloading
  });

  // Main state machine - orchestrates everything
  const {
    state,
    isListening,
    isProcessing,
    isSpeaking,
    hasError,
    isReady,
    transcript,
    lastDescription,
    error,
    retry,
  } = useIrisMachine({
    visionService,
    cameraService: cameraAdapter,
    onStateChange: (newState) => {
      console.log('[App] State:', newState);
    },
    onDescription: (description) => {
      console.log('[App] Description:', description.substring(0, 100));
    },
    onError: (err) => {
      console.error('[App] Error:', err);
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <HomeScreen 
          state={state}
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          hasError={hasError}
          lastTranscript={transcript}
          lastDescription={lastDescription}
          error={error}
          visionReady={isReady}
        />
        
        {/* 
          Invisible camera component
          Connects CameraView ref to the adapter used by the machine
        */}
        <CameraCapture 
          cameraAdapter={cameraAdapter}
          onReady={() => console.log('[App] Camera ref connected')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
});
