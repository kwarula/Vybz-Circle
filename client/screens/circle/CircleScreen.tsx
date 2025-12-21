import React, { useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { CircleCard } from "@/components/CircleCard";
import { QuickActionBar, QuickAction } from "@/components/QuickActionBar";
import { MemberStatusRow } from "@/components/MemberStatusRow";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, BorderRadius, Shadows, Typography } from "@/constants/theme";
import { currentCircle, mockCircles } from "@/data/mockData";

export default function CircleScreen() {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const navigation = useNavigation<any>();
    const { theme, isDark } = useTheme();

    const circle = currentCircle;

    const handleChat = useCallback(() => {
        // Navigate to existing chat with this circle
        navigation.navigate("Chat", { messageId: "1" });
    }, [navigation]);

    const handleSplitBill = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate("BillSplit");
    }, [navigation]);

    const handleLocation = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate("LocationShare");
    }, [navigation]);

    const handlePlans = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (circle.activeEvent) {
            navigation.navigate("EventDetail", { eventId: circle.activeEvent.id });
        } else {
            Alert.alert("No Plans Yet", "Browse events and add one to your Circle's plans!");
        }
    }, [navigation, circle.activeEvent]);

    const handleSOS = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "🆘 SOS Alert",
            "Send an emergency alert to all Circle members with your location?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send SOS", style: "destructive", onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        Alert.alert("Alert Sent", "Your Circle has been notified.");
                    }
                }
            ]
        );
    }, []);

    const handleRide = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to ride request with event venue as destination if there's an active event
        if (circle.activeEvent) {
            navigation.navigate("RideRequest", {
                dropoff: {
                    latitude: -1.2870,
                    longitude: 36.7880,
                    nickname: circle.activeEvent.venue || circle.activeEvent.title,
                },
                venueName: circle.activeEvent.venue || circle.activeEvent.title,
            });
        } else {
            navigation.navigate("RideRequest", {
                dropoff: {
                    latitude: -1.2921,
                    longitude: 36.8219,
                    nickname: 'Home',
                },
                venueName: 'Home',
            });
        }
    }, [navigation, circle.activeEvent]);

    const quickActions: QuickAction[] = [
        { id: "chat", icon: "message-circle", label: "Chat", onPress: handleChat },
        { id: "split", icon: "cash-multiple", iconFamily: "material", label: "Split Bill", onPress: handleSplitBill },
        { id: "ride", icon: "car", iconFamily: "material", label: "Get Ride", color: '#000', onPress: handleRide },
        { id: "location", icon: "map-pin", label: "Location", color: Colors.light.success, onPress: handleLocation },
        { id: "sos", icon: "alert-triangle", label: "SOS", color: Colors.light.error, onPress: handleSOS },
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'location_share': return 'map-pin';
            case 'event_add': return 'calendar';
            case 'check_in': return 'check-circle';
            case 'message': return 'message-circle';
            case 'bill_split': return 'dollar-sign';
            default: return 'activity';
        }
    };

    return (
        <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
            <StatusBar style={isDark ? "light" : "dark"} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: insets.top + Spacing.lg,
                    paddingBottom: tabBarHeight + Spacing["3xl"],
                    paddingHorizontal: Spacing.xl,
                }}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <View>
                        <ThemedText type="small" style={{ color: theme.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
                            Your Squad
                        </ThemedText>
                        <ThemedText type="h1">My Circle</ThemedText>
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable
                            onPress={() => navigation.navigate("CreateCrew")}
                            style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
                        >
                            <Feather name="plus-circle" size={20} color={theme.text} />
                        </Pressable>
                        <Pressable
                            onPress={() => Alert.alert("Settings", "Circle settings coming soon!")}
                            style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}
                        >
                            <Feather name="settings" size={20} color={theme.text} />
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Circle Selector if multiple circles */}
                {mockCircles.length > 1 && (
                    <Animated.View entering={FadeInRight.delay(100).duration(400)}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.circleTabs}
                            contentContainerStyle={{ gap: Spacing.sm }}
                        >
                            {mockCircles.map((c, index) => (
                                <Pressable
                                    key={c.id}
                                    style={[
                                        styles.circleTab,
                                        {
                                            backgroundColor: c.id === circle.id ? c.color + '30' : theme.backgroundSecondary,
                                            borderColor: c.id === circle.id ? c.color : 'transparent',
                                        }
                                    ]}
                                >
                                    <ThemedText style={{ fontSize: 16 }}>{c.emoji}</ThemedText>
                                    <ThemedText type="small" style={{ color: c.id === circle.id ? c.color : theme.text }}>
                                        {c.name}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* Active Circle Card */}
                <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                    <CircleCard circle={circle} onPress={() => { }} />
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
                    <QuickActionBar actions={quickActions} />
                </Animated.View>

                {/* Tonight's Plan */}
                {circle.activeEvent && (
                    <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
                        <ThemedText type="h3" style={styles.sectionTitle}>Tonight's Plan</ThemedText>
                        <Pressable
                            onPress={handlePlans}
                            style={[styles.eventCard, { backgroundColor: theme.backgroundSecondary }]}
                        >
                            <View style={[styles.eventIcon, { backgroundColor: Colors.light.primary + '20' }]}>
                                <Ionicons name="musical-notes" size={24} color={Colors.light.primary} />
                            </View>
                            <View style={styles.eventInfo}>
                                <ThemedText type="body" style={{ fontWeight: '600' }}>{circle.activeEvent.title}</ThemedText>
                                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                    {circle.activeEvent.date} • {circle.activeEvent.time}
                                </ThemedText>
                                <ThemedText type="tiny" style={{ color: Colors.light.primary, marginTop: 4 }}>
                                    {circle.members.filter(m => m.status !== 'offline').length} going
                                </ThemedText>
                            </View>
                            <Feather name="chevron-right" size={20} color={theme.textMuted} />
                        </Pressable>
                    </Animated.View>
                )}

                {/* Squad Status */}
                <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.section}>
                    <ThemedText type="h3" style={styles.sectionTitle}>Squad Status</ThemedText>
                    {circle.members.map((member, index) => (
                        <Animated.View key={member.id} entering={FadeInDown.delay(500 + index * 50).duration(400)}>
                            <MemberStatusRow
                                member={member}
                                onPress={() => Alert.alert(member.name, `Tap to message ${member.name}`)}
                            />
                        </Animated.View>
                    ))}
                </Animated.View>

                {/* Recent Activity */}
                <Animated.View entering={FadeInDown.delay(650).duration(500)} style={styles.section}>
                    <ThemedText type="h3" style={styles.sectionTitle}>Recent Activity</ThemedText>
                    <View style={[styles.activityList, { backgroundColor: theme.backgroundSecondary }]}>
                        {circle.recentActivity.slice(0, 4).map((activity, index) => (
                            <View
                                key={activity.id}
                                style={[
                                    styles.activityItem,
                                    index < circle.recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                                ]}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: Colors.light.primary + '15' }]}>
                                    <Feather name={getActivityIcon(activity.type) as any} size={14} color={Colors.light.primary} />
                                </View>
                                <View style={styles.activityContent}>
                                    <ThemedText type="small">{activity.description}</ThemedText>
                                    <ThemedText type="tiny" style={{ color: theme.textMuted }}>{activity.timestamp}</ThemedText>
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Get Home Safe CTA */}
                <Animated.View entering={FadeInDown.delay(750).duration(500)} style={styles.section}>
                    <Pressable
                        onPress={handleRide}
                        style={styles.getHomeSafeButton}
                    >
                        <View style={styles.uberIconContainer}>
                            <MaterialCommunityIcons name="car" size={24} color="#FFF" />
                        </View>
                        <View style={styles.getHomeSafeContent}>
                            <ThemedText type="body" style={{ fontWeight: '700', color: '#FFF' }}>
                                Get Home Safe
                            </ThemedText>
                            <ThemedText type="tiny" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                Book a ride with Uber
                            </ThemedText>
                        </View>
                        <Feather name="chevron-right" size={20} color="#FFF" />
                    </Pressable>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleTabs: {
        marginBottom: Spacing.xl,
    },
    circleTab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    section: {
        marginBottom: Spacing.section,
    },
    sectionTitle: {
        marginBottom: Spacing.lg,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: Spacing.md,
    },
    eventIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventInfo: {
        flex: 1,
    },
    activityList: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityContent: {
        flex: 1,
        gap: 2,
    },
    getHomeSafeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: Spacing.md,
    },
    uberIconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    getHomeSafeContent: {
        flex: 1,
        gap: 2,
    },
});
