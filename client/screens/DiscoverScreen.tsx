import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { mockEvents, categories } from "@/data/mockData";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

const NAIROBI_REGION = {
  latitude: -1.2864,
  longitude: 36.8172,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

function WebMapPlaceholder({ theme, onEventPress }: { theme: any; onEventPress: (id: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredEvents = mockEvents.filter((event) => {
    if (selectedCategory === "All") return true;
    return event.category === selectedCategory;
  });

  return (
    <View style={[styles.webPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.webHeader, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="map" size={24} color={Colors.light.primary} />
        <ThemedText type="h3">Discover Events</ThemedText>
        <ThemedText type="small" secondary style={{ textAlign: "center" }}>
          Map view is available on mobile. Use Expo Go to scan the QR code.
        </ThemedText>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.webCategories}
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

      <ScrollView
        style={styles.webEventsList}
        contentContainerStyle={styles.webEventsContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            variant="compact"
            onPress={() => onEventPress(event.id)}
          />
        ))}
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
  const [location, setLocation] = useState("Nairobi");

  const handleMarkerPress = (eventId: string) => {
    setSelectedEvent(eventId);
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate("EventDetail", { eventId });
  };

  const handleTopSpotsPress = () => {
    navigation.navigate("TopSpots");
  };

  const selectedEventData = mockEvents.find((e) => e.id === selectedEvent);

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
        <WebMapPlaceholder theme={theme} onEventPress={handleEventPress} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={NAIROBI_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {mockEvents.map((event) => (
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

      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.locationBar}>
          <Feather name="map-pin" size={18} color={Colors.light.primary} />
          <ThemedText type="body" style={styles.locationText}>{location}</ThemedText>
          <Feather name="chevron-down" size={18} color={theme.textSecondary} />
        </BlurView>
        
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="crosshair" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={[styles.iconButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={handleTopSpotsPress}
          >
            <Feather name="sliders" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.floatingButton,
          { backgroundColor: theme.backgroundDefault, bottom: tabBarHeight + 180 },
          Shadows.fab,
        ]}
      >
        <Pressable style={styles.centerBtn}>
          <Feather name="navigation" size={22} color={Colors.light.primary} />
        </Pressable>
      </View>

      {selectedEventData ? (
        <View style={[styles.eventPreview, { bottom: tabBarHeight + Spacing["2xl"] }]}>
          <EventCard
            event={selectedEventData}
            variant="map"
            onPress={() => handleEventPress(selectedEventData.id)}
          />
        </View>
      ) : null}

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
    paddingHorizontal: Spacing.lg,
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
    overflow: "hidden",
  },
  locationText: {
    flex: 1,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtn: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  eventPreview: {
    position: "absolute",
    left: Spacing.lg,
  },
  addButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  webPlaceholder: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  webHeader: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  webCategories: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  webEventsList: {
    flex: 1,
    marginTop: Spacing.md,
  },
  webEventsContent: {
    paddingBottom: Spacing.lg,
  },
});
