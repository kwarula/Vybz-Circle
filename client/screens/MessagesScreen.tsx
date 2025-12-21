import React, { useState } from "react";
import { FlatList, View, StyleSheet, Pressable, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { MessageCard } from "@/components/MessageCard";
import { SearchBar } from "@/components/SearchBar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, BorderRadius, Shadows } from "@/constants/theme";
import { mockMessages } from "@/data/mockData";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = mockMessages.filter((msg) =>
    msg.crewName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessagePress = (messageId: string) => {
    navigation.navigate("Chat", { messageId });
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <ThemedText type="h2" style={{ marginBottom: Spacing.xl }}>Messages</ThemedText>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search conversations..."
      />
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="message-circle" size={40} color={theme.textMuted} />
      </View>
      <ThemedText type="h3" style={{ marginTop: Spacing.xl }}>No messages yet</ThemedText>
      <ThemedText type="body" style={{ color: theme.textMuted, marginTop: Spacing.sm, textAlign: 'center' }}>
        Join a crew or start a conversation to see your messages here
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <FlatList
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["3xl"],
          paddingHorizontal: Spacing.xl,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
            <MessageCard message={item} onPress={() => handleMessagePress(item.id)} />
          </Animated.View>
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
    paddingTop: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  fabButton: {
    position: "absolute",
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
