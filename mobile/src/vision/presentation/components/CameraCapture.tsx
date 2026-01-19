/**
 * CameraCapture - Componente invisible que gestiona la cámara
 * 
 * Este componente mantiene una instancia de Camera activa pero invisible,
 * permitiendo capturar fotos rápidamente cuando se necesiten.
 * 
 * Para una persona ciega, no mostramos preview - solo capturamos y analizamos.
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { ExpoCameraAdapter } from '../../infrastructure/adapters/expo/ExpoCameraAdapter';

interface CameraCaptureProps {
  /** Callback que recibe el adapter configurado */
  onAdapterReady?: (adapter: ExpoCameraAdapter) => void;
  
  /** Si debe usar la cámara frontal (default: false - cámara trasera) */
  useFrontCamera?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onAdapterReady,
  useFrontCamera = false,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const adapterRef = useRef<ExpoCameraAdapter>(new ExpoCameraAdapter());

  useEffect(() => {
    // Configurar el adapter con la referencia a la cámara
    if (cameraRef.current) {
      adapterRef.current.setCameraRef(cameraRef.current);
      
      // Notificar que el adapter está listo
      onAdapterReady?.(adapterRef.current);
    }
  }, [onAdapterReady]);

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={useFrontCamera ? 'front' : 'back'}
        // Mantener la cámara preparada pero oculta
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  camera: {
    width: 1,
    height: 1,
  },
});
