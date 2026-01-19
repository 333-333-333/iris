import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';

// Type para evitar el error con typeof
declare global {
  namespace JSX {
    interface IntrinsicElements {
      button: any;
    }
  }
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}

const variantStyles: Record<ButtonVariant, StyleSheet.NamedStyles<any>> = {
  primary: {
    backgroundColor: '#3B82F6',
  },
  secondary: {
    backgroundColor: '#6B7280',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  danger: {
    backgroundColor: '#DC2626',
  },
};

const sizeStyles: Record<ButtonSize, StyleSheet.NamedStyles<any>> = {
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
};

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondary: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  outline: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  danger: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
};

export function Button({
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        loading && styles.loading,
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          testID="button-loading"
          color={variant === 'outline' ? '#3B82F6' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            textVariantStyles[variant],
            sizeStyles[size],
            disabled && styles.textDisabled,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.7,
  },
  text: {
    fontSize: 16,
  },
  textDisabled: {
    opacity: 0.7,
  },
});