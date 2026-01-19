import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../atoms/Typography';
import { VoiceCommandPanel } from '../molecules/VoiceCommandPanel';
import { VisionService } from '../../../../voice/application/ports/VisionService';

/**
 * Props for the HomeScreen component
 * 
 * @public
 */
interface HomeScreenProps {
  /** True when wake word detection is actively listening */
  wakeWordActive?: boolean;
  /** The most recent transcript from voice recognition */
  lastTranscript?: string;
  /** Service for analyzing visual scenes */
  visionService?: VisionService;
}

/**
 * Main home screen for the Iris voice assistant
 * 
 * Displays the Iris branding, description, and the voice command interaction panel.
 * Serves as the primary user interface when not in development mode.
 * 
 * @param props - Component props including wake word state and vision service
 * @returns The main application screen component
 * 
 * @remarks
 * This screen is designed to be clean and accessible, with minimal visual clutter
 * to support users with visual impairments who rely on voice and audio feedback.
 * 
 * @example
 * ```typescript
 * <HomeScreen
 *   wakeWordActive={isActive}
 *   lastTranscript={transcript}
 *   visionService={visionService}
 * />
 * ```
 * 
 * @public
 */
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
