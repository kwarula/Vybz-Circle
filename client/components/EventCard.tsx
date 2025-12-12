import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import type { Event, User } from "@/data/mockData";

interface EventCardProps {
  event: Event;
  onPress: () => void;
  variant?: "full" | "compact" | "map";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EventCard({ event, onPress, variant = "full" }: EventCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const [isGoing, setIsGoing] = useState(event.isGoing);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const toggleGoing = () => {
    setIsGoing(!isGoing);
  };

  if (variant === "map") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.mapCard,
          { backgroundColor: theme.backgroundDefault },
          Shadows.card,
          animatedStyle,
        ]}
      >
        <Image source={{ uri: event.imageUrl }} style={styles.mapImage} />
        <View style={styles.mapContent}>
          <ThemedText type="h4" numberOfLines={1}>{event.title}</ThemedText>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={12} color={theme.textSecondary} />
            <ThemedText type="tiny" secondary>{event.date}</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText type="tiny" secondary numberOfLines={1}>{event.venue}</ThemedText>
          </View>
          <View style={styles.mapActions}>
            <Pressable style={[styles.actionBtn, styles.outlineBtn, { borderColor: theme.border }]}>
              <ThemedText type="small" style={{ fontWeight: "600" }}>Next time</ThemedText>
            </Pressable>
            <Pressable
              onPress={toggleGoing}
              style={[
                styles.actionBtn,
                styles.primaryBtn,
                { backgroundColor: isGoing ? theme.going : Colors.light.primary },
              ]}
            >
              <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
                {isGoing ? "Going" : "Join"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  if (variant === "compact") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.compactCard,
          { backgroundColor: theme.backgroundDefault },
          Shadows.card,
          animatedStyle,
        ]}
      >
        <Image source={{ uri: event.imageUrl }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <ThemedText type="h4" numberOfLines={1}>{event.title}</ThemedText>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText type="tiny" secondary numberOfLines={1}>{event.venue}</ThemedText>
          </View>
          <ThemedText type="tiny" secondary>Rate {event.rating}/5</ThemedText>
        </View>
      </AnimatedPressable>
    );
  }

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
      <View style={styles.organizerRow}>
        <Image source={{ uri: event.organizer.avatar }} style={styles.organizerAvatar} />
        <View style={styles.organizerInfo}>
          <ThemedText type="small" style={{ fontWeight: "600" }}>{event.organizer.name}</ThemedText>
          <ThemedText type="tiny" secondary>{event.date} - {event.time}</ThemedText>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: event.imageUrl }} style={styles.image} />
        {event.isPremium ? (
          <View style={[styles.premiumBadge, { backgroundColor: Colors.light.primary }]}>
            <ThemedText type="tiny" style={{ color: "#FFF", fontWeight: "600" }}>Premium</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <ThemedText type="h3" numberOfLines={2}>{event.title}</ThemedText>
        
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText type="small" secondary>{event.venue}, {event.location}</ThemedText>
        </View>

        <View style={styles.footer}>
          <View style={styles.attendees}>
            <View style={styles.avatarStack}>
              {[1, 2, 3].map((i, index) => (
                <Image
                  key={i}
                  source={{ uri: `https://i.pravatar.cc/150?img=${i + 10}` }}
                  style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -8 : 0 }]}
                />
              ))}
            </View>
            <ThemedText type="tiny" secondary>{event.attendees} members</ThemedText>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, styles.outlineBtn, { borderColor: theme.border }]}>
              <ThemedText type="small" style={{ fontWeight: "600" }}>Next time</ThemedText>
            </Pressable>
            <Pressable
              onPress={toggleGoing}
              style={[
                styles.actionBtn,
                styles.primaryBtn,
                { backgroundColor: isGoing ? theme.going : Colors.light.primary },
              ]}
            >
              <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
                {isGoing ? "Going" : "Join"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
  },
  organizerInfo: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 200,
  },
  premiumBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  attendees: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatarStack: {
    flexDirection: "row",
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtn: {
    borderWidth: 1,
  },
  primaryBtn: {},
  compactCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  compactContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: Spacing.xs,
  },
  mapCard: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    width: 240,
  },
  mapImage: {
    width: "100%",
    height: 100,
  },
  mapContent: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  mapActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
