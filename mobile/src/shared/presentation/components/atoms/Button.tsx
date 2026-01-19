import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';

// Type to avoid type error with typeof
declare global {
  namespace JSX {
    interface IntrinsicElements {
      button: any;
    }
  }
}

/**
 * Visual style variant for button appearance
 * 
 * @public
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

/**
 * Size preset for button padding and minimum height
 * 
 * @public
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for the Button component
 * 
 * @remarks
 * Extends React Native's TouchableOpacityProps with additional button-specific properties.
 * The component automatically handles disabled and loading states.
 * 
 * @public
 */
export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Text label displayed on the button */
  label: string;
  /** Visual style variant applied to button (default: primary) */
  variant?: ButtonVariant;
  /** Preset size affecting padding and height (default: medium) */
  size?: ButtonSize;
  /** If true, button is non-interactive with reduced opacity */
  disabled?: boolean;
  /** If true, displays loading spinner and disables interaction */
  loading?: boolean;
  /** Accessibility hint describing button action */
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

/**
 * Reusable button component with multiple style variants and sizes
 * 
 * Provides accessible, customizable buttons with built-in support for loading and disabled states.
 * Includes full accessibility support for screen readers and proper visual feedback.
 * 
 * @param props - Button component props
 * @returns Rendered button component
 * 
 * @example
 * ```typescript
 * // Primary button
 * <Button label="Start" onPress={handleStart} />
 * 
 * // Danger button with loading
 * <Button
 *   label="Delete"
 *   variant="danger"
 *   loading={isDeleting}
 *   onPress={handleDelete}
 * />
 * 
 * // Outline button, disabled
 * <Button
 *   label="Cancel"
 *   variant="outline"
 *   disabled={true}
 * />
 * ```
 * 
 * @public
 */
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