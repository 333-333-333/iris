import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WakeWordStatusBarProps {
  isActive: boolean;
  lastTranscript?: string;
}

/**
 * Status bar showing wake word detection state
 * 
 * Displays a green bar when wake word detection is active,
 * and optionally shows the last detected transcript.
 */
export function WakeWordStatusBar({ isActive, lastTranscript }: WakeWordStatusBarProps) {
  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        🎤 Escuchando "iris"...
      </Text>
      {lastTranscript && (
        <Text style={styles.transcript}>
          Último: {lastTranscript}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4CAF50',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  transcript: {
    color: '#E8F5E9',
    fontSize: 10,
    marginTop: 2,
  },
});
