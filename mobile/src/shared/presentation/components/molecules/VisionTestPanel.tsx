/**
 * VisionTestPanel - Panel de prueba para visión artificial
 * 
 * Componente de desarrollo que permite probar la funcionalidad de visión
 * sin necesidad de usar comandos de voz.
 * 
 * Permite:
 * - Capturar foto con la cámara
 * - Seleccionar imagen de la galería
 * - Analizar escena actual
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';
import { ImagePicker } from './ImagePicker';
import { useVisionService } from '../../../../vision/presentation/hooks/useVisionService';
import { ExpoSpeechSynthesizer } from '../../../../voice/infrastructure/adapters/simple/SimpleSpeechAdapter';

export function VisionTestPanel() {
  const { visionService, isReady, visionAdapter } = useVisionService();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Crear instancia de TTS (memoizada)
  const speechSynthesizer = useMemo(() => new ExpoSpeechSynthesizer(), []);

  const analyzeImage = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      setError('');
      setResult('');

      console.log('[VisionTestPanel] Analyzing image:', imageUri);
      
      // Analizar la imagen directamente con TFLite adapter
      const sceneDescription = await visionAdapter.analyzeImage(imageUri);
      const description = sceneDescription.naturalDescription || 'No se detectaron objetos';
      
      setResult(description);
      
      // HABLAR la descripción
      console.log('[VisionTestPanel] Speaking description...');
      await speechSynthesizer.speak(description);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      // Hablar el error también
      await speechSynthesizer.speak(`Error: ${errorMessage}`);
      console.error('[VisionTestPanel] Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeScene = async () => {
    try {
      setIsAnalyzing(true);
      setError('');
      setResult('');

      const analysis = await visionService.analyzeScene();
      const description = analysis.description || 'No se detectaron objetos';
      
      setResult(description);
      
      // HABLAR la descripción
      console.log('[VisionTestPanel] Speaking description...');
      await speechSynthesizer.speak(description);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      // Hablar el error también
      await speechSynthesizer.speak(`Error: ${errorMessage}`);
      console.error('[VisionTestPanel] Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelected = (uri: string) => {
    console.log('[VisionTestPanel] Image selected:', uri);
    analyzeImage(uri);
  };

  const handleImagePickerError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClearResults = () => {
    setResult('');
    setError('');
  };

  return (
    <View style={styles.container}>
      <Typography variant="heading">Pruebas de Visión</Typography>

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          isReady ? styles.statusReady : styles.statusNotReady
        ]}>
          <Typography variant="caption" style={styles.statusText}>
            {isReady ? '✓ Modelos cargados' : '⏳ Cargando modelos...'}
          </Typography>
        </View>
      </View>

      {/* Selector de imágenes */}
      <ImagePicker
        onImageSelected={handleImageSelected}
        onError={handleImagePickerError}
        showPreview={true}
        mode="both"
        galleryButtonLabel="📁 Analizar desde Galería"
        cameraButtonLabel="📷 Capturar y Analizar"
      />

      {/* Divisor */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Typography variant="caption" style={styles.dividerText}>
          o
        </Typography>
        <View style={styles.divider} />
      </View>

      {/* Botón de analizar escena actual */}
      <View style={styles.buttonsContainer}>
        <Button
          label="🎯 Analizar Escena Actual"
          variant="outline"
          size="large"
          onPress={handleAnalyzeScene}
          disabled={!isReady || isAnalyzing}
        />

        {(result || error) && (
          <Button
            label="Limpiar Resultados"
            variant="outline"
            size="medium"
            onPress={handleClearResults}
          />
        )}
      </View>

      {isAnalyzing && (
        <View style={styles.resultContainer}>
          <Typography variant="body">
            🔍 Analizando imagen...
          </Typography>
        </View>
      )}

      {result && !isAnalyzing && (
        <View style={[styles.resultContainer, styles.successContainer]}>
          <Typography variant="subheading" style={styles.resultTitle}>
            Resultado:
          </Typography>
          <Typography variant="body" style={styles.resultText}>
            {result}
          </Typography>
        </View>
      )}

      {error && !isAnalyzing && (
        <View style={[styles.resultContainer, styles.errorContainer]}>
          <Typography variant="subheading" style={styles.errorTitle}>
            Error:
          </Typography>
          <Typography variant="caption" style={styles.errorText}>
            {error}
          </Typography>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Typography variant="caption" style={styles.infoText}>
          💡 Este panel permite probar la visión artificial sin usar comandos de voz.
          {'\n\n'}
          • Selecciona una imagen de tu galería
          {'\n'}
          • Captura una foto nueva
          {'\n'}
          • Analiza la escena actual con la cámara trasera
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
    backgroundColor: '#1A1A2E',
  },

  statusContainer: {
    alignItems: 'center',
  },

  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  statusReady: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },

  statusNotReady: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
  },

  statusText: {
    color: '#E0E0E0',
  },

  buttonsContainer: {
    gap: 12,
    alignItems: 'center',
  },

  resultContainer: {
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },

  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },

  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },

  resultTitle: {
    color: '#22C55E',
  },

  resultText: {
    color: '#E0E0E0',
    lineHeight: 24,
  },

  errorTitle: {
    color: '#EF4444',
  },

  errorText: {
    color: '#FCA5A5',
  },

  infoContainer: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  infoText: {
    color: '#93C5FD',
    lineHeight: 20,
    textAlign: 'center',
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  dividerText: {
    color: '#6B7280',
  },
});
