import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

export type PulsingCircleSize = number | 'small' | 'medium' | 'large';
export type PulsingCircleStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface PulsingCircleProps {
  active?: boolean;
  size?: PulsingCircleSize;
  color?: string;
  status?: PulsingCircleStatus;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const sizePresets = {
  small: 40,
  medium: 60,
  large: 80,
};

const statusColors: Record<PulsingCircleStatus, string> = {
  idle: '#9CA3AF',
  listening: '#10B981',
  processing: '#F59E0B',
  error: '#EF4444',
};

const getSize = (size: PulsingCircleSize): number => {
  if (typeof size === 'number') return size;
  return sizePresets[size];
};

export function PulsingCircle({
  active = false,
  size = 'medium',
  color,
  status = 'idle',
  accessibilityLabel,
  style,
}: PulsingCircleProps) {
  const circleSize = getSize(size);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (active) {
      // Start pulsing animation
      const pulseSequence = Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]);

      const loop = Animated.loop(pulseSequence);
      loop.start();

      return () => {
        loop.stop();
        // Reset animations
        pulseAnim.setValue(1);
        opacityAnim.setValue(0.3);
      };
    } else {
      // Reset to static state
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.3);
    }
  }, [active, pulseAnim, opacityAnim]);

  const circleColor = color || statusColors[status];

  return (
    <View
      testID="pulsing-circle"
      style={[
        styles.container,
        {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: circleColor,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Animated.View
        style={[
          styles.pulse,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: circleColor,
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});