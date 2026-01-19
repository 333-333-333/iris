import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { VoiceCommandPanel } from '../VoiceCommandPanel';

// Mock del hook que usará
jest.mock('../../../../../voice/presentation/hooks/useVoiceCommands', () => ({
  useVoiceCommands: jest.fn(),
}));

import { useVoiceCommands } from '../../../../../voice/presentation/hooks/useVoiceCommands';
const mockUseVoiceCommands = useVoiceCommands as jest.MockedFunction<
  typeof useVoiceCommands
>;

describe('VoiceCommandPanel', () => {
  // Default mock return values
  const defaultMockReturn = {
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    hasError: false,
    transcript: '',
    lastDescription: null,
    error: null,
    start: jest.fn(),
    stop: jest.fn(),
    retry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceCommands.mockReturnValue(defaultMockReturn);
  });

  describe('initial state', () => {
    it('should show activate button when idle', () => {
      render(<VoiceCommandPanel />);

      expect(screen.getByRole('button', { name: /activar/i })).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: /detener/i })).not.toBeOnTheScreen();
    });
  });

  describe('listening state', () => {
    it('should show listening status and stop button', () => {
      mockUseVoiceCommands.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        transcript: 'iris describe',
      });

      render(<VoiceCommandPanel />);

      expect(screen.getByText(/di "iris" para comenzar/i)).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: /detener/i })).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: /activar/i })).not.toBeOnTheScreen();
    });
  });

  describe('processing state', () => {
    it('should show processing status', () => {
      mockUseVoiceCommands.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
      });

      render(<VoiceCommandPanel />);

      expect(screen.getByText(/procesando/i)).toBeOnTheScreen();
    });
  });

  describe('speaking state', () => {
    it('should show last description', () => {
      mockUseVoiceCommands.mockReturnValue({
        ...defaultMockReturn,
        isSpeaking: true,
        lastDescription: 'Veo una persona',
      });

      render(<VoiceCommandPanel />);

      expect(screen.getByText('Veo una persona')).toBeOnTheScreen();
    });
  });

  describe('error state', () => {
    it('should show error message and retry button', () => {
      mockUseVoiceCommands.mockReturnValue({
        ...defaultMockReturn,
        hasError: true,
        error: 'Microphone access denied',
      });

      render(<VoiceCommandPanel />);

      expect(screen.getByText('Microphone access denied')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeOnTheScreen();
    });
  });

  describe('interaction', () => {
    it('should call start when activate button pressed', async () => {
      const start = jest.fn();
      mockUseVoiceCommands.mockReturnValue({
        ...defaultMockReturn,
        start,
      });

      render(<VoiceCommandPanel />);

      fireEvent.press(screen.getByRole('button', { name: /activar/i }));

      await waitFor(() => {
        expect(start).toHaveBeenCalledTimes(1);
      });
    });

    it('should call stop when stop button pressed', async () => {
      const stop = jest.fn();
      mockUseVoiceCommands.mockReturnValue({
        ...defaultMockReturn,
        isListening: true,
        stop,
      });

      render(<VoiceCommandPanel />);

      fireEvent.press(screen.getByRole('button', { name: /detener/i }));

      await waitFor(() => {
        expect(stop).toHaveBeenCalledTimes(1);
      });
    });

    it('should call retry when retry button pressed', async () => {
      const retry = jest.fn();
      mockUseVoiceCommands.mockReturnValue({
        ...defaultMockReturn,
        hasError: true,
        error: 'Microphone access denied',
        retry,
      });

      render(<VoiceCommandPanel />);

      fireEvent.press(screen.getByRole('button', { name: /reintentar/i }));

      await waitFor(() => {
        expect(retry).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<VoiceCommandPanel />);

      // Activate button
      expect(screen.getByRole('button', { name: /activar/i })).toHaveAccessibilityLabel('Activar');
      expect(screen.getByRole('button', { name: /activar/i })).toHaveAccessibilityHint('Activa el reconocimiento de voz');

      // Status indicator
      expect(screen.getByTestId('status-indicator')).toHaveAccessibilityLabel('Estado del asistente');
    });
  });
});
