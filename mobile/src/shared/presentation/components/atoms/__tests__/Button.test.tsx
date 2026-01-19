import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with label', () => {
      render(<Button label="Press me" onPress={() => {}} />);

      expect(screen.getByText('Press me')).toBeOnTheScreen();
    });

    it('should render as touchable', () => {
      render(<Button label="Click" onPress={() => {}} />);

      expect(screen.getByRole('button')).toBeOnTheScreen();
    });
  });

  describe('variants', () => {
    it('should render primary variant by default', () => {
      render(<Button label="Primary" onPress={() => {}} />);

      expect(screen.getByRole('button', { name: 'Primary' })).toBeOnTheScreen();
    });

    it('should render secondary variant', () => {
      render(<Button label="Secondary" variant="secondary" onPress={() => {}} />);

      expect(screen.getByRole('button', { name: 'Secondary' })).toBeOnTheScreen();
    });

    it('should render outline variant', () => {
      render(<Button label="Outline" variant="outline" onPress={() => {}} />);

      expect(screen.getByRole('button', { name: 'Outline' })).toBeOnTheScreen();
    });

    it('should render danger variant', () => {
      render(<Button label="Danger" variant="danger" onPress={() => {}} />);

      expect(screen.getByRole('button', { name: 'Danger' })).toBeOnTheScreen();
    });
  });

  describe('interaction', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      render(<Button label="Press" onPress={onPress} />);

      fireEvent.press(screen.getByRole('button'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      render(<Button label="Disabled" onPress={onPress} disabled />);

      fireEvent.press(screen.getByRole('button'));

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should render as disabled', () => {
      render(<Button label="Disabled" onPress={() => {}} disabled />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be enabled by default', () => {
      render(<Button label="Enabled" onPress={() => {}} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      render(<Button label="Loading" onPress={() => {}} loading />);

      expect(screen.getByTestId('button-loading')).toBeOnTheScreen();
    });

    it('should hide label when loading', () => {
      render(<Button label="Hidden" onPress={() => {}} loading />);

      expect(screen.queryByText('Hidden')).not.toBeOnTheScreen();
    });

    it('should be disabled when loading', () => {
      const onPress = jest.fn();
      render(<Button label="Loading" onPress={onPress} loading />);

      fireEvent.press(screen.getByRole('button'));

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      render(<Button label="Accessible" onPress={() => {}} />);

      expect(screen.getByLabelText('Accessible')).toBeOnTheScreen();
    });

    it('should support custom accessibilityHint', () => {
      render(
        <Button 
          label="Action" 
          onPress={() => {}} 
          accessibilityHint="Performs an action"
        />
      );

      expect(screen.getByHintText('Performs an action')).toBeOnTheScreen();
    });

    it('should announce disabled state', () => {
      render(<Button label="Disabled" onPress={() => {}} disabled />);

      expect(screen.getByRole('button')).toHaveAccessibilityState({ disabled: true });
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<Button label="Small" size="small" onPress={() => {}} />);

      expect(screen.getByRole('button')).toBeOnTheScreen();
    });

    it('should render medium size by default', () => {
      render(<Button label="Medium" onPress={() => {}} />);

      expect(screen.getByRole('button')).toBeOnTheScreen();
    });

    it('should render large size', () => {
      render(<Button label="Large" size="large" onPress={() => {}} />);

      expect(screen.getByRole('button')).toBeOnTheScreen();
    });
  });
});
