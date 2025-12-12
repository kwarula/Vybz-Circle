import React from "react";
import { StyleSheet, View, Pressable, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { Message } from "@/data/mockData";

interface MessageCardProps {
  message: Message;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MessageCard({ message, onPress }: MessageCardProps) {
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
        { backgroundColor: theme.backgroundDefault, borderColor: theme.borderLight },
        animatedStyle,
      ]}
    >
      <View style={styles.avatarStack}>
        {message.members.slice(0, 2).map((member, index) => (
          <Image
            key={member.id}
            source={{ uri: member.avatar }}
            style={[
              styles.avatar,
              index > 0 && styles.avatarOverlap,
            ]}
          />
        ))}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="h4" numberOfLines={1} style={styles.title}>
            {message.crewName}
          </ThemedText>
          <ThemedText type="tiny" secondary>{message.timestamp}</ThemedText>
        </View>
        <ThemedText type="small" secondary numberOfLines={1}>
          {message.lastMessage}
        </ThemedText>
      </View>
      {message.unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: Colors.light.primary }]}>
          <ThemedText type="tiny" style={{ color: "#FFF", fontWeight: "600" }}>
            {message.unreadCount}
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatarStack: {
    flexDirection: "row",
    width: 56,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatarOverlap: {
    marginLeft: -16,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
});
