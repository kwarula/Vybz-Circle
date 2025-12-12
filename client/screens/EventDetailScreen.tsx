import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows, Gradients } from "@/constants/theme";
import { mockEvents } from "@/data/mockData";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type EventDetailRouteProp = RouteProp<RootStackParamList, "EventDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EventDetailRouteProp>();
  const { theme } = useTheme();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("regular");

  const event = mockEvents.find((e) => e.id === route.params.eventId) || mockEvents[0];

  const ticketTiers = [
    { id: "early", name: "Early Bird", price: event.price * 0.8, available: 50 },
    { id: "regular", name: "Regular", price: event.price, available: 200 },
    { id: "vip", name: "VIP", price: event.price * 2, available: 20 },
  ];

  const handleClose = () => {
    navigation.goBack();
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.heroImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.heroGradient}
          />
          <View style={[styles.headerButtons, { top: insets.top + Spacing.md }]}>
            <Pressable
              onPress={handleClose}
              style={[styles.iconButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            >
              <Feather name="x" size={24} color="#FFF" />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            >
              <Feather name="share" size={20} color="#FFF" />
            </Pressable>
          </View>
          {event.isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: Colors.light.primary }]}>
              <ThemedText type="tiny" style={{ color: "#FFF", fontWeight: "600" }}>Premium</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <ThemedText type="hero">{event.title}</ThemedText>
          
          <View style={styles.infoCards}>
            <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="calendar" size={20} color={Colors.light.primary} />
              </View>
              <View>
                <ThemedText type="small" style={{ fontWeight: "600" }}>{event.date}</ThemedText>
                <ThemedText type="tiny" secondary>{event.time}</ThemedText>
              </View>
            </View>
            <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="map-pin" size={20} color={Colors.light.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="small" style={{ fontWeight: "600" }}>{event.venue}</ThemedText>
                <ThemedText type="tiny" secondary numberOfLines={1}>{event.location}</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>About</ThemedText>
            <ThemedText type="body" secondary>{event.description}</ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>Organizer</ThemedText>
            <View style={[styles.organizerCard, { backgroundColor: theme.backgroundDefault }]}>
              <Avatar uri={event.organizer.avatar} size={48} />
              <View style={{ flex: 1 }}>
                <ThemedText type="h4">{event.organizer.name}</ThemedText>
                <ThemedText type="tiny" secondary>Event Organizer</ThemedText>
              </View>
              <Pressable style={[styles.followButton, { borderColor: Colors.light.primary }]}>
                <ThemedText type="small" style={{ color: Colors.light.primary, fontWeight: "600" }}>Follow</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>Select Tickets</ThemedText>
            {ticketTiers.map((tier) => (
              <Pressable
                key={tier.id}
                onPress={() => setSelectedTier(tier.id)}
                style={[
                  styles.ticketTier,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: selectedTier === tier.id ? Colors.light.primary : theme.border,
                    borderWidth: selectedTier === tier.id ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.ticketTierContent}>
                  <View>
                    <ThemedText type="h4">{tier.name}</ThemedText>
                    <ThemedText type="tiny" secondary>{tier.available} tickets left</ThemedText>
                  </View>
                  <ThemedText type="h3" style={{ color: Colors.light.primary }}>
                    {tier.price === 0 ? "Free" : `KES ${tier.price.toLocaleString()}`}
                  </ThemedText>
                </View>
                {selectedTier === tier.id ? (
                  <View style={[styles.checkmark, { backgroundColor: Colors.light.primary }]}>
                    <Feather name="check" size={14} color="#FFF" />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>Attendees</ThemedText>
            <View style={styles.attendeesRow}>
              <View style={styles.avatarStack}>
                {[1, 2, 3, 4, 5].map((i, index) => (
                  <Image
                    key={i}
                    source={{ uri: `https://i.pravatar.cc/150?img=${i + 10}` }}
                    style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -12 : 0 }]}
                  />
                ))}
              </View>
              <ThemedText type="body">
                <ThemedText type="body" style={{ fontWeight: "600" }}>{event.attendees}</ThemedText>
                <ThemedText type="body" secondary> people going</ThemedText>
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          onPress={toggleWishlist}
          style={[styles.wishlistButton, { borderColor: theme.border }]}
        >
          <Feather
            name={isWishlisted ? "heart" : "heart"}
            size={24}
            color={isWishlisted ? Colors.light.error : theme.text}
          />
        </Pressable>
        <Pressable style={styles.ctaButton}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <ThemedText type="h4" style={{ color: "#FFF" }}>Get Tickets</ThemedText>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    position: "relative",
    height: 300,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerButtons: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBadge: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  infoCards: {
    gap: Spacing.md,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  organizerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  ticketTier: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    position: "relative",
  },
  ticketTierContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkmark: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  attendeesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarStack: {
    flexDirection: "row",
  },
  attendeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  wishlistButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
  },
  ctaGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
