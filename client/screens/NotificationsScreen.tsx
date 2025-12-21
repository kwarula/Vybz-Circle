import React from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

interface Notification {
    id: string;
    type: "event" | "social" | "promo";
    title: string;
    message: string;
    time: string;
    read: boolean;
    avatar?: string;
    icon?: string;
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "event",
        title: "Amapiano Night",
        message: "is happening tomorrow! Don't forget your tickets.",
        time: "2 hours ago",
        read: false,
        icon: "calendar",
    },
    {
        id: "2",
        type: "social",
        title: "Sarah Kimani",
        message: "joined your crew 'Weekend Warriors'",
        time: "5 hours ago",
        read: false,
        avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
        id: "3",
        type: "promo",
        title: "New Event Near You",
        message: "Sunset Yoga & Chill in Westlands - Free entry!",
        time: "1 day ago",
        read: true,
        icon: "map-pin",
    },
    {
        id: "4",
        type: "social",
        title: "James Odhiambo",
        message: "is also going to Rooftop Sundowner",
        time: "2 days ago",
        read: true,
        avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
        id: "5",
        type: "event",
        title: "Ticket Reminder",
        message: "Your ticket for Tech Meetup is ready to use",
        time: "3 days ago",
        read: true,
        icon: "tag",
    },
];

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme } = useTheme();

    const unreadCount = mockNotifications.filter((n) => !n.read).length;

    const renderNotification = ({ item, index }: { item: Notification; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
            <Pressable
                style={[
                    styles.notificationCard,
                    { backgroundColor: theme.backgroundDefault },
                    !item.read && styles.unreadCard,
                    Shadows.card,
                ]}
            >
                {/* Icon or Avatar */}
                <View style={[styles.iconContainer, { backgroundColor: item.read ? theme.backgroundSecondary : Colors.light.primary + "20" }]}>
                    {item.avatar ? (
                        <Avatar uri={item.avatar} size={40} />
                    ) : (
                        <Feather
                            name={item.icon as any || "bell"}
                            size={20}
                            color={item.read ? theme.textSecondary : Colors.light.primary}
                        />
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <ThemedText type="body" style={!item.read && { fontWeight: "600" }}>
                        <ThemedText type="body" style={{ fontWeight: "700" }}>{item.title}</ThemedText>
                        {" "}{item.message}
                    </ThemedText>
                    <ThemedText type="tiny" secondary style={{ marginTop: 4 }}>{item.time}</ThemedText>
                </View>

                {/* Unread dot */}
                {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h2">Notifications</ThemedText>
                <View style={styles.headerRight}>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <ThemedText type="tiny" style={styles.unreadText}>{unreadCount} new</ThemedText>
                        </View>
                    )}
                </View>
            </View>

            {/* Notifications List */}
            <FlatList
                data={mockNotifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="bell-off" size={48} color={theme.textMuted} />
                        <ThemedText type="body" secondary style={{ marginTop: Spacing.md }}>
                            No notifications yet
                        </ThemedText>
                    </View>
                }
            />
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
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backButton: {
        marginRight: Spacing.md,
    },
    headerRight: {
        flex: 1,
        alignItems: "flex-end",
    },
    unreadBadge: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    unreadText: {
        color: "#FFF",
        fontWeight: "600",
    },
    list: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    notificationCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.md,
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.light.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.light.primary,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 100,
    },
});
