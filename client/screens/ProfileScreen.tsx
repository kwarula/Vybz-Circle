import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { currentUser, mockEvents } from "@/data/mockData";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");

  const upcomingEvents = mockEvents.filter((e) => e.isGoing);
  const stats = [
    { label: "Events", value: 24 },
    { label: "Crews", value: 5 },
    { label: "Points", value: 1250 },
  ];

  const menuItems = [
    { icon: "credit-card", label: "Wallet", badge: "KES 2,500" },
    { icon: "ticket", label: "My Tickets", badge: "3" },
    { icon: "award", label: "Achievements", badge: null },
    { icon: "shield", label: "Safety Settings", badge: null },
    { icon: "settings", label: "Settings", badge: null },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }, Shadows.card]}>
        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
        <ThemedText type="h2" style={styles.name}>{currentUser.name}</ThemedText>
        <ThemedText type="small" secondary>Nairobi, Kenya</ThemedText>
        
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={styles.statItem}>
              <ThemedText type="h2" style={{ color: Colors.light.primary }}>
                {stat.value}
              </ThemedText>
              <ThemedText type="tiny" secondary>{stat.label}</ThemedText>
            </View>
          ))}
        </View>

        <Pressable style={[styles.editButton, { borderColor: theme.border }]}>
          <Feather name="edit-2" size={16} color={theme.text} />
          <ThemedText type="small" style={{ fontWeight: "600" }}>Edit Profile</ThemedText>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(["all", "upcoming", "past"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: Colors.light.primary },
              { borderColor: activeTab === tab ? Colors.light.primary : theme.border },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <ThemedText
              type="small"
              style={{
                fontWeight: "500",
                color: activeTab === tab ? "#FFF" : theme.text,
              }}
            >
              {tab === "all" ? "All" : tab === "upcoming" ? "Upcoming" : "Past"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            style={[
              styles.menuItem,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.borderLight },
              index === 0 && styles.menuItemFirst,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name={item.icon as any} size={20} color={Colors.light.primary} />
            </View>
            <ThemedText type="body" style={styles.menuLabel}>{item.label}</ThemedText>
            {item.badge ? (
              <ThemedText type="small" style={{ color: Colors.light.primary, fontWeight: "600" }}>
                {item.badge}
              </ThemedText>
            ) : null}
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>Upcoming Events</ThemedText>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <Pressable
              key={event.id}
              style={[styles.eventItem, { backgroundColor: theme.backgroundDefault }, Shadows.card]}
            >
              <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
              <View style={styles.eventContent}>
                <ThemedText type="h4" numberOfLines={1}>{event.title}</ThemedText>
                <View style={styles.eventMeta}>
                  <Feather name="calendar" size={12} color={theme.textSecondary} />
                  <ThemedText type="tiny" secondary>{event.date}</ThemedText>
                </View>
                <View style={styles.eventMeta}>
                  <Feather name="map-pin" size={12} color={theme.textSecondary} />
                  <ThemedText type="tiny" secondary numberOfLines={1}>{event.venue}</ThemedText>
                </View>
              </View>
              <View style={[styles.goingBadge, { backgroundColor: theme.goingBg }]}>
                <ThemedText type="tiny" style={{ color: theme.going, fontWeight: "600" }}>Going</ThemedText>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptyEvents, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="calendar" size={32} color={theme.textMuted} />
            <ThemedText type="small" secondary>No upcoming events</ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing["3xl"],
  },
  statItem: {
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  menuSection: {
    marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 1,
    marginTop: -1,
    gap: Spacing.md,
  },
  menuItemFirst: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  menuItemLast: {
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  eventItem: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
    alignItems: "center",
    paddingRight: Spacing.md,
  },
  eventImage: {
    width: 70,
    height: 70,
  },
  eventContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  goingBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  emptyEvents: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
});
