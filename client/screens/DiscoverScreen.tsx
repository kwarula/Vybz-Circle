import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform, Dimensions, ScrollView, TextInput, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { categories } from "@/data/mockData";
import { useEvents } from "@/hooks/useEvents";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (error) {
    console.log("Maps not available - using placeholder");
  }
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

const NAIROBI_REGION = {
  latitude: -1.2864,
  longitude: 36.8172,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Explore View (Web/Fallback)
function ExploreView({ theme, isDark, onEventPress, navigation }: { theme: any; isDark: boolean; onEventPress: (id: string) => void; navigation: NavigationProp }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: events = [] } = useEvents();

  const filteredEvents = events.filter((event: any) => {
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={[styles.exploreContainer, { backgroundColor: theme.backgroundRoot }]}>
      {/* Search Header */}
      <View style={[styles.exploreHeader, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={20} color={theme.textMuted} />
          <TextInput
            placeholder="Search events, venues..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <View style={[styles.clearIcon, { backgroundColor: theme.textMuted }]}>
                <Feather name="x" size={10} color={theme.backgroundSecondary} />
              </View>
            </Pressable>
          )}
          <View style={[styles.searchDivider, { backgroundColor: theme.border }]} />
          <Pressable
            style={styles.filterBtn}
            onPress={() => navigation.navigate('FilterModal')}
          >
            <Feather name="sliders" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              isSelected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.eventsList}
        contentContainerStyle={styles.eventsContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="h2" style={styles.sectionTitle}>
          {searchQuery ? `Results for "${searchQuery}"` : "Discover Nearby"}
        </ThemedText>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="search" size={32} color={theme.textMuted} />
            </View>
            <ThemedText type="h4" style={{ marginTop: Spacing.lg }}>No events found</ThemedText>
            <ThemedText type="body" style={{ color: theme.textMuted, marginTop: 4 }}>
              Try adjusting your search or filters
            </ThemedText>
          </View>
        ) : (
          filteredEvents.map((event: any, index: number) => (
            <Animated.View
              key={event.id}
              entering={FadeInDown.delay(index * 80).duration(400)}
            >
              <EventCard
                event={event}
                variant="compact"
                onPress={() => onEventPress(event.id)}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [location] = useState("Nairobi");

  const { data: events = [] } = useEvents();

  const handleMarkerPress = (eventId: string) => {
    setSelectedEvent(eventId);
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate("EventDetail", { eventId });
  };

  const handleTopSpotsPress = () => {
    navigation.navigate("TopSpots");
  };

  const selectedEventData = events.find((e: any) => e.id === selectedEvent);

  // Use ExploreView if map is unavailable or on web
  if (Platform.OS === "web" || !MapView) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: insets.top,
            paddingBottom: tabBarHeight,
          },
        ]}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ExploreView theme={theme} isDark={isDark} onEventPress={handleEventPress} navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <StatusBar barStyle="light-content" />
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={NAIROBI_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {events.map((event: any) => (
          <Marker
            key={event.id}
            coordinate={event.coordinates}
            onPress={() => handleMarkerPress(event.id)}
          >
            <View
              style={[
                styles.marker,
                {
                  backgroundColor:
                    selectedEvent === event.id
                      ? Colors.light.primary
                      : theme.backgroundDefault,
                  borderColor:
                    selectedEvent === event.id
                      ? Colors.light.primary
                      : theme.border,
                },
              ]}
            >
              <Feather
                name="map-pin"
                size={16}
                color={selectedEvent === event.id ? "#FFF" : Colors.light.primary}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable style={[styles.locationBar, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Feather name="map-pin" size={18} color={Colors.light.primary} />
          <ThemedText type="body" style={styles.locationText}>{location}</ThemedText>
          <Feather name="chevron-down" size={18} color="#B3B3B3" />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Feather name="crosshair" size={20} color="#FFF" />
          </Pressable>
          <Pressable
            style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            onPress={() => navigation.navigate("FilterModal")}
          >
            <Feather name="sliders" size={20} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[
          styles.floatingButton,
          { backgroundColor: theme.backgroundDefault, bottom: tabBarHeight + 180 },
          Shadows.fab,
        ]}
      >
        <Feather name="navigation" size={22} color={Colors.light.primary} />
      </Pressable>

      {selectedEventData && (
        <View style={[styles.eventPreview, { bottom: tabBarHeight + Spacing["2xl"] }]}>
          <EventCard
            event={selectedEventData}
            variant="map"
            onPress={() => handleEventPress(selectedEventData.id)}
          />
        </View>
      )}

      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: Colors.light.primary, bottom: tabBarHeight + Spacing["2xl"] },
          Shadows.fab,
        ]}
      >
        <Feather name="plus" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  locationBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  locationText: {
    flex: 1,
    fontWeight: "600",
    color: "#FFF",
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButton: {
    position: "absolute",
    right: Spacing.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  eventPreview: {
    position: "absolute",
    left: Spacing.xl,
  },
  addButton: {
    position: "absolute",
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  // Explore View Styles
  exploreContainer: {
    flex: 1,
  },
  exploreHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  categoriesScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  searchDivider: {
    width: 1,
    height: 24,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
