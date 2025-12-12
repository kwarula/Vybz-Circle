import React, { useState } from "react";
import { FlatList, View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { MessageCard } from "@/components/MessageCard";
import { SearchBar } from "@/components/SearchBar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, BorderRadius, Shadows } from "@/constants/theme";
import { mockMessages } from "@/data/mockData";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = mockMessages.filter((msg) =>
    msg.crewName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessagePress = (messageId: string) => {
    // Navigation to chat would go here
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search crews..."
      />
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="message-circle" size={48} color={theme.textMuted} />
      </View>
      <ThemedText type="h3" style={styles.emptyTitle}>No messages yet</ThemedText>
      <ThemedText type="body" secondary style={styles.emptyText}>
        Join a crew or start a conversation to see your messages here
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing["3xl"],
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        renderItem={({ item }) => (
          <MessageCard message={item} onPress={() => handleMessagePress(item.id)} />
        )}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={[
          styles.fabButton,
          { backgroundColor: Colors.light.primary, bottom: tabBarHeight + Spacing["2xl"] },
          Shadows.fab,
        ]}
      >
        <Feather name="edit" size={24} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listHeader: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  fabButton: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
