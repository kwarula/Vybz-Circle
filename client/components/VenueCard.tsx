import React from "react";
import { StyleSheet, View, Pressable, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { Venue } from "@/data/mockData";

interface VenueCardProps {
  venue: Venue;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VenueCard({ venue, onPress }: VenueCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
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
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <Image source={{ uri: venue.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <ThemedText type="h4" numberOfLines={1}>{venue.name}</ThemedText>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={12} color={theme.textSecondary} />
          <ThemedText type="tiny" secondary numberOfLines={1} style={styles.address}>
            {venue.address}
          </ThemedText>
        </View>
        <ThemedText type="tiny" secondary>
          Rate <ThemedText type="tiny" style={{ fontWeight: "700" }}>{venue.rating}/5</ThemedText>
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  image: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  address: {
    flex: 1,
  },
});
