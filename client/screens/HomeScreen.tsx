import React, { useState, useCallback } from "react";
import { FlatList, View, StyleSheet, ScrollView, Image, Pressable, Alert, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";

import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { CategoryChip } from "@/components/CategoryChip";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, Shadows, BorderRadius } from "@/constants/theme";
import { useEvents } from "@/hooks/useEvents";
import { currentUser, categories } from "@/data/mockData";

const VISUAL_CATEGORIES = [
  { id: "All", label: "Discovery", icon: "compass", colors: ["#8B5CF6", "#A78BFA"] },
  { id: "Music", label: "Music", icon: "music", colors: ["#EC4899", "#F472B6"] },
  { id: "Wellness", label: "Wellness", icon: "heart", colors: ["#10B981", "#34D399"] },
  { id: "Social", label: "Social", icon: "users", colors: ["#F59E0B", "#FBBF24"] },
  { id: "Networking", label: "Network", icon: "zap", colors: ["#3B82F6", "#60A5FA"] },
  { id: "Comedy", label: "Comedy", icon: "smile", colors: ["#EF4444", "#F87171"] },
  { id: "Sports", label: "Sports", icon: "award", colors: ["#6366F1", "#818CF8"] },
  { id: "Food", label: "Food", icon: "coffee", colors: ["#F97316", "#FB923C"] },
];

const VisualCategoryCard = ({ item, isSelected, onPress, index }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isSelected ? 1.05 : 1) }],
    opacity: withTiming(1, { duration: 500 }),
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(600).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.visualCard,
          {
            borderColor: isSelected ? item.colors[0] : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          }
        ]}
      >
        <LinearGradient
          colors={isSelected ? item.colors : ['#1A1A1A', '#111111']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={[styles.cardIconContainer, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)' }]}>
            <Feather name={item.icon} size={24} color={isSelected ? "#FFF" : "#737373"} />
          </View>
          <ThemedText
            type="small"
            style={[styles.cardLabel, { color: isSelected ? "#FFF" : "#737373" }]}
          >
            {item.label}
          </ThemedText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [notificationCount] = useState(3);

  const { theme, isDark } = useTheme();
  const { data: events = [] } = useEvents();

  // Create derived state
  const trendingEvents = [...events]
    .sort((a: any, b: any) => b.attendees - a.attendees)
    .slice(0, 5);

  const filteredEvents = events.filter((event: any) => {
    if (selectedCategory === "All") return true;
    return event.category === selectedCategory;
  });

  const handleEventPress = useCallback((eventId: string) => {
    navigation.navigate("EventDetail", { eventId });
  }, [navigation]);

  const navigateToProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate("ProfileTab");
    }
  };

  const showNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Notifications");
  };

  const handleAISearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("AI Assistant", "How can I help you find the perfect event today?");
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* GREETING HEADER */}
      <View style={styles.greetingHeader}>
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Welcome back
          </ThemedText>
          <ThemedText type="h1">{currentUser.name}</ThemedText>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleAISearch}
            style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="search" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={showNotifications}
            style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="bell" size={20} color={theme.text} />
            {notificationCount > 0 && <View style={styles.dot} />}
          </Pressable>
          <Pressable onPress={navigateToProfile}>
            <Avatar uri={currentUser.avatar} size={44} />
          </Pressable>
        </View>
      </View>

      {/* HERO CAROUSEL SECTION */}
      <View style={styles.heroSection}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h2">Featured</ThemedText>
          <Pressable>
            <ThemedText type="small" style={{ color: Colors.light.primary }}>See all</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
          decelerationRate="fast"
          snapToInterval={316} // card width (300) + gap (16)
        >
          {trendingEvents.map((event: any, index: number) => (
            <Animated.View key={event.id} entering={FadeInDown.delay(index * 80).duration(500)}>
              <EventCard
                event={event}
                variant="immersive"
                onPress={() => handleEventPress(event.id)}
              />
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* VISUAL CATEGORIES */}
      <View style={styles.categorySection}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h2">Explore</ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {VISUAL_CATEGORIES.map((item, index) => (
            <VisualCategoryCard
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(item.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* EXPLORE NEARBY SECTION HEADER */}
      <View style={styles.sectionHeader}>
        <ThemedText type="h2">Live Events</ThemedText>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(300 + (index * 50)).duration(400)}>
            <EventCard
              event={item}
              onPress={() => handleEventPress(item.id)}
            />
          </Animated.View>
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing["3xl"],
          paddingHorizontal: Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.section,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.error,
    borderWidth: 2,
    borderColor: '#000',
  },
  heroSection: {
    marginBottom: Spacing.section,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  trendingList: {
    paddingRight: Spacing.xl,
  },
  categorySection: {
    marginBottom: Spacing.section,
  },
  categoriesScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  visualCard: {
    width: 80,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  fabContainer: {
    position: "absolute",
    right: Spacing.xl,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
