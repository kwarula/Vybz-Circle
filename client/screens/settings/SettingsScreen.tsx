import React from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    Linking,
    Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { currentUser } from "@/data/mockData";

type SettingsNavigationProp = NativeStackNavigationProp<any>;

interface SettingItemProps {
    icon: string;
    iconFamily?: "feather" | "ionicons";
    label: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
    showArrow?: boolean;
}

function SettingItem({
    icon,
    iconFamily = "feather",
    label,
    subtitle,
    onPress,
    rightElement,
    danger = false,
    showArrow = true,
}: SettingItemProps) {
    const { theme } = useTheme();

    const IconComponent = iconFamily === "ionicons" ? Ionicons : Feather;
    const iconColor = danger ? Colors.light.error : Colors.light.primary;

    return (
        <Pressable
            onPress={() => {
                if (onPress) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }
            }}
            style={({ pressed }) => [
                styles.settingItem,
                { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: danger ? "rgba(239, 68, 68, 0.1)" : Colors.light.primaryMuted }]}>
                <IconComponent name={icon as any} size={20} color={iconColor} />
            </View>
            <View style={styles.settingContent}>
                <ThemedText type="body" style={[danger && { color: Colors.light.error }]}>
                    {label}
                </ThemedText>
                {subtitle && (
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                        {subtitle}
                    </ThemedText>
                )}
            </View>
            {rightElement || (showArrow && onPress && (
                <Feather name="chevron-right" size={20} color={theme.textMuted} />
            ))}
        </Pressable>
    );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
    const { theme } = useTheme();
    return (
        <View style={styles.section}>
            <ThemedText type="tiny" style={[styles.sectionTitle, { color: theme.textMuted }]}>
                {title}
            </ThemedText>
            <View style={[styles.sectionContent, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                {children}
            </View>
        </View>
    );
}

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<SettingsNavigationProp>();
    const { theme, isDark } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [locationEnabled, setLocationEnabled] = React.useState(true);

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out of your account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            const { error } = await supabase.auth.signOut();
                            if (error) {
                                Alert.alert("Error", error.message);
                            }
                        } catch (e) {
                            console.error(e);
                            Alert.alert("Error", "Failed to log out");
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action is permanent and cannot be undone. All your data, tickets, and wallet balance will be lost.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Account",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert(
                            "Are you absolutely sure?",
                            "Type 'DELETE' to confirm account deletion.",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "I understand, delete",
                                    style: "destructive",
                                    onPress: async () => {
                                        // TODO: Implement account deletion
                                        Alert.alert("Account Deletion", "Please contact support to complete account deletion.");
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const openLink = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{
                    paddingTop: insets.top + Spacing.lg,
                    paddingBottom: insets.bottom + Spacing["3xl"],
                    paddingHorizontal: Spacing.lg,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
                    >
                        <Feather name="arrow-left" size={22} color={theme.text} />
                    </Pressable>
                    <ThemedText type="h2">Settings</ThemedText>
                    <View style={{ width: 44 }} />
                </View>

                {/* Profile Card */}
                <Pressable
                    onPress={() => navigation.navigate("EditProfile")}
                    style={({ pressed }) => [
                        styles.profileCard,
                        {
                            backgroundColor: theme.backgroundDefault,
                            borderColor: theme.border,
                            opacity: pressed ? 0.9 : 1,
                        },
                    ]}
                >
                    <Avatar uri={currentUser.avatar} size={64} />
                    <View style={styles.profileInfo}>
                        <ThemedText type="h3">{currentUser.name}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            Edit Profile
                        </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={22} color={theme.textMuted} />
                </Pressable>

                {/* Account Section */}
                <SettingSection title="ACCOUNT">
                    <SettingItem
                        icon="user"
                        label="Edit Profile"
                        subtitle="Name, photo, interests"
                        onPress={() => navigation.navigate("EditProfile")}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="wallet"
                        iconFamily="ionicons"
                        label="Wallet & Payments"
                        subtitle="M-Pesa, balance, transactions"
                        onPress={() => navigation.navigate("Wallet")}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="ticket-outline"
                        iconFamily="ionicons"
                        label="My Tickets"
                        onPress={() => navigation.navigate("MyTickets")}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="shield"
                        label="Safety Center"
                        subtitle="Emergency contacts, SOS"
                        onPress={() => navigation.navigate("SafetySettings")}
                    />
                </SettingSection>

                {/* Preferences Section */}
                <SettingSection title="PREFERENCES">
                    <SettingItem
                        icon="bell"
                        label="Push Notifications"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: theme.border, true: Colors.light.primaryMuted }}
                                thumbColor={notificationsEnabled ? Colors.light.primary : theme.textMuted}
                            />
                        }
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="map-pin"
                        label="Location Services"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={locationEnabled}
                                onValueChange={setLocationEnabled}
                                trackColor={{ false: theme.border, true: Colors.light.primaryMuted }}
                                thumbColor={locationEnabled ? Colors.light.primary : theme.textMuted}
                            />
                        }
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="globe"
                        label="Language"
                        subtitle="English"
                        onPress={() => Alert.alert("Coming Soon", "Language selection is under development.")}
                    />
                </SettingSection>

                {/* Safety Section */}
                <SettingSection title="SAFETY">
                    <SettingItem
                        icon="shield"
                        label="Emergency Contacts"
                        subtitle="Set up trusted contacts for SOS"
                        onPress={() => Alert.alert("Coming Soon", "Safety settings are under development.")}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="alert-circle"
                        label="SOS Settings"
                        subtitle="Double-tap, shake trigger options"
                        onPress={() => Alert.alert("Coming Soon", "SOS settings are under development.")}
                    />
                </SettingSection>

                {/* About Section */}
                <SettingSection title="ABOUT">
                    <SettingItem
                        icon="file-text"
                        label="Terms of Service"
                        onPress={() => openLink("https://vybzcircle.com/terms")}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="lock"
                        label="Privacy Policy"
                        onPress={() => openLink("https://vybzcircle.com/privacy")}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="help-circle"
                        label="Help & Support"
                        onPress={() => openLink("https://vybzcircle.com/support")}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="info"
                        label="App Version"
                        subtitle="1.0.0 (Build 1)"
                        showArrow={false}
                    />
                </SettingSection>

                {/* Danger Zone */}
                <SettingSection title="DANGER ZONE">
                    <SettingItem
                        icon="log-out"
                        label="Log Out"
                        danger
                        onPress={handleLogout}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingItem
                        icon="trash-2"
                        label="Delete Account"
                        subtitle="Permanently delete your account"
                        danger
                        onPress={handleDeleteAccount}
                    />
                </SettingSection>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing["2xl"],
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing["2xl"],
        gap: Spacing.lg,
    },
    profileInfo: {
        flex: 1,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        marginBottom: Spacing.sm,
        marginLeft: Spacing.sm,
        letterSpacing: 1,
    },
    sectionContent: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: "hidden",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: "center",
        justifyContent: "center",
    },
    settingContent: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginLeft: Spacing.lg + 40 + Spacing.md,
    },
});
