import React from "react";
import { StyleSheet, Pressable, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface CategoryChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  count?: number;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryChip({
  label,
  isSelected,
  onPress,
  count,
  style,
}: CategoryChipProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  // Top-tier styling:
  // Active: Brand color pill with white text
  // Inactive: Dark/light gray pill with muted text (monochrome)
  const chipBackground = isSelected
    ? Colors.light.primary
    : isDark
      ? theme.backgroundSecondary
      : theme.backgroundTertiary;

  const chipBorder = isSelected
    ? Colors.light.primary
    : 'transparent';

  const textColor = isSelected
    ? "#FFFFFF"
    : theme.textSecondary; // Brighter gray for inactive

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        {
          backgroundColor: chipBackground,
          borderColor: chipBorder,
        },
        animatedStyle,
        style,
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.label,
          { color: textColor },
        ]}
      >
        {label}
      </ThemedText>
      {count !== undefined && count > 0 ? (
        <ThemedText
          type="tiny"
          style={[
            styles.count,
            {
              color: isSelected ? "rgba(255,255,255,0.7)" : theme.textMuted,
            },
          ]}
        >
          {count}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    // DOUBLED PADDING for breathing room
    paddingHorizontal: Spacing.xl,    // 24px (was 16px)
    paddingVertical: Spacing.md,      // 12px (was 8px)
    borderRadius: BorderRadius.full,
    borderWidth: 0,                   // No border for cleaner look
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "600",
  },
  count: {
    fontWeight: "500",
  },
});
