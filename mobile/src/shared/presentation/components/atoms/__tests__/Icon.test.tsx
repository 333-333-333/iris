import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Icon } from '../Icon';

describe('Icon', () => {
  describe('rendering', () => {
    it('should render with name', () => {
      render(<Icon name="mic" />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });

    it('should render different icons', () => {
      const { rerender } = render(<Icon name="mic" />);
      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();

      rerender(<Icon name="mic-off" />);
      expect(screen.getByTestId('icon-mic-off')).toBeOnTheScreen();

      rerender(<Icon name="camera" />);
      expect(screen.getByTestId('icon-camera')).toBeOnTheScreen();
    });
  });

  describe('sizes', () => {
    it('should render with default size (24)', () => {
      render(<Icon name="mic" />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });

    it('should render with custom size', () => {
      render(<Icon name="mic" size={48} />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });

    it('should render small preset', () => {
      render(<Icon name="mic" size="small" />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });

    it('should render large preset', () => {
      render(<Icon name="mic" size="large" />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });
  });

  describe('colors', () => {
    it('should render with default color', () => {
      render(<Icon name="mic" />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });

    it('should render with custom color', () => {
      render(<Icon name="mic" color="#FF0000" />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });

    it('should render with semantic color', () => {
      render(<Icon name="mic" color="primary" />);

      expect(screen.getByTestId('icon-mic')).toBeOnTheScreen();
    });
  });

  describe('accessibility', () => {
    it('should support accessibilityLabel', () => {
      render(<Icon name="mic" accessibilityLabel="Microphone" />);

      expect(screen.getByLabelText('Microphone')).toBeOnTheScreen();
    });

    it('should be hidden from accessibility by default', () => {
      render(<Icon name="mic" />);

      // Icon should not be focusable by screen reader unless labeled
      expect(screen.getByTestId('icon-mic')).toHaveAccessibilityValue({});
    });
  });
});
