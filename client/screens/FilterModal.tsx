import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { categories } from "@/data/mockData";

const DATES = ["Today", "Tomorrow", "This Weekend", "Next Week", "Choose Date"];
const PRICES = ["Any Price", "Free", "Under 1000", "Under 3000", "High End"];

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
    const { theme } = useTheme();
    return (
        <View style={styles.section}>
            <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textMuted }]}>
                {title.toUpperCase()}
            </ThemedText>
            {children}
        </View>
    );
}

interface FilterChipProps {
    label: string;
    isSelected: boolean;
    onPress: () => void;
}

function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
    const { theme } = useTheme();
    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            style={[
                styles.chip,
                {
                    backgroundColor: isSelected ? Colors.light.primary : theme.backgroundSecondary,
                    borderColor: isSelected ? Colors.light.primary : theme.border,
                },
            ]}
        >
            <ThemedText
                type="small"
                style={{ color: isSelected ? "#FFF" : theme.text, fontWeight: isSelected ? "600" : "400" }}
            >
                {label}
            </ThemedText>
        </Pressable>
    );
}

export default function FilterModal() {
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    // Filter States
    const [selectedDate, setSelectedDate] = useState("This Weekend");
    const [selectedPrice, setSelectedPrice] = useState("Any Price");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [showSoldOut, setShowSoldOut] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(true);

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedDate("This Weekend");
        setSelectedPrice("Any Price");
        setSelectedCategories([]);
        setShowSoldOut(false);
        setVerifiedOnly(true);
    };

    const handleApply = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.backgroundDefault }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Feather name="x" size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h3">Filters</ThemedText>
                <Pressable onPress={handleReset}>
                    <ThemedText type="body" style={{ color: Colors.light.primary }}>
                        Reset
                    </ThemedText>
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Date Filter */}
                <FilterSection title="When">
                    <View style={styles.chipGrid}>
                        {DATES.map((date) => (
                            <FilterChip
                                key={date}
                                label={date}
                                isSelected={selectedDate === date}
                                onPress={() => setSelectedDate(date)}
                            />
                        ))}
                    </View>
                </FilterSection>

                {/* Price Filter */}
                <FilterSection title="Price">
                    <View style={styles.chipGrid}>
                        {PRICES.map((price) => (
                            <FilterChip
                                key={price}
                                label={price}
                                isSelected={selectedPrice === price}
                                onPress={() => setSelectedPrice(price)}
                            />
                        ))}
                    </View>
                </FilterSection>

                {/* Categories Filter */}
                <FilterSection title="Categories">
                    <View style={styles.chipGrid}>
                        {categories.map((category) => (
                            <FilterChip
                                key={category}
                                label={category}
                                isSelected={selectedCategories.includes(category)}
                                onPress={() => toggleCategory(category)}
                            />
                        ))}
                    </View>
                </FilterSection>

                {/* Toggles */}
                <FilterSection title="Options">
                    <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                        <View>
                            <ThemedText type="body">Verified Events Only</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>
                                Show only trusted organizers
                            </ThemedText>
                        </View>
                        <Switch
                            value={verifiedOnly}
                            onValueChange={setVerifiedOnly}
                            trackColor={{ false: theme.border, true: Colors.light.primaryMuted }}
                            thumbColor={verifiedOnly ? Colors.light.primary : "#f4f3f4"}
                        />
                    </View>
                    <View style={styles.toggleRow}>
                        <View>
                            <ThemedText type="body">Include Sold Out</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>
                                Show events with no tickets left
                            </ThemedText>
                        </View>
                        <Switch
                            value={showSoldOut}
                            onValueChange={setShowSoldOut}
                            trackColor={{ false: theme.border, true: Colors.light.primaryMuted }}
                            thumbColor={showSoldOut ? Colors.light.primary : "#f4f3f4"}
                        />
                    </View>
                </FilterSection>
            </ScrollView>

            {/* Footer */}
            <View
                style={[
                    styles.footer,
                    {
                        paddingBottom: insets.bottom + Spacing.md,
                        backgroundColor: theme.backgroundDefault,
                        borderTopColor: theme.border,
                    },
                ]}
            >
                <Pressable
                    onPress={handleApply}
                    style={({ pressed }) => [
                        styles.applyButton,
                        { backgroundColor: Colors.light.primary, opacity: pressed ? 0.9 : 1 },
                    ]}
                >
                    <ThemedText type="h4" style={{ color: "#FFF" }}>
                        Show Results
                    </ThemedText>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: Spacing.lg,
        paddingTop: Platform.OS === "android" ? Spacing.xl : Spacing.md,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.xl,
        gap: Spacing["2xl"],
    },
    section: {
        gap: Spacing.md,
    },
    sectionTitle: {
        fontWeight: "600",
        letterSpacing: 1,
    },
    chipGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: Spacing.md,
    },
    footer: {
        padding: Spacing.xl,
        borderTopWidth: 1,
    },
    applyButton: {
        height: 56,
        borderRadius: BorderRadius.lg,
        alignItems: "center",
        justifyContent: "center",
    },
});
