import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../../theme';

export type PulsingCircleSize = number | 'small' | 'medium' | 'large';
export type PulsingCircleStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface PulsingCircleProps {
  active?: boolean;
  size?: PulsingCircleSize;
  color?: string;
  status?: PulsingCircleStatus;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const sizePresets = {
  small: 60,
  medium: 100,
  large: 140,
};

/**
 * Status colors using Catppuccin Mocha palette
 */
const statusColors: Record<PulsingCircleStatus, string> = {
  idle: colors.status.idle,
  listening: colors.status.listening,
  processing: colors.status.processing,
  speaking: colors.status.speaking,
  error: colors.status.error,
};

const getSize = (size: PulsingCircleSize): number => {
  if (typeof size === 'number') return size;
  return sizePresets[size];
};

/**
 * Animated pulsing circle indicator
 * 
 * Visual feedback component that pulses when active.
 * Uses Catppuccin Mocha colors for different states.
 * 
 * @param props - Component props
 * @returns Animated circle component
 * 
 * @public
 */
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
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      // Pulse animation with glow effect
      const pulseSequence = Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ]);

      const loop = Animated.loop(pulseSequence);
      loop.start();

      return () => {
        loop.stop();
        pulseAnim.setValue(1);
        opacityAnim.setValue(0.4);
        glowAnim.setValue(0);
      };
    } else {
      // Reset to static state
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.4);
      glowAnim.setValue(0);
    }
  }, [active, pulseAnim, opacityAnim, glowAnim]);

  const circleColor = color || statusColors[status];

  // Calculate glow size
  const glowSize = circleSize * 1.5;

  return (
    <View
      testID="pulsing-circle"
      style={[
        styles.wrapper,
        { width: glowSize, height: glowSize },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: circleColor,
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      
      {/* Inner circle */}
      <View
        style={[
          styles.circle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: circleColor,
          },
        ]}
      >
        {/* Inner highlight */}
        <View
          style={[
            styles.highlight,
            {
              width: circleSize * 0.6,
              height: circleSize * 0.6,
              borderRadius: (circleSize * 0.6) / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  highlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: -10,
  },
});
