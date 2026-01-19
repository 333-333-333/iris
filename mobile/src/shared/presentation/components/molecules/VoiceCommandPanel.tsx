import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Button } from '../atoms/Button';
import { PulsingCircle, PulsingCircleStatus } from '../atoms/PulsingCircle';
import { Typography } from '../atoms/Typography';
import { VisionService } from '../../../../voice/application/ports/VisionService';
import { useVoiceCommands } from '../../../../voice/presentation/hooks/useVoiceCommands';

interface VoiceCommandPanelProps {
  visionService?: VisionService;
}

export function VoiceCommandPanel({ visionService }: VoiceCommandPanelProps) {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    hasError,
    transcript,
    lastDescription,
    error,
    start,
    stop,
    retry,
  } = useVoiceCommands({
    visionService,
    onCommand: (cmd) => console.log('Command:', cmd),
    onDescription: (desc) => console.log('Description:', desc),
    onError: (err) => console.log('Error:', err),
  });

  const handleActivatePress = () => {
    if (isListening) {
      stop?.();
    } else {
      start?.();
    }
  };

  const handleRetryPress = () => {
    retry?.();
  };

  return (
    <View style={styles.container}>
      <PulsingCircle
        active={isListening || isProcessing}
        status={
          hasError ? 'error' :
          isSpeaking ? 'speaking' :
          isProcessing ? 'processing' :
          'listening'
        }
      />

      {hasError && error && (
        <View style={styles.errorContainer}>
          <Button
            label="Reintentar"
            variant="danger"
            size="medium"
            onPress={handleRetryPress}
          />
        </View>
      )}

      <View style={styles.statusContainer}>
        {!isListening && !isProcessing && !isSpeaking && (
          <Typography variant="caption">Inactivo - Pulsa Activar para comenzar</Typography>
        )}

        {isListening && transcript && (
          <Typography variant="caption">Escuchando: {transcript}</Typography>
        )}

        {isProcessing && (
          <Typography variant="caption">Procesando...</Typography>
        )}

        {isSpeaking && lastDescription && (
          <Typography variant="caption">Diciendo: {lastDescription}</Typography>
        )}
      </View>

      <View style={styles.controlsContainer}>
        {!isListening && !isProcessing && !isSpeaking && (
          <Button
            label="Activar"
            variant="primary"
            size="medium"
            onPress={handleActivatePress}
          />
        )}

        {(isListening || isProcessing || isSpeaking) && (
          <Button
            label="Detener"
            variant="outline"
            size="medium"
            onPress={stop}
          />
        )}

        {hasError && (
          <Button
            label="Reintentar"
            variant="danger"
            size="medium"
            onPress={handleRetryPress}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },

  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
  },

  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  controlsContainer: {
    gap: 12,
    alignItems: 'center',
  },
});
