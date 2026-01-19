import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Typography } from '../Typography';

describe('Typography', () => {
  describe('rendering', () => {
    it('should render children text', () => {
      render(<Typography>Hello World</Typography>);

      expect(screen.getByText('Hello World')).toBeOnTheScreen();
    });

    it('should render with default variant (body)', () => {
      render(<Typography variant="body">Body text</Typography>);

      const element = screen.getByText('Body text');
      expect(element).toBeOnTheScreen();
    });
  });

  describe('variants', () => {
    it('should render heading variant', () => {
      render(<Typography variant="heading">Heading</Typography>);

      expect(screen.getByText('Heading')).toBeOnTheScreen();
    });

    it('should render subheading variant', () => {
      render(<Typography variant="subheading">Subheading</Typography>);

      expect(screen.getByText('Subheading')).toBeOnTheScreen();
    });

    it('should render body variant', () => {
      render(<Typography variant="body">Body</Typography>);

      expect(screen.getByText('Body')).toBeOnTheScreen();
    });

    it('should render caption variant', () => {
      render(<Typography variant="caption">Caption</Typography>);

      expect(screen.getByText('Caption')).toBeOnTheScreen();
    });

    it('should render label variant', () => {
      render(<Typography variant="label">Label</Typography>);

      expect(screen.getByText('Label')).toBeOnTheScreen();
    });

    it('should render error variant', () => {
      render(<Typography variant="error">Error message</Typography>);

      expect(screen.getByText('Error message')).toBeOnTheScreen();
    });
  });

  describe('accessibility', () => {
    it('should support accessibilityLabel', () => {
      render(
        <Typography accessibilityLabel="Custom label">Text</Typography>
      );

      expect(screen.getByLabelText('Custom label')).toBeOnTheScreen();
    });

    it('should have heading role for heading variant', () => {
      render(<Typography variant="heading">Heading</Typography>);

      expect(screen.getByRole('header')).toBeOnTheScreen();
    });
  });

  describe('styling', () => {
    it('should accept custom style prop', () => {
      render(<Typography style={{ marginTop: 10 }}>Styled text</Typography>);

      expect(screen.getByText('Styled text')).toBeOnTheScreen();
    });

    it('should support color prop', () => {
      render(<Typography color="#FF0000">Red text</Typography>);

      expect(screen.getByText('Red text')).toBeOnTheScreen();
    });

    it('should support align prop', () => {
      render(<Typography align="center">Centered</Typography>);

      expect(screen.getByText('Centered')).toBeOnTheScreen();
    });
  });
});
