import React from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { Typography } from '../atoms/Typography';
import { PulsingCircle } from '../atoms/PulsingCircle';
import { IrisUIState } from '../../../../voice/presentation/hooks/useIrisMachine';
import { colors } from '../../../theme';

/**
 * Props for the HomeScreen component
 * 
 * @public
 */
interface HomeScreenProps {
  /** Current assistant state */
  state: IrisUIState;
  /** True when listening for wake word */
  isListening: boolean;
  /** True when processing a command */
  isProcessing: boolean;
  /** True when speaking response */
  isSpeaking: boolean;
  /** True when in error state */
  hasError: boolean;
  /** Last transcript heard */
  lastTranscript: string;
  /** Last description generated */
  lastDescription: string | null;
  /** Error message if any */
  error: string | null;
  /** True when vision models are loaded */
  visionReady: boolean;
}

/**
 * Get status text based on current state
 */
function getStatusText(props: HomeScreenProps): string {
  const { state, isListening, isProcessing, isSpeaking, hasError, error, visionReady } = props;

  if (!visionReady) {
    return 'Cargando modelos de vision...';
  }

  if (hasError && error) {
    return `Error: ${error}`;
  }

  if (isSpeaking) {
    return 'Hablando...';
  }

  if (isProcessing) {
    return 'Analizando imagen...';
  }

  if (isListening) {
    return 'Di "Iris" seguido de un comando';
  }

  if (state === 'initializing') {
    return 'Iniciando...';
  }

  return 'Preparando...';
}

/**
 * Get accessibility announcement for state changes
 */
function getAccessibilityAnnouncement(props: HomeScreenProps): string {
  const { isListening, isProcessing, isSpeaking, hasError, visionReady } = props;

  if (!visionReady) {
    return 'Cargando. Por favor espera.';
  }

  if (hasError) {
    return 'Ocurrio un error. Iris sigue escuchando.';
  }

  if (isSpeaking) {
    return 'Iris esta hablando.';
  }

  if (isProcessing) {
    return 'Procesando tu solicitud.';
  }

  if (isListening) {
    return 'Iris esta escuchando. Di Iris seguido de un comando.';
  }

  return 'Iniciando Iris.';
}

/**
 * Main home screen for the Iris voice assistant
 * 
 * Displays:
 * - Iris branding
 * - Visual state indicator (pulsing circle)
 * - Status text
 * - Last transcript/description
 * 
 * Uses Catppuccin Mocha color palette for a soothing visual experience.
 * Fully accessible - announces state changes to screen readers.
 * No buttons - 100% voice controlled.
 * 
 * @param props - Component props with assistant state
 * @returns The main application screen component
 * 
 * @public
 */
export function HomeScreen(props: HomeScreenProps) {
  const { 
    state,
    isListening, 
    isProcessing, 
    isSpeaking, 
    hasError,
    lastTranscript,
    lastDescription,
    visionReady,
  } = props;

  const statusText = getStatusText(props);

  // Announce state changes to screen readers
  React.useEffect(() => {
    const announcement = getAccessibilityAnnouncement(props);
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [state, isListening, isProcessing, isSpeaking, hasError, visionReady]);

  // Determine pulsing circle status
  const circleStatus = hasError 
    ? 'error' 
    : isSpeaking 
      ? 'speaking' 
      : isProcessing 
        ? 'processing' 
        : 'listening';

  const isActive = isListening || isProcessing || isSpeaking;

  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Pantalla principal de Iris"
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="heading" style={styles.title}>
            Iris
          </Typography>
          
          <Typography variant="subheading" style={styles.subtitle}>
            Asistente de vision por voz
          </Typography>
        </View>

        {/* Visual State Indicator */}
        <View style={styles.visualIndicator}>
          <PulsingCircle
            active={isActive}
            status={circleStatus}
            size="large"
          />
        </View>

        {/* Status Text */}
        <View style={styles.statusContainer}>
          <Typography 
            variant="body"
            style={hasError ? styles.errorText : styles.statusText}
          >
            {statusText}
          </Typography>
        </View>

        {/* Last Transcript */}
        {lastTranscript && isListening && (
          <View style={styles.transcriptContainer}>
            <Typography variant="caption" style={styles.transcriptLabel}>
              Escuchado:
            </Typography>
            <Typography variant="body" style={styles.transcriptText}>
              "{lastTranscript}"
            </Typography>
          </View>
        )}

        {/* Last Description */}
        {lastDescription && isSpeaking && (
          <View style={styles.descriptionContainer}>
            <Typography variant="caption" style={styles.descriptionLabel}>
              Descripcion:
            </Typography>
            <Typography variant="body" style={styles.descriptionText}>
              {lastDescription}
            </Typography>
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Typography variant="caption" style={styles.helpText}>
            Comandos: "Iris describe", "Iris repite", "Iris ayuda"
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    color: colors.accent.purple,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  visualIndicator: {
    marginVertical: 32,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  statusText: {
    textAlign: 'center',
    color: colors.text.primary,
  },
  errorText: {
    textAlign: 'center',
    color: colors.status.error,
  },
  transcriptContainer: {
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background.surface,
    borderRadius: 12,
    maxWidth: '90%',
  },
  transcriptLabel: {
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  transcriptText: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  descriptionContainer: {
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.speaking,
    maxWidth: '90%',
  },
  descriptionLabel: {
    color: colors.status.speaking,
    marginBottom: 4,
  },
  descriptionText: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  helpContainer: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  helpText: {
    color: colors.text.muted,
    textAlign: 'center',
  },
});
