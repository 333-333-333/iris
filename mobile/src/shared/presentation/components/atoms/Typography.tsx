import React from 'react';
import { Text, TextStyle, StyleSheet, TextProps } from 'react-native';
import { colors } from '../../../theme';

export type TypographyVariant = 
  | 'heading' 
  | 'subheading' 
  | 'body' 
  | 'caption' 
  | 'label' 
  | 'error';

export type TypographyAlign = 'left' | 'center' | 'right';

export interface TypographyProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: string;
  align?: TypographyAlign;
  style?: TextStyle;
}

/**
 * Variant styles using Catppuccin Mocha palette
 */
const variantStyles: Record<TypographyVariant, TextStyle> = {
  heading: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    color: colors.text.secondary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text.primary,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.tertiary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.text.tertiary,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: colors.status.error,
  },
};

/**
 * Typography component with Catppuccin Mocha styling
 * 
 * Provides consistent text styling across the app with
 * semantic variants and accessibility support.
 * 
 * @param props - Component props
 * @returns Styled Text component
 * 
 * @public
 */
export function Typography({
  children,
  variant = 'body',
  color,
  align = 'left',
  style,
  accessibilityLabel,
  ...props
}: TypographyProps) {
  const isHeading = variant === 'heading' || variant === 'subheading';

  return (
    <Text
      style={[
        styles.base,
        variantStyles[variant],
        color ? { color } : null,
        { textAlign: align },
        style,
      ]}
      accessibilityRole={isHeading ? 'header' : 'text'}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text.primary,
  },
});
