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
import { s, ms, vs, fs } from "@/utils/responsive";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows, Gradients, Typography } from "@/constants/theme";
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
    scale.value = withSpring(0.95, { damping: 10, stiffness: 200 }); // "Pop" out feel
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const toggleGoing = (e?: any) => {
    e?.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGoing(!isGoing);
  };

  const StickerTag = ({ label, color, icon, style }: any) => (
    <View style={[styles.stickerTag, { backgroundColor: color || sunsetOrange }, style, Shadows.sticker]}>
      {icon && <Feather name={icon} size={12} color="#0A1B1B" />}
      <ThemedText style={styles.stickerText}>{label}</ThemedText>
    </View>
  );

  // =============================================
  // IMMERSIVE VARIANT - HERO TICKETS
  // =============================================
  if (variant === "immersive") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.immersiveCard, animatedStyle]}
      >
        <Image source={{ uri: event.imageUrl }} style={styles.immersiveImage} resizeMode="cover" />
        <LinearGradient
          colors={Gradients.cardOverlay}
          style={styles.immersiveGradient}
        />

        <View style={styles.immersiveContent}>
          {/* Overlapping Tags */}
          <View style={styles.tagLayer}>
            <StickerTag
              label={event.category || 'VIBE'}
              color={brightTurquoise}
              style={{ transform: [{ rotate: '-2deg' }] }}
            />
            {event.isPremium && (
              <StickerTag
                label="PREMIUM"
                color={sunsetOrange}
                icon="star"
                style={{ marginLeft: -10, transform: [{ rotate: '3deg' }], marginTop: 5 }}
              />
            )}
          </View>

          <ThemedText style={styles.immersiveTitle} numberOfLines={2}>
            {event.title}
          </ThemedText>

          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color="#FFF" />
              <ThemedText style={styles.metaText}>{event.date}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={14} color="#FFF" />
              <ThemedText style={styles.metaText} numberOfLines={1}>{event.venue}</ThemedText>
            </View>
          </View>

          {/* New Facepile */}
          <View style={styles.socialProof}>
            <View style={styles.faceStack}>
              {[1, 2, 3].map((i, index) => (
                <View key={i} style={[styles.faceRing, { borderColor: index % 2 === 0 ? electricBerry : brightTurquoise, marginLeft: index > 0 ? -15 : 0 }]}>
                  <Image
                    source={{ uri: `https://i.pravatar.cc/150?img=${i + 15}` }}
                    style={styles.face}
                  />
                </View>
              ))}
            </View>
            <ThemedText style={styles.socialText}>+{event.attendees} joining</ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  // =============================================
  // FULL VARIANT - POSTER STYLE
  // =============================================
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.posterCard, animatedStyle, Shadows.card]}
    >
      <View style={styles.posterImageContainer}>
        <Image source={{ uri: event.imageUrl }} style={styles.posterImage} resizeMode="cover" />
        <StickerTag
          label={event.category}
          color={electricBerry}
          style={styles.floatingSticker}
        />
      </View>

      <View style={styles.posterContent}>
        <ThemedText style={styles.posterTitle} numberOfLines={2}>{event.title}</ThemedText>

        <View style={styles.posterMeta}>
          <ThemedText style={styles.posterMetaText}>{event.date} • {event.venue}</ThemedText>
        </View>

        <View style={styles.posterFooter}>
          <View style={styles.socialProof}>
            <View style={styles.miniFaceStack}>
              {[1, 2].map((i, index) => (
                <Image
                  key={i}
                  source={{ uri: `https://i.pravatar.cc/150?img=${i + 40}` }}
                  style={[styles.miniFace, { marginLeft: index > 0 ? -8 : 0 }]}
                />
              ))}
            </View>
            <ThemedText style={styles.miniSocialText}>+{event.attendees}</ThemedText>
          </View>

          <Pressable
            onPress={toggleGoing}
            style={[
              styles.posterAction,
              { backgroundColor: isGoing ? 'transparent' : sunsetOrange, borderColor: sunsetOrange, borderWidth: 2 }
            ]}
          >
            <ThemedText style={[styles.actionText, { color: isGoing ? sunsetOrange : '#0A1B1B' }]}>
              {isGoing ? "GOT TIX ✓" : "GRAB TIX"}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const sunsetOrange = "#FF5F00";
const electricBerry = "#FF007A";
const brightTurquoise = "#00F0FF";

const styles = StyleSheet.create({
  // Sticker UI
  stickerTag: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  stickerText: {
    color: '#0A1B1B',
    fontWeight: '900',
    fontSize: fs(12),
    textTransform: 'uppercase',
  },

  // Immersive
  immersiveCard: {
    width: s(300),
    height: vs(440),
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginRight: Spacing.xl,
    backgroundColor: '#0A1B1B',
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
    gap: 12,
  },
  tagLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  immersiveTitle: {
    color: "#FFFFFF",
    fontSize: fs(32),
    fontWeight: '900',
    lineHeight: fs(36),
    letterSpacing: -1,
  },
  metaSection: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#EAEAEA',
    fontSize: 14,
    fontWeight: '700',
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  faceStack: {
    flexDirection: 'row',
  },
  faceRing: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    borderWidth: 3,
    padding: 2,
    backgroundColor: '#0A1B1B',
  },
  face: {
    width: '100%',
    height: '100%',
    borderRadius: ms(20),
  },
  socialText: {
    color: brightTurquoise,
    fontWeight: '900',
    fontSize: fs(14),
    textTransform: 'uppercase',
  },

  // Poster Style
  posterCard: {
    borderRadius: 4, // Sharp corners for poster look
    backgroundColor: '#152A2A',
    marginBottom: Spacing["2xl"],
    padding: 12,
  },
  posterImageContainer: {
    height: vs(220),
    width: "100%",
    backgroundColor: '#000',
    borderRadius: 2,
    overflow: 'hidden',
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  floatingSticker: {
    position: 'absolute',
    top: ms(12),
    right: ms(12),
    transform: [{ rotate: '5deg' }],
  },
  posterContent: {
    paddingVertical: ms(16),
    paddingHorizontal: ms(4),
  },
  posterTitle: {
    fontSize: fs(26),
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    lineHeight: fs(28),
  },
  posterMeta: {
    marginTop: 8,
  },
  posterMetaText: {
    color: brightTurquoise,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  posterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  miniFaceStack: {
    flexDirection: 'row',
  },
  miniFace: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#152A2A',
  },
  miniSocialText: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },
  posterAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  actionText: {
    fontWeight: '900',
    fontSize: 14,
  },
});
