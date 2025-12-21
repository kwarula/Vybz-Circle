import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows, Gradients } from "@/constants/theme";
import type { Event } from "@/data/mockData";

interface EventCardProps {
  event: Event;
  onPress: () => void;
  variant?: "full" | "compact" | "map" | "immersive";
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
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const toggleGoing = (e?: any) => {
    e?.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGoing(!isGoing);
  };

  // =============================================
  // IMMERSIVE VARIANT - HERO CARDS (Airbnb-style)
  // =============================================
  if (variant === "immersive") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.immersiveCard, animatedStyle]}
      >
        {/* CLEAN IMAGE - No floating UI */}
        <Image source={{ uri: event.imageUrl }} style={styles.immersiveImage} resizeMode="cover" />

        {/* STRONG GRADIENT at bottom for text */}
        <LinearGradient
          colors={Gradients.cardOverlay}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.immersiveGradient}
        />

        {/* CONTENT - All at bottom */}
        <View style={styles.immersiveContent}>
          {/* Category + Premium as subtle pills */}
          <View style={styles.tagRow}>
            <View style={[styles.tagPill, { borderColor: 'rgba(255,255,255,0.3)' }]}>
              <ThemedText type="tiny" style={{ color: '#FFF', fontWeight: '500' }}>
                {event.category || 'Event'}
              </ThemedText>
            </View>
            {event.isPremium && (
              <View style={[styles.tagPill, styles.premiumTag]}>
                <Feather name="star" size={10} color={Colors.light.primary} />
                <ThemedText type="tiny" style={{ color: Colors.light.primary, fontWeight: '600' }}>
                  Premium
                </ThemedText>
              </View>
            )}
          </View>

          {/* TITLE - Large and bold */}
          <ThemedText type="h1" style={styles.immersiveTitle} numberOfLines={2}>
            {event.title}
          </ThemedText>

          {/* METADATA - Clean row */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color="#B3B3B3" />
              <ThemedText type="small" style={{ color: '#B3B3B3' }}>{event.date}</ThemedText>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={14} color="#B3B3B3" />
              <ThemedText type="small" style={{ color: '#B3B3B3' }} numberOfLines={1}>{event.venue}</ThemedText>
            </View>
          </View>

          {/* ATTENDEES - Subtle */}
          <View style={styles.attendeeRow}>
            <View style={styles.avatarStack}>
              {[1, 2, 3].map((i, index) => (
                <Image
                  key={i}
                  source={{ uri: `https://i.pravatar.cc/150?img=${i + 20}` }}
                  style={[styles.miniAvatar, { marginLeft: index > 0 ? -8 : 0 }]}
                />
              ))}
            </View>
            <ThemedText type="tiny" style={{ color: '#737373' }}>
              +{event.attendees} going
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  // =============================================
  // MAP VARIANT
  // =============================================
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
        <Image source={{ uri: event.imageUrl }} style={styles.mapImage} resizeMode="cover" />
        <View style={styles.mapContent}>
          <ThemedText type="h4" numberOfLines={1}>{event.title}</ThemedText>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={12} color={theme.textSecondary} />
            <ThemedText type="tiny" secondary>{event.date} • {event.time}</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText type="tiny" secondary numberOfLines={1}>{event.venue}</ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  // =============================================
  // COMPACT VARIANT
  // =============================================
  if (variant === "compact") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.compactCard,
          { backgroundColor: theme.backgroundDefault },
          Shadows.subtle,
          animatedStyle,
        ]}
      >
        <Image source={{ uri: event.imageUrl }} style={styles.compactImage} resizeMode="cover" />
        <View style={styles.compactContent}>
          <ThemedText type="h4" numberOfLines={1}>{event.title}</ThemedText>
          <ThemedText type="small" secondary numberOfLines={1}>{event.venue}</ThemedText>
          <View style={[styles.metaRow, { marginTop: 6 }]}>
            <Feather name="calendar" size={12} color={theme.textMuted} />
            <ThemedText type="tiny" style={{ color: theme.textMuted }}>{event.date}</ThemedText>
          </View>
        </View>
        {isGoing && (
          <View style={styles.goingIndicator}>
            <Feather name="check" size={12} color={Colors.light.success} />
          </View>
        )}
      </AnimatedPressable>
    );
  }

  // =============================================
  // FULL VARIANT - Clean Airbnb-style
  // =============================================
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      {/* CLEAN IMAGE - No overlays */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: event.imageUrl }} style={styles.image} resizeMode="cover" />
      </View>

      {/* METADATA BELOW IMAGE */}
      <View style={[styles.content, { backgroundColor: theme.backgroundDefault }]}>
        {/* Category + Premium row */}
        <View style={styles.cardTagRow}>
          <ThemedText type="tiny" style={{ color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            {event.category}
          </ThemedText>
          {event.isPremium && (
            <View style={[styles.premiumBadge, { borderColor: Colors.light.primary }]}>
              <Feather name="star" size={10} color={Colors.light.primary} />
              <ThemedText type="tiny" style={{ color: Colors.light.primary }}>Premium</ThemedText>
            </View>
          )}
        </View>

        {/* Title */}
        <ThemedText type="h3" numberOfLines={2} style={{ marginTop: 6 }}>{event.title}</ThemedText>

        {/* Date + Venue */}
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" secondary>{event.date} • {event.time}</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText type="small" secondary numberOfLines={1}>{event.venue}</ThemedText>
          </View>
        </View>

        {/* Footer - Attendees + Action */}
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.attendees}>
            <View style={styles.avatarStack}>
              {[1, 2, 3].map((i, index) => (
                <Image
                  key={i}
                  source={{ uri: `https://i.pravatar.cc/150?img=${i + 20}` }}
                  style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -10 : 0, borderColor: theme.backgroundDefault }]}
                />
              ))}
            </View>
            <ThemedText type="tiny" secondary>+{event.attendees - 3} going</ThemedText>
          </View>

          <Pressable
            onPress={toggleGoing}
            style={[
              styles.actionButton,
              isGoing
                ? { backgroundColor: theme.backgroundSecondary }
                : { backgroundColor: Colors.light.primary }
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: isGoing ? theme.text : "#FFF",
                fontWeight: "600"
              }}
            >
              {isGoing ? "Going ✓" : "Join"}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Common
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarStack: {
    flexDirection: 'row',
  },

  // =============================================
  // IMMERSIVE STYLES
  // =============================================
  immersiveCard: {
    width: 300,
    height: 420,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    marginRight: Spacing.lg,
    backgroundColor: '#000',
  },
  immersiveImage: {
    width: "100%",
    height: "100%",
    position: 'absolute',
  },
  immersiveGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  immersiveContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumTag: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderColor: Colors.light.primary,
  },
  immersiveTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#737373',
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
  },

  // =============================================
  // MAP STYLES
  // =============================================
  mapCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    width: 260,
    marginBottom: Spacing.sm,
  },
  mapImage: {
    width: "100%",
    height: 130,
  },
  mapContent: {
    padding: Spacing.lg,
    gap: 6,
  },

  // =============================================
  // COMPACT STYLES
  // =============================================
  compactCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
    height: 100,
  },
  compactImage: {
    width: 100,
    height: "100%",
  },
  compactContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "center",
    gap: 4,
  },
  goingIndicator: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =============================================
  // FULL CARD STYLES
  // =============================================
  card: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing["2xl"],
    ...Shadows.card,
  },
  imageContainer: {
    height: 200,
    width: "100%",
    backgroundColor: '#1A1A1A',
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: Spacing.xl,
  },
  cardTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cardMeta: {
    marginTop: Spacing.md,
    gap: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attendeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
});
