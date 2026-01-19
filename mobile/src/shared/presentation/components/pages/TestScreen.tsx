import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { Typography } from '../atoms/Typography';
import { VoiceCommandPanel } from '../molecules/VoiceCommandPanel';
import { VisionTestPanel } from '../molecules/VisionTestPanel';
import { VisionService } from '../../../../voice/application/ports/VisionService';

/**
 * Props for the TestScreen component
 * 
 * @public
 */
interface TestScreenProps {
  /** Service for analyzing visual scenes */
  visionService?: VisionService;
}

/**
 * Test mode identifier for toggling between voice and vision panels
 * 
 * @internal
 */
type TestMode = 'voice' | 'vision';

/**
 * Development mode test screen for Iris
 * 
 * Provides tabbed interface for testing both voice command and vision analysis functionality.
 * Allows developers to switch between VoiceCommandPanel and VisionTestPanel to debug
 * and verify different components of the system.
 * 
 * @param props - Component props including vision service
 * @returns The test screen component with mode selector
 * 
 * @remarks
 * This component is only shown when DEV_MODE is true in App.tsx.
 * Used for development and debugging, not intended for production.
 * 
 * @example
 * ```typescript
 * <TestScreen visionService={visionService} />
 * ```
 * 
 * @public
 */
export function TestScreen({ visionService }: TestScreenProps) {
  const [mode, setMode] = useState<TestMode>('vision');

  return (
    <View style={styles.container}>
      {/* Header con selector de modo */}
      <View style={styles.header}>
        <Typography variant="heading">Iris - Modo Pruebas</Typography>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === 'voice' && styles.tabActive]}
            onPress={() => setMode('voice')}
          >
            <Typography
              variant="caption"
              style={mode === 'voice' ? styles.tabTextActive : styles.tabText}
            >
              🎤 Voz
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, mode === 'vision' && styles.tabActive]}
            onPress={() => setMode('vision')}
          >
            <Typography
              variant="caption"
              style={mode === 'vision' ? styles.tabTextActive : styles.tabText}
            >
              👁️ Visión
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido según el modo */}
      <View style={styles.content}>
        {mode === 'voice' && <VoiceCommandPanel visionService={visionService} />}
        {mode === 'vision' && <VisionTestPanel />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: '#3B82F6',
  },

  tabText: {
    color: '#9CA3AF',
  },

  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  content: {
    flex: 1,
  },
});
