import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import type { MemberStatus } from "@/data/mockData";

interface StatusOption {
    status: MemberStatus;
    label: string;
    description: string;
    icon: string;
    color: string;
}

const statusOptions: StatusOption[] = [
    {
        status: 'ready',
        label: 'Ready',
        description: 'All set and ready to go!',
        icon: 'check-circle',
        color: Colors.light.success,
    },
    {
        status: 'getting_ready',
        label: 'Getting Ready',
        description: 'Almost done, give me a few...',
        icon: 'clock',
        color: Colors.light.warning,
    },
    {
        status: 'running_late',
        label: 'Running Late',
        description: "On my way, I'll be there soon!",
        icon: 'alert-circle',
        color: Colors.light.error,
    },
    {
        status: 'offline',
        label: 'Not Available',
        description: "Can't make it tonight",
        icon: 'moon',
        color: '#6B7280',
    },
];

interface StatusUpdateModalProps {
    currentStatus?: MemberStatus;
    onStatusChange?: (status: MemberStatus) => void;
}

export default function StatusUpdateScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme } = useTheme();

    const [selectedStatus, setSelectedStatus] = useState<MemberStatus>('ready');
    const [eta, setEta] = useState<number>(15);

    const handleSelectStatus = (status: MemberStatus) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedStatus(status);
    };

    const handleConfirm = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // In a real app, this would update the user's status in the database
        navigation.goBack();
    };

    return (
        <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="x" size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h3">Update Status</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }}>
                    Let your Circle know what you're up to
                </ThemedText>

                {/* Status Options */}
                {statusOptions.map((option, index) => (
                    <Animated.View
                        key={option.status}
                        entering={FadeInDown.delay(index * 80).duration(400)}
                    >
                        <Pressable
                            onPress={() => handleSelectStatus(option.status)}
                            style={[
                                styles.statusOption,
                                {
                                    backgroundColor: selectedStatus === option.status
                                        ? option.color + '20'
                                        : theme.backgroundSecondary,
                                    borderColor: selectedStatus === option.status
                                        ? option.color
                                        : 'transparent',
                                }
                            ]}
                        >
                            <View style={[styles.statusIcon, { backgroundColor: option.color + '20' }]}>
                                <Feather name={option.icon as any} size={24} color={option.color} />
                            </View>
                            <View style={styles.statusInfo}>
                                <ThemedText type="body" style={{ fontWeight: '700' }}>{option.label}</ThemedText>
                                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                    {option.description}
                                </ThemedText>
                            </View>
                            <View style={[
                                styles.radio,
                                {
                                    borderColor: selectedStatus === option.status ? option.color : theme.textMuted,
                                    backgroundColor: selectedStatus === option.status ? option.color : 'transparent',
                                }
                            ]}>
                                {selectedStatus === option.status && (
                                    <Feather name="check" size={14} color="#FFF" />
                                )}
                            </View>
                        </Pressable>
                    </Animated.View>
                ))}

                {/* ETA Input for Running Late */}
                {selectedStatus === 'running_late' && (
                    <Animated.View
                        entering={FadeInDown.duration(300)}
                        style={[styles.etaSection, { backgroundColor: theme.backgroundSecondary }]}
                    >
                        <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.md }}>
                            HOW LONG WILL YOU BE?
                        </ThemedText>
                        <View style={styles.etaButtons}>
                            {[5, 10, 15, 30, 45].map((minutes) => (
                                <Pressable
                                    key={minutes}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setEta(minutes);
                                    }}
                                    style={[
                                        styles.etaButton,
                                        {
                                            backgroundColor: eta === minutes ? Colors.light.error : theme.backgroundTertiary,
                                        }
                                    ]}
                                >
                                    <ThemedText
                                        type="small"
                                        style={{
                                            color: eta === minutes ? '#FFF' : theme.text,
                                            fontWeight: '600',
                                        }}
                                    >
                                        {minutes}m
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Confirm Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
                <Pressable
                    onPress={handleConfirm}
                    style={[styles.confirmButton, { backgroundColor: Colors.light.primary }]}
                >
                    <ThemedText type="body" style={{ color: '#FFF', fontWeight: '700' }}>
                        Update Status
                    </ThemedText>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        borderWidth: 2,
        gap: Spacing.md,
    },
    statusIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusInfo: {
        flex: 1,
        gap: 4,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    etaSection: {
        marginTop: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
    },
    etaButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    etaButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    footer: {
        padding: Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    confirmButton: {
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
});
