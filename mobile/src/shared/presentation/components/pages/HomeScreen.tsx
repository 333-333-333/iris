import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../atoms/Typography';
import { VoiceCommandPanel } from '../molecules/VoiceCommandPanel';
import { VisionService } from '../../../../voice/application/ports/VisionService';

interface HomeScreenProps {
  wakeWordActive?: boolean;
  lastTranscript?: string;
  visionService?: VisionService;
}

export function HomeScreen({ wakeWordActive, lastTranscript, visionService }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Typography variant="heading">Iris</Typography>
        
        <Typography variant="subheading">
          Asistente de visión para personas con discapacidad visual
        </Typography>

        <VoiceCommandPanel visionService={visionService} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
});
