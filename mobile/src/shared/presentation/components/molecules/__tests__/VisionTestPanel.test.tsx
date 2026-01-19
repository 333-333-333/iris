/**
 * Tests for VisionTestPanel component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { VisionTestPanel } from '../VisionTestPanel';

// Mock useVisionService hook
jest.mock('../../../../../vision/presentation/hooks/useVisionService', () => ({
  useVisionService: jest.fn(() => ({
    visionService: {
      analyzeScene: jest.fn().mockResolvedValue('Veo una persona y una silla'),
    },
    isReady: true,
  })),
}));

describe('VisionTestPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<VisionTestPanel />);
    
    expect(screen.getByText('Pruebas de Visión')).toBeTruthy();
    expect(screen.getByText('✓ Modelos cargados')).toBeTruthy();
    expect(screen.getByText('Analizar Escena')).toBeTruthy();
  });

  it('shows loading state when models are not ready', () => {
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: jest.fn() },
      isReady: false,
    });

    render(<VisionTestPanel />);
    
    expect(screen.getByText('⏳ Cargando modelos...')).toBeTruthy();
  });

  it('disables analyze button when not ready', () => {
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: jest.fn() },
      isReady: false,
    });

    render(<VisionTestPanel />);
    
    const analyzeButton = screen.getByText('Analizar Escena');
    expect(analyzeButton.props.disabled).toBe(true);
  });

  it('calls analyzeScene when button is pressed', async () => {
    const mockAnalyzeScene = jest.fn().mockResolvedValue('Veo una persona');
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: mockAnalyzeScene },
      isReady: true,
    });

    render(<VisionTestPanel />);
    
    const analyzeButton = screen.getByText('Analizar Escena');
    fireEvent.press(analyzeButton);

    await waitFor(() => {
      expect(mockAnalyzeScene).toHaveBeenCalledTimes(1);
    });
  });

  it('shows analyzing state during analysis', async () => {
    const mockAnalyzeScene = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('Test result'), 100))
    );
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: mockAnalyzeScene },
      isReady: true,
    });

    render(<VisionTestPanel />);
    
    const analyzeButton = screen.getByText('Analizar Escena');
    fireEvent.press(analyzeButton);

    // Should show analyzing message
    await waitFor(() => {
      expect(screen.getByText('🔍 Analizando imagen...')).toBeTruthy();
    });
  });

  it('displays result after successful analysis', async () => {
    const mockAnalyzeScene = jest.fn().mockResolvedValue('Veo una persona y una silla');
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: mockAnalyzeScene },
      isReady: true,
    });

    render(<VisionTestPanel />);
    
    const analyzeButton = screen.getByText('Analizar Escena');
    fireEvent.press(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Resultado:')).toBeTruthy();
      expect(screen.getByText('Veo una persona y una silla')).toBeTruthy();
    });
  });

  it('displays error message on analysis failure', async () => {
    const mockAnalyzeScene = jest.fn().mockRejectedValue(new Error('Camera not available'));
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: mockAnalyzeScene },
      isReady: true,
    });

    render(<VisionTestPanel />);
    
    const analyzeButton = screen.getByText('Analizar Escena');
    fireEvent.press(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Error:')).toBeTruthy();
      expect(screen.getByText('Camera not available')).toBeTruthy();
    });
  });

  it('clears results when clear button is pressed', async () => {
    const mockAnalyzeScene = jest.fn().mockResolvedValue('Test result');
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: mockAnalyzeScene },
      isReady: true,
    });

    render(<VisionTestPanel />);
    
    // First analyze
    const analyzeButton = screen.getByText('Analizar Escena');
    fireEvent.press(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Test result')).toBeTruthy();
    });

    // Then clear
    const clearButton = screen.getByText('Limpiar Resultados');
    fireEvent.press(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('Test result')).toBeFalsy();
      expect(screen.queryByText('Limpiar Resultados')).toBeFalsy();
    });
  });

  it('shows "No se detectaron objetos" when result is empty', async () => {
    const mockAnalyzeScene = jest.fn().mockResolvedValue('');
    const { useVisionService } = require('../../../../../vision/presentation/hooks/useVisionService');
    useVisionService.mockReturnValue({
      visionService: { analyzeScene: mockAnalyzeScene },
      isReady: true,
    });

    render(<VisionTestPanel />);
    
    const analyzeButton = screen.getByText('Analizar Escena');
    fireEvent.press(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('No se detectaron objetos')).toBeTruthy();
    });
  });

  it('shows info message at the bottom', () => {
    render(<VisionTestPanel />);
    
    expect(screen.getByText(/Este panel permite probar la visión artificial/)).toBeTruthy();
  });
});
