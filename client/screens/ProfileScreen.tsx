import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Image, Alert, RefreshControl, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { currentUser } from "@/data/mockData";
import { useEvents } from "@/hooks/useEvents";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


// Helper to parse event date string to Date object
const parseEventDate = (dateStr: string): Date => {
  const cleaned = dateStr.replace(/^[A-Za-z]+,\s*/, '');
  return new Date(cleaned);
};

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get user's events from API
  const { data: allEvents = [], refetch } = useEvents();
  const myEvents = allEvents.filter((e: any) => e.isGoing);

  // Filter by tab
  const displayedEvents = myEvents.filter((event) => {
    const eventDate = parseEventDate(event.date);
    if (activeTab === "upcoming") return eventDate >= today;
    if (activeTab === "past") return eventDate < today;
    return true;
  });

  const stats = [
    { label: "Events", value: myEvents.length.toString() },
    { label: "Vibe Score", value: "98" },
    { label: "Rank", value: "Top 5%" },
  ];

  const menuItems = [
    { icon: "credit-card", label: "Wallet", value: "KES 2,500", screen: null },
    { icon: "tag", label: "My Tickets", value: "3", screen: "MyTickets" },
    { icon: "award", label: "Achievements", value: "New", screen: null },
    { icon: "shield", label: "Admin Dashboard", value: null, screen: "AdminDashboard" },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMenuPress = (label: string, screen: string | null) => {
    Haptics.selectionAsync();
    if (screen) {
      navigation.navigate(screen as any);
    } else {
      Alert.alert(label, "This feature is coming soon! 🚀");
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
        }
      >
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <ThemedText type="h2">Profile</ThemedText>
          <Pressable
            style={styles.settingsButton}
            onPress={() => handleMenuPress("Settings", null)}
          >
            <Feather name="settings" size={22} color={theme.text} />
          </Pressable>
        </View>

        {/* PROFILE INFO */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarRing, { borderColor: Colors.light.primary }]}>
              <Avatar uri={currentUser.avatar} size={100} />
            </View>
            <Pressable style={styles.editButton}>
              <Feather name="edit-2" size={12} color="#FFF" />
            </Pressable>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <ThemedText type="h1" style={styles.userName}>{currentUser.name}</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              @vince_creator • Nairobi, Kenya
            </ThemedText>
          </View>

          {/* STATS */}
          <View style={styles.statsContainer}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <ThemedText type="h2" style={{ color: Colors.light.primary, fontSize: 28 }}>
                  {stat.value}
                </ThemedText>
                <ThemedText
                  type="tiny"
                  style={{
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontSize: 11,
                    marginTop: 2
                  }}
                >
                  {stat.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* MENU CARDS */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => handleMenuPress(item.label, item.screen)}
                style={({ pressed }) => [
                  styles.menuCard,
                  { backgroundColor: theme.backgroundDefault },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
                ]}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: `${Colors.light.primary}15` }]}>
                  <Feather name={item.icon as any} size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.menuCardContent}>
                  <ThemedText type="body" style={styles.menuLabel}>{item.label}</ThemedText>
                  {item.value && (
                    <ThemedText type="h4" style={{ color: Colors.light.primary, marginTop: 2 }}>
                      {item.value}
                    </ThemedText>
                  )}
                </View>
                <Feather name="chevron-right" size={18} color={theme.textMuted} style={styles.menuChevron} />
              </Pressable>
            ))}
          </View>

          {/* EVENTS SECTION */}
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Your Schedule</ThemedText>
              <View style={[styles.tabsContainer, { backgroundColor: theme.backgroundSecondary }]}>
                {(["all", "upcoming", "past"] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveTab(tab);
                    }}
                    style={[
                      styles.tabPill,
                      activeTab === tab && { backgroundColor: Colors.light.primary }
                    ]}
                  >
                    <ThemedText
                      type="tiny"
                      style={{
                        color: activeTab === tab ? '#FFF' : theme.textMuted,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        fontSize: 11
                      }}
                    >
                      {tab}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.eventsList}>
              {displayedEvents.length > 0 ? (
                displayedEvents.map((event, index) => (
                  <Animated.View key={event.id} entering={FadeInDown.delay(index * 80).duration(400)}>
                    <EventCard
                      event={event}
                      variant="compact"
                      onPress={() => { }}
                    />
                  </Animated.View>
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="calendar" size={28} color={theme.textMuted} />
                  </View>
                  <ThemedText type="body" style={{ color: theme.text, marginTop: 12, fontWeight: '600' }}>
                    No events found
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textMuted, marginTop: 4 }}>
                    {activeTab === "all" ? "Start exploring events" : `No ${activeTab} events`}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 54,
    borderWidth: 2.5,
  },
  editButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.light.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#000',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    width: '100%',
    justifyContent: 'center',
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    gap: 2,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  menuGrid: {
    gap: Spacing.md,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    minHeight: 72,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardContent: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontWeight: '600',
  },
  menuChevron: {
    marginLeft: 'auto',
  },
  eventsSection: {
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    borderRadius: BorderRadius.full,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  eventsList: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    borderRadius: BorderRadius.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
