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
import { s, ms, SCREEN_WIDTH } from "@/utils/responsive";
import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, Shadows, BorderRadius, Typography } from "@/constants/theme";
import { useEvents } from "@/hooks/useEvents";
import { currentUser as mockUser } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/query-client";
import { useEffect } from "react";

const MOODS = [
  { id: "Wild", label: "Wild 💃", color: "#FF007A" },
  { id: "Chill", label: "Chill ☕", color: "#00F0FF" },
  { id: "Deep", label: "Deep 🧠", color: "#8B5CF6" },
  { id: "Foodie", label: "Foodie 🍔", color: "#FF5F00" },
  { id: "Social", label: "Social 👋", color: "#FF8A4D" },
];

const MoodButton = ({ item, isSelected, onPress, index }: any) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isSelected ? 1.1 : 1, { damping: 12 }) }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[
          styles.moodButton,
          {
            backgroundColor: isSelected ? item.color : 'rgba(255,255,255,0.05)',
            borderColor: item.color,
            borderWidth: isSelected ? 0 : 2,
          },
          isSelected && Shadows.sticker
        ]}
      >
        <ThemedText
          style={[
            styles.moodLabel,
            { color: isSelected ? "#0A1B1B" : item.color }
          ]}
        >
          {item.label}
        </ThemedText>
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
  const [user, setUser] = useState<any>(null);

  const { theme, isDark } = useTheme();
  const { data: events = [] } = useEvents();

  // Spotify Recommendations
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    const fetchUserAndRecommendations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || "User",
            avatar: session.user.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${session.user.id}`
          };
          setUser(userData);

          // Now fetch recommendations
          setLoadingRecommendations(true);
          const res = await apiRequest('GET', `/api/spotify/recommendations?userId=${session.user.id}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            setRecommendedEvents(data);
          }
        }
      } catch (e) {
        console.log("Failed to fetch user or recommendations", e);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchUserAndRecommendations();
  }, []);

  const trendingEvents = [...events]
    .sort((a: any, b: any) => b.attendees - a.attendees)
    .slice(0, 5);

  const filteredEvents = events.filter((event: any) => {
    if (selectedCategory === "All") return true;
    return event.category === selectedCategory || (selectedCategory === "Foodie" && event.category === "Food");
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

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* GREETING HEADER */}
      <View style={styles.greetingHeader}>
        <View>
          <ThemedText style={[styles.welcomeText, { color: theme.textSecondary }]}>
            Welcome back
          </ThemedText>
          <ThemedText style={[styles.loudTitle, { color: theme.text }]}>{user?.name || mockUser.name}</ThemedText>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={showNotifications}
            style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="bell" size={24} color={theme.text} />
            {notificationCount > 0 && <View style={styles.dot} />}
          </Pressable>
          <Pressable onPress={navigateToProfile}>
            <Avatar uri={user?.avatar || mockUser.avatar} size={50} />
          </Pressable>
        </View>
      </View>

      {/* MOOD SELECTOR */}
      <View style={styles.categorySection}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.loudTitle}>What's the vibe?</ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodsScroll}
        >
          {MOODS.map((item, index) => (
            <MoodButton
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(item.id === selectedCategory ? "All" : item.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* HERO CAROUSEL SECTION */}
      <View style={styles.heroSection}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.loudTitle}>Featured</ThemedText>
          <Pressable>
            <ThemedText type="link" style={{ color: Colors.dark.primary }}>See all</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
          decelerationRate="fast"
          snapToInterval={s(300) + Spacing.md} // Proportional to card width
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

      {/* EXPLORE NEARBY SECTION HEADER */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.loudTitle}>Live Events</ThemedText>
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
  welcomeText: {
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '800',
  },
  loudTitle: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: ms(50),
    height: ms(50),
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dot: {
    position: 'absolute',
    top: ms(12),
    right: ms(12),
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: Colors.dark.primary,
    borderWidth: 2,
    borderColor: '#0A1B1B',
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
  moodsScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
    paddingVertical: ms(10),
  },
  moodButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
  },
});
