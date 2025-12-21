import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { CircleMember, MemberStatus } from "@/data/mockData";

interface MemberStatusRowProps {
    member: CircleMember;
    onPress?: () => void;
}

const statusConfig: Record<MemberStatus, { label: string; color: string; icon: string }> = {
    ready: { label: 'Ready', color: Colors.light.success, icon: 'check-circle' },
    getting_ready: { label: 'Getting Ready', color: Colors.light.warning, icon: 'clock' },
    running_late: { label: 'Running Late', color: Colors.light.error, icon: 'alert-circle' },
    offline: { label: 'Offline', color: '#6B7280', icon: 'moon' },
};

export function MemberStatusRow({ member, onPress }: MemberStatusRowProps) {
    const { theme } = useTheme();
    const config = statusConfig[member.status];

    return (
        <Pressable
            onPress={onPress}
            style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
        >
            <View style={styles.leftSection}>
                <View style={styles.avatarContainer}>
                    <Avatar uri={member.avatar} size={44} />
                    {member.isLocationSharing && (
                        <View style={[styles.locationBadge, { backgroundColor: Colors.light.primary }]}>
                            <Feather name="map-pin" size={10} color="#FFF" />
                        </View>
                    )}
                </View>
                <View style={styles.nameSection}>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>{member.name}</ThemedText>
                    {member.eta && member.status === 'running_late' && (
                        <ThemedText type="tiny" style={{ color: theme.textMuted }}>
                            ETA: {member.eta}m away
                        </ThemedText>
                    )}
                </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                <Feather name={config.icon as any} size={14} color={config.color} />
                <ThemedText type="tiny" style={{ color: config.color, fontWeight: '600' }}>
                    {config.label}
                </ThemedText>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatarContainer: {
        position: 'relative',
    },
    locationBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    nameSection: {
        gap: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
});
