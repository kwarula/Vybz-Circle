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
import { Feather, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Gradients } from "@/constants/theme";

const { width } = Dimensions.get("window");
const BINGO_SIZE = (width - Spacing.xl * 2 - Spacing.sm * 2) / 3;

// User level tiers per design guidelines
const LEVEL_TIERS = [
    { level: 1, name: "Newbie", min: 0, max: 100 },
    { level: 2, name: "Explorer", min: 100, max: 300 },
    { level: 3, name: "Regular", min: 300, max: 600 },
    { level: 4, name: "Scout", min: 600, max: 1000 },
    { level: 5, name: "Captain", min: 1000, max: 1500 },
    { level: 6, name: "Legend", min: 1500, max: 2500 },
    { level: 7, name: "Icon", min: 2500, max: Infinity },
];

// Mock user stats
const userStats = {
    repPoints: 1250,
    level: 5,
    tierName: "Captain",
    bingoCompleted: 3,
    bingoTotal: 9,
    streak: 5,
    eventsAttended: 23,
    rank: 47,
};

// Bingo challenges with icons
const bingoChallenge = [
    { id: "1", title: "Attend Jazz Event", icon: "musical-notes", completed: true },
    { id: "2", title: "Bring 2 Friends", icon: "people", completed: true },
    { id: "3", title: "Visit New Venue", icon: "location", completed: false },
    { id: "4", title: "Outdoor Event", icon: "sunny", completed: true },
    { id: "5", title: "VIP Ticket", icon: "star", completed: false },
    { id: "6", title: "Weekend Event", icon: "calendar", completed: false },
    { id: "7", title: "Food Festival", icon: "restaurant", completed: false },
    { id: "8", title: "Art Show", icon: "color-palette", completed: false },
    { id: "9", title: "Share Story", icon: "share-social", completed: false },
];

// Weekly challenges
const weeklyChallenges = [
    {
        id: "w1",
        title: "Weekend Warrior",
        description: "Attend 2 events this weekend",
        progress: 1,
        total: 2,
        reward: 200,
        icon: "flash",
        color: "#F59E0B",
    },
    {
        id: "w2",
        title: "Social Butterfly",
        description: "Invite 3 friends to an event",
        progress: 2,
        total: 3,
        reward: 150,
        icon: "people",
        color: "#EC4899",
    },
    {
        id: "w3",
        title: "Early Bird",
        description: "Buy tickets 7 days in advance",
        progress: 1,
        total: 1,
        reward: 100,
        icon: "time",
        color: "#10B981",
        completed: true,
    },
];

interface BingoCellProps {
    challenge: typeof bingoChallenge[0];
    index: number;
}

function BingoCell({ challenge, index }: BingoCellProps) {
    const { theme } = useTheme();

    return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={[
                    styles.bingoCell,
                    {
                        backgroundColor: challenge.completed ? Colors.light.primaryMuted : theme.backgroundSecondary,
                        borderColor: challenge.completed ? Colors.light.primary : theme.border,
                    },
                ]}
            >
                {challenge.completed ? (
                    <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={28} color={Colors.light.success} />
                    </View>
                ) : (
                    <Ionicons
                        name={challenge.icon as any}
                        size={24}
                        color={theme.textMuted}
                    />
                )}
                <ThemedText
                    type="tiny"
                    numberOfLines={2}
                    style={[
                        styles.bingoCellText,
                        { color: challenge.completed ? Colors.light.primary : theme.textSecondary },
                    ]}
                >
                    {challenge.title}
                </ThemedText>
            </Pressable>
        </Animated.View>
    );
}

interface ChallengeCardProps {
    challenge: typeof weeklyChallenges[0];
    index: number;
}

