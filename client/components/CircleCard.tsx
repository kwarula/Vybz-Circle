import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import type { Circle } from "@/data/mockData";

interface CircleCardProps {
    circle: Circle;
    onPress?: () => void;
}

export function CircleCard({ circle, onPress }: CircleCardProps) {
    const { theme } = useTheme();
    const displayMembers = circle.members.slice(0, 4);
    const remainingCount = Math.max(0, circle.members.length - 4);
    const onlineCount = circle.members.filter(m => m.status !== 'offline').length;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    return (
        <Pressable onPress={handlePress}>
            <LinearGradient
                colors={[circle.color + '20', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.container, { borderColor: circle.color + '40' }]}
            >
                {/* Header Row */}
                <View style={styles.headerRow}>
                    <View style={styles.circleInfo}>
                        <View style={[styles.emojiContainer, { backgroundColor: circle.color + '30' }]}>
                            <ThemedText style={styles.emoji}>{circle.emoji}</ThemedText>
                        </View>
                        <View>
                            <ThemedText type="h3">{circle.name}</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                {onlineCount} of {circle.members.length} online
                            </ThemedText>
                        </View>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textMuted} />
                </View>

                {/* Avatar Stack */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarStack}>
                        {displayMembers.map((member, index) => (
                            <View
                                key={member.id}
                                style={[
                                    styles.avatarWrapper,
                                    { marginLeft: index > 0 ? -12 : 0, zIndex: displayMembers.length - index }
                                ]}
                            >
                                <Avatar uri={member.avatar} size={40} />
                                {member.status === 'ready' && (
                                    <View style={[styles.statusDot, { backgroundColor: Colors.light.success }]} />
                                )}
                                {member.status === 'getting_ready' && (
                                    <View style={[styles.statusDot, { backgroundColor: Colors.light.warning }]} />
                                )}
                                {member.status === 'running_late' && (
                                    <View style={[styles.statusDot, { backgroundColor: Colors.light.error }]} />
                                )}
                            </View>
                        ))}
                        {remainingCount > 0 && (
                            <View style={[styles.remainingBadge, { backgroundColor: theme.backgroundSecondary }]}>
                                <ThemedText type="tiny">+{remainingCount}</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Status Message */}
                <View style={[styles.statusBar, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="activity" size={14} color={circle.color} />
                    <ThemedText type="small" style={{ color: theme.text, flex: 1 }}>
                        {circle.statusMessage}
                    </ThemedText>
                </View>
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius["2xl"],
        borderWidth: 1,
        padding: Spacing.xl,
        ...Shadows.card,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    circleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    emojiContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    avatarSection: {
        marginBottom: Spacing.lg,
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#000',
    },
    remainingBadge: {
        marginLeft: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
});
