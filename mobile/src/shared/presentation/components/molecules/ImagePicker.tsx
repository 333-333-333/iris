/**
 * ImagePicker - Componente para seleccionar imágenes
 * 
 * Permite seleccionar imágenes de la galería o capturar con la cámara.
 * Sigue el patrón de Atomic Design (molécula).
 */

import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';

import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';

export interface ImagePickerProps {
  /** Callback cuando se selecciona una imagen */
  onImageSelected?: (uri: string) => void;
  
  /** Callback cuando ocurre un error */
  onError?: (error: string) => void;
  
  /** Si debe mostrar preview de la imagen seleccionada */
  showPreview?: boolean;
  
  /** Modo de selección */
  mode?: 'gallery' | 'camera' | 'both';
  
  /** Texto del botón de galería */
  galleryButtonLabel?: string;
  
  /** Texto del botón de cámara */
  cameraButtonLabel?: string;
}

export function ImagePicker({
  onImageSelected,
  onError,
  showPreview = true,
  mode = 'both',
  galleryButtonLabel = '📁 Seleccionar de Galería',
  cameraButtonLabel = '📷 Capturar Foto',
}: ImagePickerProps) {
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePickFromGallery = async () => {
    try {
      setIsLoading(true);

      // Solicitar permisos de galería
      const permissionResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        const errorMsg = 'Se necesita permiso para acceder a la galería';
        onError?.(errorMsg);
        return;
      }

      // Abrir selector de imágenes
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImageUri(imageUri);
        onImageSelected?.(imageUri);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al seleccionar imagen';
      onError?.(errorMessage);
      console.error('[ImagePicker] Error picking from gallery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      setIsLoading(true);

      // Solicitar permisos de cámara
      const permissionResult = await ExpoImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        const errorMsg = 'Se necesita permiso para acceder a la cámara';
        onError?.(errorMsg);
        return;
      }

      // Abrir cámara
      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImageUri(imageUri);
        onImageSelected?.(imageUri);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al capturar foto';
      onError?.(errorMessage);
      console.error('[ImagePicker] Error capturing photo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearImage = () => {
    setSelectedImageUri('');
  };

  return (
    <View style={styles.container}>
      {/* Preview de imagen seleccionada */}
      {showPreview && selectedImageUri && (
        <View style={styles.previewContainer}>
          <Image
            testID="preview-image"
            source={{ uri: selectedImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearImage}
          >
            <Typography variant="caption" style={styles.clearButtonText}>
              ✕ Eliminar
            </Typography>
          </TouchableOpacity>
        </View>
      )}

      {/* Botones de selección */}
      <View style={styles.buttonsContainer}>
        {(mode === 'gallery' || mode === 'both') && (
          <Button
            label={galleryButtonLabel}
            variant="primary"
            size="large"
            onPress={handlePickFromGallery}
            disabled={isLoading}
          />
        )}

        {(mode === 'camera' || mode === 'both') && (
          <Button
            label={cameraButtonLabel}
            variant="outline"
            size="large"
            onPress={handleCapturePhoto}
            disabled={isLoading}
          />
        )}
      </View>

      {isLoading && (
        <Typography variant="caption" style={styles.loadingText}>
          Cargando...
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  previewContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  buttonsContainer: {
    gap: 12,
    alignItems: 'center',
  },

  loadingText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
