/**
 * Tests for ImagePicker component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ImagePicker } from '../ImagePicker';
import * as ExpoImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

describe('ImagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders both buttons in "both" mode', () => {
      render(<ImagePicker mode="both" />);
      
      expect(screen.getByText('📁 Seleccionar de Galería')).toBeTruthy();
      expect(screen.getByText('📷 Capturar Foto')).toBeTruthy();
    });

    it('renders only gallery button in "gallery" mode', () => {
      render(<ImagePicker mode="gallery" />);
      
      expect(screen.getByText('📁 Seleccionar de Galería')).toBeTruthy();
      expect(screen.queryByText('📷 Capturar Foto')).toBeFalsy();
    });

    it('renders only camera button in "camera" mode', () => {
      render(<ImagePicker mode="camera" />);
      
      expect(screen.queryByText('📁 Seleccionar de Galería')).toBeFalsy();
      expect(screen.getByText('📷 Capturar Foto')).toBeTruthy();
    });

    it('renders with custom button labels', () => {
      render(
        <ImagePicker
          galleryButtonLabel="Custom Gallery"
          cameraButtonLabel="Custom Camera"
        />
      );
      
      expect(screen.getByText('Custom Gallery')).toBeTruthy();
      expect(screen.getByText('Custom Camera')).toBeTruthy();
    });
  });

  describe('Gallery Selection', () => {
    it('requests permission and opens gallery on button press', async () => {
      const mockOnImageSelected = jest.fn();
      
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      
      (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-image.jpg' }],
      });

      render(<ImagePicker onImageSelected={mockOnImageSelected} />);
      
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(ExpoImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ExpoImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
        expect(mockOnImageSelected).toHaveBeenCalledWith('file://test-image.jpg');
      });
    });

    it('calls onError when permission is denied', async () => {
      const mockOnError = jest.fn();
      
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      render(<ImagePicker onError={mockOnError} />);
      
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Se necesita permiso para acceder a la galería');
      });
    });

    it('does not call onImageSelected when user cancels', async () => {
      const mockOnImageSelected = jest.fn();
      
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      
      (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      render(<ImagePicker onImageSelected={mockOnImageSelected} />);
      
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(mockOnImageSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('Camera Capture', () => {
    it('requests permission and opens camera on button press', async () => {
      const mockOnImageSelected = jest.fn();
      
      (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      
      (ExpoImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://captured-image.jpg' }],
      });

      render(<ImagePicker onImageSelected={mockOnImageSelected} />);
      
      const cameraButton = screen.getByText('📷 Capturar Foto');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(ExpoImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(ExpoImagePicker.launchCameraAsync).toHaveBeenCalled();
        expect(mockOnImageSelected).toHaveBeenCalledWith('file://captured-image.jpg');
      });
    });

    it('calls onError when camera permission is denied', async () => {
      const mockOnError = jest.fn();
      
      (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      render(<ImagePicker onError={mockOnError} />);
      
      const cameraButton = screen.getByText('📷 Capturar Foto');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Se necesita permiso para acceder a la cámara');
      });
    });
  });

  describe('Image Preview', () => {
    it('shows preview when showPreview is true and image is selected', async () => {
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      
      (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-image.jpg' }],
      });

      render(<ImagePicker showPreview={true} />);
      
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        const image = screen.getByTestId('preview-image');
        expect(image).toBeTruthy();
        expect(image.props.source.uri).toBe('file://test-image.jpg');
      });
    });

    it('does not show preview when showPreview is false', async () => {
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      
      (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-image.jpg' }],
      });

      render(<ImagePicker showPreview={false} />);
      
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(screen.queryByTestId('preview-image')).toBeFalsy();
      });
    });

    it('clears preview when clear button is pressed', async () => {
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });
      
      (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://test-image.jpg' }],
      });

      render(<ImagePicker showPreview={true} />);
      
      // Select image
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(screen.getByTestId('preview-image')).toBeTruthy();
      });

      // Clear image
      const clearButton = screen.getByText('✕ Eliminar');
      fireEvent.press(clearButton);

      await waitFor(() => {
        expect(screen.queryByTestId('preview-image')).toBeFalsy();
      });
    });
  });

  describe('Error Handling', () => {
    it('calls onError when gallery selection throws error', async () => {
      const mockOnError = jest.fn();
      
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission error')
      );

      render(<ImagePicker onError={mockOnError} />);
      
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Permission error');
      });
    });

    it('calls onError when camera capture throws error', async () => {
      const mockOnError = jest.fn();
      
      (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Camera error')
      );

      render(<ImagePicker onError={mockOnError} />);
      
      const cameraButton = screen.getByText('📷 Capturar Foto');
      fireEvent.press(cameraButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Camera error');
      });
    });
  });

  describe('Loading State', () => {
    it('disables buttons while loading', async () => {
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ granted: true }), 100))
      );

      render(<ImagePicker />);
      
      const galleryButton = screen.getByText('📁 Seleccionar de Galería');
      fireEvent.press(galleryButton);

      // Buttons should be disabled
      expect(galleryButton.props.disabled).toBe(true);
      
      await waitFor(() => {
        expect(screen.getByText('Cargando...')).toBeTruthy();
      });
    });
  });
});
