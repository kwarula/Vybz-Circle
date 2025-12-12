import React, { useState, useCallback } from "react";
import { FlatList, View, StyleSheet, ScrollView, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { CategoryChip } from "@/components/CategoryChip";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { mockEvents, categories, currentUser } from "@/data/mockData";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");

  const filteredEvents = mockEvents.filter((event) => {
    if (selectedCategory === "All") return true;
    return event.category === selectedCategory;
  });

  const getEventCount = (category: string) => {
    if (category === "All") return mockEvents.length;
    return mockEvents.filter((e) => e.category === category).length;
  };

  const handleEventPress = useCallback((eventId: string) => {
    navigation.navigate("EventDetail", { eventId });
  }, [navigation]);

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.greeting}>
        <View>
          <ThemedText type="h1">Hi, {currentUser.name}</ThemedText>
          <ThemedText type="small" secondary>{getCurrentDate()}</ThemedText>
        </View>
        <Avatar uri={currentUser.avatar} size={48} />
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "all" && { backgroundColor: Colors.light.primary },
          ]}
          onPress={() => setActiveTab("all")}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              { color: activeTab === "all" ? "#FFF" : theme.text },
            ]}
          >
            All {mockEvents.length}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "upcoming" && { backgroundColor: Colors.light.primary },
          ]}
          onPress={() => setActiveTab("upcoming")}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              { color: activeTab === "upcoming" ? "#FFF" : theme.text },
            ]}
          >
            Upcoming events {mockEvents.filter(e => e.isGoing).length}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "past" && { backgroundColor: Colors.light.primary },
          ]}
          onPress={() => setActiveTab("past")}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              { color: activeTab === "past" ? "#FFF" : theme.text },
            ]}
          >
            Past events 8
          </ThemedText>
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
            count={category === "All" ? undefined : getEventCount(category)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={filteredEvents}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
        <EventCard
          event={item}
          onPress={() => handleEventPress(item.id)}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listHeader: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  tabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: "wrap",
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabText: {
    fontWeight: "500",
  },
  categoriesScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
