import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeIn,
    useAnimatedStyle,
    withTiming
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<any>;

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - Spacing.xl * 2 - Spacing.md * 2) / 3;

// Interest categories per design guidelines
const INTERESTS = [
    { id: "music", label: "Music", icon: "music", iconFamily: "feather" as const, color: "#8B5CF6" },
    { id: "nightlife", label: "Nightlife", icon: "moon", iconFamily: "feather" as const, color: "#EC4899" },
    { id: "amapiano", label: "Amapiano", icon: "headphones", iconFamily: "feather" as const, color: "#F59E0B" },
    { id: "reggae", label: "Reggae", icon: "leaf", iconFamily: "ionicons" as const, color: "#10B981" },
    { id: "jazz", label: "Jazz", icon: "musical-notes", iconFamily: "ionicons" as const, color: "#6366F1" },
    { id: "hiphop", label: "Hip-Hop", icon: "fire", iconFamily: "ionicons" as const, color: "#EF4444" },
    { id: "comedy", label: "Comedy", icon: "happy", iconFamily: "ionicons" as const, color: "#FBBF24" },
    { id: "sports", label: "Sports", icon: "football", iconFamily: "ionicons" as const, color: "#22C55E" },
    { id: "food", label: "Food", icon: "restaurant", iconFamily: "ionicons" as const, color: "#F97316" },
    { id: "wellness", label: "Wellness", icon: "heart", iconFamily: "feather" as const, color: "#EC4899" },
    { id: "art", label: "Art", icon: "color-palette", iconFamily: "ionicons" as const, color: "#8B5CF6" },
    { id: "networking", label: "Networking", icon: "people", iconFamily: "ionicons" as const, color: "#3B82F6" },
    { id: "festivals", label: "Festivals", icon: "sparkles", iconFamily: "ionicons" as const, color: "#F59E0B" },
    { id: "outdoor", label: "Outdoor", icon: "sunny", iconFamily: "ionicons" as const, color: "#10B981" },
    { id: "theatre", label: "Theatre", icon: "theater-masks", iconFamily: "fontawesome5" as const, color: "#A855F7" },
];

const MIN_SELECTIONS = 3;

interface InterestCardProps {
    interest: typeof INTERESTS[0];
    isSelected: boolean;
    onToggle: () => void;
    index: number;
}

function InterestCard({ interest, isSelected, onToggle, index }: InterestCardProps) {
    const { theme } = useTheme();

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withTiming(isSelected ? 1.05 : 1, { duration: 250 }) }
            ],
            shadowOpacity: withTiming(isSelected ? 0.3 : 0, { duration: 250 }),
        };
    });

    const renderIcon = () => {
        const size = 28;
        const color = isSelected ? "#FFF" : interest.color;

        switch (interest.iconFamily) {
            case "ionicons":
                return <Ionicons name={interest.icon as any} size={size} color={color} />;
            case "fontawesome5":
                return <FontAwesome5 name={interest.icon as any} size={size - 4} color={color} />;
            default:
                return <Feather name={interest.icon as any} size={size} color={color} />;
        }
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).duration(500)}
            style={[
                { width: CARD_SIZE },
                animatedStyle,
                isSelected && {
                    shadowColor: interest.color,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 12,
                    elevation: 10,
                }
            ]}
        >
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onToggle();
                }}
                style={({ pressed }) => [
                    styles.interestCard,
                    {
                        width: '100%',
                        backgroundColor: isSelected ? interest.color : theme.backgroundSecondary,
                        borderColor: isSelected ? interest.color : theme.border,
                    },
                ]}
            >
                {isSelected && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.checkBadge}>
                        <Feather name="check" size={12} color="#FFF" />
                    </Animated.View>
                )}
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : `${interest.color}15` }
                ]}>
                    {renderIcon()}
                </View>
                <ThemedText
                    type="small"
                    style={[
                        styles.interestLabel,
                        { color: isSelected ? "#FFF" : theme.text }
                    ]}
                >
                    {interest.label}
                </ThemedText>
            </Pressable>
        </Animated.View>
    );
}

export default function InterestSelectionScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const { theme, isDark } = useTheme();
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleContinue = async () => {
        if (selectedInterests.length < MIN_SELECTIONS) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('users')
                    .update({ interests: selectedInterests })
                    .eq('id', user.id);
            }
        } catch (error) {
            console.error("Error saving interests:", error);
        }

        // Navigate to main app
        try {
            navigation.navigate('Main');
        } catch (e) {
            // Fallback for different navigator structures
            console.log("Navigation to Main failed, likely due to session state change handling");
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Skip for now - can set interests later in profile
        try {
            navigation.navigate('Main');
        } catch (e) {
            console.log("Navigation to Main failed");
        }
    };

    const canContinue = selectedInterests.length >= MIN_SELECTIONS;

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <StatusBar style="light" />

            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(500)}
                style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}
            >
                <ThemedText type="hero" style={styles.title}>
                    What are you into?
                </ThemedText>
                <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Pick at least {MIN_SELECTIONS} interests to personalize your feed
                </ThemedText>
            </Animated.View>

            {/* Interest Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.gridContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {INTERESTS.map((interest, index) => (
                        <InterestCard
                            key={interest.id}
                            interest={interest}
                            isSelected={selectedInterests.includes(interest.id)}
                            onToggle={() => toggleInterest(interest.id)}
                            index={index}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <Animated.View
                entering={FadeInUp.delay(400).duration(500)}
                style={[
                    styles.footer,
                    {
                        paddingBottom: insets.bottom + Spacing.lg,
                        backgroundColor: theme.backgroundRoot,
                        borderTopColor: theme.border,
                    }
                ]}
            >
                {/* Selection counter */}
                <View style={styles.counterRow}>
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                        {selectedInterests.length} of {MIN_SELECTIONS} minimum selected
                    </ThemedText>
                    {selectedInterests.length >= MIN_SELECTIONS && (
                        <Feather name="check-circle" size={16} color={Colors.light.success} />
                    )}
                </View>

                {/* Continue Button */}
                <Pressable
                    onPress={handleContinue}
                    disabled={!canContinue}
                    style={({ pressed }) => [
                        styles.continueButton,
                        {
                            backgroundColor: Colors.light.primary,
                            opacity: !canContinue ? 0.5 : pressed ? 0.9 : 1,
                        },
                    ]}
                >
                    <ThemedText type="h4" style={{ color: "#FFF" }}>
                        Continue
                    </ThemedText>
                    <Feather name="arrow-right" size={20} color="#FFF" />
                </Pressable>

                {/* Skip Option */}
                <Pressable onPress={handleSkip} style={styles.skipButton}>
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                        I'll do this later
                    </ThemedText>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    title: {
        marginBottom: Spacing.md,
    },
    subtitle: {
        lineHeight: 24,
    },
    scrollView: {
        flex: 1,
    },
    gridContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing["2xl"],
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.md,
        justifyContent: "flex-start",
    },
    interestCard: {
        width: CARD_SIZE,
        aspectRatio: 1,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.sm,
        position: "relative",
    },
    checkBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.sm,
    },
    interestLabel: {
        textAlign: "center",
        fontWeight: "600",
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
    },
    counterRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    continueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        height: 56,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
    },
    skipButton: {
        alignItems: "center",
        paddingVertical: Spacing.sm,
    },
});
