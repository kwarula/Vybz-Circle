import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Switch, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { currentCircle, CircleMember } from "@/data/mockData";

const { width, height } = Dimensions.get('window');

// Mock member locations
const memberLocations: Record<string, { latitude: number; longitude: number }> = {
    "1": { latitude: -1.2836, longitude: 36.8230 }, // Alex
    "2": { latitude: -1.2900, longitude: 36.8100 }, // Sarah
    "3": { latitude: -1.2750, longitude: 36.8300 }, // James
    "4": { latitude: -1.2950, longitude: 36.8050 }, // Lisa
};

// Web fallback map component
function WebMapFallback({ sharingMembers, isSharing, onMemberPress }: {
    sharingMembers: CircleMember[];
    isSharing: boolean;
    onMemberPress: (member: CircleMember) => void;
}) {
    const { theme } = useTheme();

    return (
        <View style={[styles.webMapFallback, { backgroundColor: '#1a1a2e' }]}>
            {/* Grid lines for map effect */}
            <View style={styles.mapGrid}>
                {[...Array(6)].map((_, i) => (
                    <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 16.66}%` }]} />
                ))}
                {[...Array(6)].map((_, i) => (
                    <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 16.66}%` }]} />
                ))}
            </View>

            {/* Map label */}
            <View style={styles.mapLabel}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color={Colors.light.primary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Nairobi, Kenya
                </ThemedText>
            </View>

            {/* Member pins - positioned pseudo-randomly */}
            {sharingMembers.map((member, index) => {
                const positions = [
                    { top: '25%', left: '60%' },
                    { top: '45%', left: '30%' },
                    { top: '35%', left: '70%' },
                    { top: '55%', left: '45%' },
                ];
                const pos = positions[index % positions.length];

                return (
                    <Pressable
                        key={member.id}
                        onPress={() => onMemberPress(member)}
                        style={[styles.webMapPin, pos]}
                    >
                        <View style={[styles.markerBubble, { borderColor: Colors.light.primary }]}>
                            <Avatar uri={member.avatar} size={36} />
                        </View>
                        <View style={[styles.markerArrow, { borderTopColor: Colors.light.primary }]} />
                    </Pressable>
                );
            })}

            {/* "You" marker */}
            {isSharing && (
                <View style={[styles.webMapPin, { top: '40%', left: '50%' }]}>
                    <View style={[styles.markerBubble, styles.youMarker]}>
                        <MaterialCommunityIcons name="account" size={24} color="#FFF" />
                    </View>
                    <View style={[styles.markerArrow, { borderTopColor: Colors.light.success }]} />
                    <ThemedText type="tiny" style={{ color: Colors.light.success, marginTop: 4 }}>You</ThemedText>
                </View>
            )}
        </View>
    );
}

