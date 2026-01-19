import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PulsingCircle } from '../PulsingCircle';

describe('PulsingCircle', () => {
  describe('rendering', () => {
    it('should render the circle', () => {
      render(<PulsingCircle />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render when active', () => {
      render(<PulsingCircle active />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render when inactive', () => {
      render(<PulsingCircle active={false} />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });
  });

  describe('sizes', () => {
    it('should render with default size', () => {
      render(<PulsingCircle />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render with custom size', () => {
      render(<PulsingCircle size={100} />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render small preset', () => {
      render(<PulsingCircle size="small" />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render large preset', () => {
      render(<PulsingCircle size="large" />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });
  });

  describe('colors', () => {
    it('should render with default color', () => {
      render(<PulsingCircle />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render with custom color', () => {
      render(<PulsingCircle color="#00FF00" />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render with status color - listening', () => {
      render(<PulsingCircle status="listening" />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render with status color - processing', () => {
      render(<PulsingCircle status="processing" />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });

    it('should render with status color - error', () => {
      render(<PulsingCircle status="error" />);

      expect(screen.getByTestId('pulsing-circle')).toBeOnTheScreen();
    });
  });

  describe('accessibility', () => {
    it('should have accessible role', () => {
      render(<PulsingCircle accessibilityLabel="Voice active indicator" />);

      expect(screen.getByLabelText('Voice active indicator')).toBeOnTheScreen();
    });
  });
});
