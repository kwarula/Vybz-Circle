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
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected
            ? Colors.light.primary
            : theme.backgroundSecondary,
          borderColor: isSelected ? Colors.light.primary : theme.border,
        },
        animatedStyle,
        style,
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.label,
          { color: isSelected ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
      {count !== undefined ? (
        <ThemedText
          type="tiny"
          style={[
            styles.count,
            { color: isSelected ? "#FFFFFF" : theme.textSecondary },
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  label: {
    fontWeight: "500",
  },
  count: {
    fontWeight: "600",
  },
});
