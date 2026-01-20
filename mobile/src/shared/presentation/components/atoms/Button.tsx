import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../../theme';

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

/**
 * Variant styles using Catppuccin Mocha palette
 */
const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.interactive.primary,
  },
  secondary: {
    backgroundColor: colors.interactive.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.interactive.primary,
  },
  danger: {
    backgroundColor: colors.interactive.danger,
  },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
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
    color: colors.background.primary,
    fontWeight: '600',
  },
  secondary: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  outline: {
    color: colors.interactive.primary,
    fontWeight: '600',
  },
  danger: {
    color: colors.background.primary,
    fontWeight: '600',
  },
};

const textSizeStyles: Record<ButtonSize, TextStyle> = {
  small: {
    fontSize: 14,
  },
  medium: {
    fontSize: 16,
  },
  large: {
    fontSize: 18,
  },
};

/**
 * Reusable button component with Catppuccin Mocha styling
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
  const spinnerColor = variant === 'outline' 
    ? colors.interactive.primary 
    : colors.background.primary;

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
          color={spinnerColor}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            textVariantStyles[variant],
            textSizeStyles[size],
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
    borderRadius: 12,
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
