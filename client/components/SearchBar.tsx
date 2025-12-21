import React from "react";
import { StyleSheet, View, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  onFilterPress,
  showFilter = true,
}: SearchBarProps) {
  const { theme, isDark } = useTheme();

  const handleFilterPress = () => {
    Haptics.selectionAsync();
    onFilterPress?.();
  };

  const handleClear = () => {
    Haptics.selectionAsync();
    onChangeText("");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundSecondary,
        },
      ]}
    >
      {/* Search Icon */}
      <View style={styles.iconContainer}>
        <Feather name="search" size={20} color={theme.textMuted} />
      </View>

      {/* Input */}
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        returnKeyType="search"
      />

      {/* Clear Button (when text exists) */}
      {value.length > 0 && (
        <Pressable onPress={handleClear} style={styles.clearButton}>
          <View style={[styles.clearIcon, { backgroundColor: theme.textMuted }]}>
            <Feather name="x" size={12} color={theme.backgroundSecondary} />
          </View>
        </Pressable>
      )}

      {/* Filter Button - Always visible, Airbnb style */}
      {showFilter && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={handleFilterPress}
            style={({ pressed }) => [
              styles.filterButton,
              { backgroundColor: pressed ? theme.backgroundTertiary : 'transparent' },
            ]}
          >
            <Feather name="sliders" size={18} color={theme.textSecondary} />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    padding: Spacing.sm,
  },
  clearIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: Spacing.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
