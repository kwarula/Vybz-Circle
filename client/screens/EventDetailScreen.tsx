import React, { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { View, StyleSheet, ScrollView, Pressable, Image, Dimensions, Share, StatusBar, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { GlassView } from "@/components/GlassView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows, Gradients } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type EventDetailRouteProp = RouteProp<RootStackParamList, "EventDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EventDetailRouteProp>();
  const { theme, isDark } = useTheme();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("regular");

  // Adapter to transform Backend Event to UI Event
  const adaptEvent = (beEvent: any): any => ({
    ...beEvent,
    imageUrl: beEvent.image_url || beEvent.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
    organizer: beEvent.organizer || {
      id: beEvent.organizer_id || "1",
      name: beEvent.organizer_name || "Event Organizer",
      avatar: "https://i.pravatar.cc/150?img=12"
    },
    price: beEvent.min_price || beEvent.price || 0,
    venue: beEvent.venue_name || beEvent.location?.name || "TBD",
    location: beEvent.location?.city || beEvent.location?.name || "Nairobi",
    date: beEvent.starts_at
      ? new Date(beEvent.starts_at).toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : beEvent.date || "TBD",
    time: beEvent.starts_at
      ? new Date(beEvent.starts_at).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
      : beEvent.time || "TBD",
  });

  // Fetch event from API
  const { data: rawEvent, isLoading } = useQuery({
    queryKey: ['api', 'events', route.params.eventId],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest('GET', queryKey.join('/'));
      const data = await res.json();
      return adaptEvent(data);
    }
  });

  if (isLoading || !rawEvent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const event = rawEvent;

  const ticketTiers = [
    { id: "early", name: "Early Bird", price: event.price * 0.8, available: 50 },
    { id: "regular", name: "Regular", price: event.price, available: 200 },
    { id: "vip", name: "VIP", price: event.price * 2, available: 20 },
  ];

  const handleClose = () => {
    navigation.goBack();
  };

  const toggleWishlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: event.title,
        message: `Check out ${event.title} at ${event.venue} on ${event.date}! 🎉`,
      });
    } catch (error) {
      // User cancelled share
    }
  };

  const handleGetTickets = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Check if this is an external event from a scraped platform
    if (event.is_external || event.source_url) {
      try {
        // Get current user if available
        const { data: { session } } = await supabase.auth.getSession();

        // Track the click before redirecting
        const response = await apiRequest('POST', `api/events/${event.id}/track-click`, {
          userId: session?.user?.id,
          source: 'detail_screen',
          deviceInfo: { platform: Platform.OS }
        });

        const data = await response.json();
        // @ts-ignore
        const ticketUrl = data.ticketUrl || event.source_url;

        if (ticketUrl) {
          await WebBrowser.openBrowserAsync(ticketUrl, {
            toolbarColor: '#000000',
            controlsColor: Colors.light.primary,
            showTitle: true
          });
        }
      } catch (error) {
        console.error('Failed to track click or open browser:', error);
        // Fallback: just try to open the URL directly if tracking fails
        // @ts-ignore
        if (event.source_url) {
          // @ts-ignore
          await WebBrowser.openBrowserAsync(event.source_url);
        }
      }
    } else {
      // Internal event - go to checkout
      const selectedTierData = ticketTiers.find((t) => t.id === selectedTier);
      navigation.navigate("Checkout", {
        event: event,
        tier: selectedTierData as any
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={Gradients.cardOverlay}
            locations={[0, 0.3, 0.6, 1]}
            style={styles.heroGradient}
          />

          {/* FLOATING CONTROLS */}
          <View style={[styles.headerButtons, { top: insets.top + Spacing.md }]}>
            <Pressable onPress={handleClose} style={styles.glassBtn}>
              <Feather name="arrow-left" size={20} color="#FFF" />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={toggleWishlist} style={styles.glassBtn}>
                <Feather
                  name="heart"
                  size={20}
                  color={isWishlisted ? Colors.light.error : "#FFF"}
                />
              </Pressable>
              <Pressable onPress={handleShare} style={styles.glassBtn}>
                <Feather name="share" size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* CONTENT SHEET */}
        <View style={[styles.contentContainer, { backgroundColor: theme.backgroundRoot }]}>
          {/* Category + Premium */}
          <View style={styles.tagRow}>
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

          <ThemedText type="hero" style={{ marginTop: Spacing.sm }} numberOfLines={0}>{event.title}</ThemedText>

          {/* KEY DETAILS */}
          <View style={styles.keyDetails}>
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="calendar" size={18} color={Colors.light.primary} />
              </View>
              <View>
                <ThemedText type="body" style={{ fontWeight: '600' }}>{event.date}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{event.time}</ThemedText>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="map-pin" size={18} color={Colors.light.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>{event.venue}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{event.location}</ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* ABOUT */}
          <View style={styles.section}>
            <ThemedText type="h3">About</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, lineHeight: 24, marginTop: Spacing.md }}>
              {event.description}
            </ThemedText>
          </View>

          {/* ORGANIZER */}
          <View style={styles.section}>
            <ThemedText type="h3">Organizer</ThemedText>
            <View style={[styles.organizerCard, { backgroundColor: theme.backgroundDefault }]}>
              <Avatar uri={event.organizer.avatar} size={48} />
              <View style={{ flex: 1 }}>
                <ThemedText type="h4">{event.organizer.name}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Feather name="check-circle" size={12} color={Colors.light.success} />
                  <ThemedText type="tiny" style={{ color: theme.textMuted, marginLeft: 4 }}>Verified</ThemedText>
                </View>
              </View>
              <Pressable style={[styles.followBtn, { backgroundColor: Colors.light.primaryMuted }]}>
                <ThemedText type="small" style={{ color: Colors.light.primary, fontWeight: '600' }}>Follow</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* TICKETS - Only show for internal events */}
          {/* @ts-ignore */}
          {!(event.is_external || event.source_url) && (
            <View style={styles.section}>
              <ThemedText type="h3">Select Ticket</ThemedText>
              <View style={{ gap: 12, marginTop: Spacing.lg }}>
                {ticketTiers.map(tier => (
                  <Pressable
                    key={tier.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedTier(tier.id);
                    }}
                    style={[
                      styles.ticketCard,
                      {
                        backgroundColor: theme.backgroundDefault,
                        borderColor: selectedTier === tier.id ? Colors.light.primary : theme.border
                      },
                      selectedTier === tier.id && { borderWidth: 2 }
                    ]}
                  >
                    <View>
                      <ThemedText type="h4">{tier.name}</ThemedText>
                      <ThemedText type="tiny" style={{ color: theme.textMuted }}>{tier.available} left</ThemedText>
                    </View>
                    <ThemedText type="h3" style={{ color: Colors.light.primary }}>
                      KES {tier.price.toLocaleString()}
                    </ThemedText>
                    {selectedTier === tier.id && (
                      <View style={styles.checkBadge}>
                        <Feather name="check" size={12} color="#FFF" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* External Platform Info */}
          {/* @ts-ignore */}
          {(event.is_external || event.source_url) && (
            <View style={styles.section}>
              <View style={[styles.externalInfoCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <Feather name="external-link" size={24} color={Colors.light.primary} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="h4">External Booking</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    This event is listed on an external platform. You'll be redirected to complete your purchase.
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FLOATING FOOTER */}
      <Animated.View
        entering={FadeInUp.delay(400)}
        style={[styles.floatFooter, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }]}
      >
        <View style={styles.footerContent}>
          <View>
            <ThemedText type="tiny" style={{ color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
              {/* @ts-ignore */}
              {(event.is_external || event.source_url) ? "Starting at" : "Total"}
            </ThemedText>
            <ThemedText type="h2" style={{ color: Colors.light.primary }}>
              {/* @ts-ignore */}
              {(event.is_external || event.source_url)
                // @ts-ignore
                ? (event.price_range || `KES ${event.price?.toLocaleString() || '0'}`)
                : `KES ${ticketTiers.find(t => t.id === selectedTier)?.price.toLocaleString()}`
              }
            </ThemedText>
          </View>
          <Pressable
            onPress={handleGetTickets}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: Colors.light.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
          >
            {/* @ts-ignore */}
            <ThemedText type="h4" style={{ color: "#FFF" }}>{(event.is_external || event.source_url) ? "Book Now" : "Get Tickets"}</ThemedText>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </Pressable>
        </View>
      </Animated.View>
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
    height: 400,
    width: '100%',
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerButtons: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
  },
  tagRow: {
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
  },
  keyDetails: {
    marginTop: Spacing["2xl"],
    gap: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: Spacing["2xl"],
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  ticketCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  floatFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    ...Shadows.cardHover,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
  },
  externalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
});
