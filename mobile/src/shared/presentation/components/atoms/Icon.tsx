import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export type IconName = 
  | 'mic' 
  | 'mic-off' 
  | 'camera' 
  | 'repeat' 
  | 'help' 
  | 'stop' 
  | 'volume-up' 
  | 'volume-off';

export type IconSize = number | 'small' | 'medium' | 'large';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const iconSizes = {
  small: 16,
  medium: 24,
  large: 32,
};

const getIconSize = (size: IconSize): number => {
  if (typeof size === 'number') return size;
  return iconSizes[size];
};

// Simple icon representations using Unicode characters
const iconCharacters: Record<IconName, string> = {
  'mic': '🎤',
  'mic-off': '🔇',
  'camera': '📷',
  'repeat': '🔄',
  'help': '❓',
  'stop': '⏹',
  'volume-up': '🔊',
  'volume-off': '🔈',
};

export function Icon({
  name,
  size = 'medium',
  color = '#1F2937',
  accessibilityLabel,
  style,
}: IconProps) {
  const iconSize = getIconSize(size);
  const character = iconCharacters[name];

  return (
    <View
      testID={`icon-${name}`}
      style={[
        styles.container,
        {
          width: iconSize,
          height: iconSize,
          fontSize: iconSize * 0.8,
          color,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {character}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});