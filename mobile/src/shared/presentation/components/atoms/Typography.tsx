import React from 'react';
import { Text, TextStyle, StyleSheet, TextProps } from 'react-native';

// Type para evitar el error con typeof
declare global {
  namespace JSX {
    interface IntrinsicElements {
      text: any;
    }
  }
}

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

const variantStyles: Record<TypographyVariant, TextStyle> = {
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#DC2626',
  },
};

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
    color: '#1F2937',
  },
});