export default function LocationShareScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme } = useTheme();

    const [isSharing, setIsSharing] = useState(false);
    const [selectedMember, setSelectedMember] = useState<CircleMember | null>(null);

    const sharingMembers = currentCircle.members.filter(m => m.isLocationSharing);

    const handleToggleSharing = (value: boolean) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setIsSharing(value);
        if (value) {
            Alert.alert(
                "Sharing Location",
                "Your Circle can now see your location for the next 2 hours.",
                [{ text: "OK" }]
            );
        }
    };

    const handleSOS = () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        Alert.alert(
            "🆘 Send SOS Alert?",
            "This will immediately notify all Circle members with your exact location.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send SOS",
                    style: "destructive",
                    onPress: () => {
                        if (Platform.OS !== 'web') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                        Alert.alert("🚨 SOS Sent!", "Your Circle has been alerted with your location.");
                    }
                }
            ]
        );
    };

    const handleCheckIn = () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
            "✓ Check-in Sent",
            "Your Circle knows you're safe!",
            [{ text: "OK" }]
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
            {/* Map - Web fallback or placeholder for native */}
            <WebMapFallback
                sharingMembers={sharingMembers}
                isSharing={isSharing}
                onMemberPress={setSelectedMember}
            />

            {/* Header Overlay */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.backgroundDefault }]}
                >
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h3">Live Location</ThemedText>
                <View style={{ width: 44 }} />
            </View>

            {/* Bottom Panel */}
            <Animated.View
                entering={FadeInDown.duration(500)}
                style={[styles.bottomPanel, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.md }]}
            >
                {/* Sharing Toggle */}
                <View style={[styles.sharingRow, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={styles.sharingInfo}>
                        <MaterialCommunityIcons
                            name={isSharing ? "broadcast" : "broadcast-off"}
                            size={24}
                            color={isSharing ? Colors.light.success : theme.textMuted}
                        />
                        <View>
                            <ThemedText type="body" style={{ fontWeight: '600' }}>
                                {isSharing ? "Sharing Location" : "Location Hidden"}
                            </ThemedText>
                            <ThemedText type="tiny" style={{ color: theme.textMuted }}>
                                {isSharing ? "Visible to your Circle for 2 hours" : "Your Circle can't see you"}
                            </ThemedText>
                        </View>
                    </View>
                    <Switch
                        value={isSharing}
                        onValueChange={handleToggleSharing}
                        trackColor={{ false: theme.backgroundTertiary, true: Colors.light.success + '50' }}
                        thumbColor={isSharing ? Colors.light.success : theme.textMuted}
                    />
                </View>

                {/* Sharing Members */}
                <View style={styles.membersSection}>
                    <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.md }}>
                        {sharingMembers.length} MEMBERS SHARING
                    </ThemedText>
                    <View style={styles.membersRow}>
                        {sharingMembers.map((member) => (
                            <Pressable
                                key={member.id}
                                onPress={() => setSelectedMember(member)}
                                style={styles.memberChip}
                            >
                                <Avatar uri={member.avatar} size={32} />
                                <ThemedText type="tiny">{member.name.split(' ')[0]}</ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <Pressable
                        onPress={handleCheckIn}
                        style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
                    >
                        <Feather name="check-circle" size={20} color="#FFF" />
                        <ThemedText type="small" style={{ color: '#FFF', fontWeight: '700' }}>Check In</ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={handleSOS}
                        style={[styles.actionButton, styles.sosButton]}
                    >
                        <MaterialCommunityIcons name="alert" size={20} color="#FFF" />
                        <ThemedText type="small" style={{ color: '#FFF', fontWeight: '700' }}>SOS</ThemedText>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Selected Member Card */}
            {selectedMember && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    style={[styles.memberCard, { backgroundColor: theme.backgroundDefault }]}
                >
                    <Pressable
                        onPress={() => setSelectedMember(null)}
                        style={styles.closeCard}
                    >
                        <Feather name="x" size={16} color={theme.textMuted} />
                    </Pressable>
                    <Avatar uri={selectedMember.avatar} size={48} />
                    <View style={styles.memberCardInfo}>
                        <ThemedText type="body" style={{ fontWeight: '600' }}>{selectedMember.name}</ThemedText>
                        <ThemedText type="tiny" style={{ color: theme.textMuted }}>
                            {selectedMember.status === 'running_late'
                                ? `ETA: ${selectedMember.eta}m away`
                                : 'Sharing location'}
                        </ThemedText>
                    </View>
                    <Pressable
                        onPress={() => {
                            if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            Alert.alert("Navigate", `Opening directions to ${selectedMember.name}...`);
                        }}
                        style={[styles.directionsButton, { backgroundColor: Colors.light.primary }]}
                    >
                        <Feather name="navigation" size={16} color="#FFF" />
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    webMapFallback: {
        width,
        height: height * 0.55,
        position: 'relative',
        overflow: 'hidden',
    },
    mapGrid: {
        ...StyleSheet.absoluteFillObject,
    },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    gridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    mapLabel: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    webMapPin: {
        position: 'absolute',
        alignItems: 'center',
        transform: [{ translateX: -22 }, { translateY: -50 }],
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: BorderRadius["2xl"],
        borderTopRightRadius: BorderRadius["2xl"],
        padding: Spacing.xl,
        ...Shadows.card,
    },
    sharingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
    },
    sharingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    membersSection: {
        marginBottom: Spacing.xl,
    },
    membersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    memberChip: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
    },
    sosButton: {
        backgroundColor: Colors.light.error,
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerBubble: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    youMarker: {
        borderColor: Colors.light.success,
        backgroundColor: Colors.light.success,
    },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -2,
    },
    memberCard: {
        position: 'absolute',
        top: 120,
        left: Spacing.xl,
        right: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: Spacing.md,
        ...Shadows.card,
    },
    closeCard: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        padding: Spacing.xs,
    },
    memberCardInfo: {
        flex: 1,
    },
    directionsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