function ChallengeCard({ challenge, index }: ChallengeCardProps) {
    const { theme } = useTheme();
    const progressPercent = (challenge.progress / challenge.total) * 100;

    return (
        <Animated.View entering={FadeInDown.delay(200 + index * 80).duration(400)}>
            <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={[
                    styles.challengeCard,
                    {
                        backgroundColor: theme.backgroundDefault,
                        borderColor: theme.border,
                        opacity: challenge.completed ? 0.7 : 1,
                    },
                ]}
            >
                <View style={[styles.challengeIcon, { backgroundColor: `${challenge.color}20` }]}>
                    <Ionicons name={challenge.icon as any} size={24} color={challenge.color} />
                </View>
                <View style={styles.challengeInfo}>
                    <View style={styles.challengeHeader}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                            {challenge.title}
                        </ThemedText>
                        {challenge.completed && (
                            <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
                        )}
                    </View>
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                        {challenge.description}
                    </ThemedText>
                    {/* Progress Bar */}
                    <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progressPercent}%`,
                                    backgroundColor: challenge.completed ? Colors.light.success : challenge.color,
                                },
                            ]}
                        />
                    </View>
                </View>
                <View style={styles.rewardBadge}>
                    <ThemedText type="tiny" style={{ color: Colors.light.primary, fontWeight: "700" }}>
                        +{challenge.reward}
                    </ThemedText>
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default function CircuitScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { theme, isDark } = useTheme();

    // Calculate progress to next level
    const currentTier = LEVEL_TIERS.find((t) => t.level === userStats.level)!;
    const nextTier = LEVEL_TIERS.find((t) => t.level === userStats.level + 1);
    const progressToNext = nextTier
        ? ((userStats.repPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100
        : 100;

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <ThemedText type="hero">The Circuit</ThemedText>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate("Leaderboard");
                    }}
                    style={[styles.leaderboardBtn, { backgroundColor: theme.backgroundSecondary }]}
                >
                    <Ionicons name="trophy" size={20} color={Colors.light.primary} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* User Stats Card */}
                <Animated.View entering={FadeIn.duration(500)}>
                    <LinearGradient
                        colors={Gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statsCard}
                    >
                        {/* Level Badge */}
                        <Pressable
                            style={styles.levelBadge}
                            onPress={() => navigation.navigate("Achievements")}
                        >
                            <ThemedText type="h1" style={{ color: "#FFF" }}>
                                {userStats.level}
                            </ThemedText>
                            <ThemedText type="tiny" style={{ color: "rgba(255,255,255,0.7)" }}>
                                {userStats.tierName}
                            </ThemedText>
                        </Pressable>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <ThemedText type="h3" style={{ color: "#FFF" }}>
                                    {userStats.repPoints.toLocaleString()}
                                </ThemedText>
                                <ThemedText type="tiny" style={{ color: "rgba(255,255,255,0.7)" }}>
                                    REP POINTS
                                </ThemedText>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
                            <View style={styles.statItem}>
                                <ThemedText type="h3" style={{ color: "#FFF" }}>
                                    {userStats.streak}
                                </ThemedText>
                                <ThemedText type="tiny" style={{ color: "rgba(255,255,255,0.7)" }}>
                                    🔥 STREAK
                                </ThemedText>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
                            <View style={styles.statItem}>
                                <ThemedText type="h3" style={{ color: "#FFF" }}>
                                    #{userStats.rank}
                                </ThemedText>
                                <ThemedText type="tiny" style={{ color: "rgba(255,255,255,0.7)" }}>
                                    RANK
                                </ThemedText>
                            </View>
                        </View>

                        {/* Progress to next level */}
                        {nextTier && (
                            <View style={styles.levelProgress}>
                                <View style={styles.levelProgressHeader}>
                                    <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
                                        Progress to {nextTier.name}
                                    </ThemedText>
                                    <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
                                        {nextTier.min - userStats.repPoints} pts to go
                                    </ThemedText>
                                </View>
                                <View style={styles.levelProgressBar}>
                                    <View
                                        style={[styles.levelProgressFill, { width: `${progressToNext}%` }]}
                                    />
                                </View>
                            </View>
                        )}
                    </LinearGradient>
                </Animated.View>

                {/* Monthly Quest Bingo */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="h3">December Quest</ThemedText>
                        <View style={[styles.bingoCounter, { backgroundColor: theme.backgroundSecondary }]}>
                            <ThemedText type="small" style={{ color: Colors.light.primary, fontWeight: "700" }}>
                                {userStats.bingoCompleted}/{userStats.bingoTotal}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.lg }}>
                        Complete a row, column, or diagonal for bonus rewards
                    </ThemedText>

                    <View style={styles.bingoGrid}>
                        {bingoChallenge.map((challenge, index) => (
                            <BingoCell key={challenge.id} challenge={challenge} index={index} />
                        ))}
                    </View>
                </View>

                {/* Weekly Challenges */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="h3">Weekly Challenges</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textMuted }}>
                            Resets in 3 days
                        </ThemedText>
                    </View>

                    {weeklyChallenges.map((challenge, index) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} index={index} />
                    ))}
                </View>

                {/* Turf Wars Teaser */}
                <Animated.View entering={FadeInDown.delay(500).duration(500)}>
                    <Pressable
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                        style={[styles.turfWarsCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                    >
                        <View style={styles.turfWarsContent}>
                            <View style={[styles.turfWarsIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                                <FontAwesome5 name="map-marked-alt" size={24} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText type="h4">Turf Wars</ThemedText>
                                <ThemedText type="small" style={{ color: theme.textMuted }}>
                                    Claim neighborhoods • Compete with crews
                                </ThemedText>
                            </View>
                            <View style={[styles.comingSoonBadge, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                                <ThemedText type="tiny" style={{ color: "#EF4444", fontWeight: "700" }}>
                                    SOON
                                </ThemedText>
                            </View>
                        </View>
                    </Pressable>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    leaderboardBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    statsCard: {
        borderRadius: BorderRadius["2xl"],
        padding: Spacing.xl,
        marginBottom: Spacing["2xl"],
    },
    levelBadge: {
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.2)",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: "100%",
    },
    levelProgress: {
        marginTop: Spacing.lg,
    },
    levelProgressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: Spacing.sm,
    },
    levelProgressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    levelProgressFill: {
        height: "100%",
        borderRadius: 3,
        backgroundColor: "#FFF",
    },
    section: {
        marginBottom: Spacing["2xl"],
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.sm,
    },
    bingoCounter: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    bingoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        justifyContent: "center",
    },
    bingoCell: {
        width: BINGO_SIZE,
        aspectRatio: 1,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.sm,
    },
    completedBadge: {
        marginBottom: Spacing.xs,
    },
    bingoCellText: {
        textAlign: "center",
        marginTop: Spacing.xs,
    },
    challengeCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.md,
        gap: Spacing.md,
    },
    challengeIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    challengeInfo: {
        flex: 1,
    },
    challengeHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        marginTop: Spacing.sm,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 2,
    },
    rewardBadge: {
        backgroundColor: Colors.light.primaryMuted,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    turfWarsCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    turfWarsContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    turfWarsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    comingSoonBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
});
