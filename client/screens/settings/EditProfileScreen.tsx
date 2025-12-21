import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    Image,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { currentUser, categories } from "@/data/mockData";

type EditProfileNavigationProp = NativeStackNavigationProp<any>;

interface FormFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "email-address" | "phone-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    multiline?: boolean;
    maxLength?: number;
}

function FormField({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    autoCapitalize = "sentences",
    multiline = false,
    maxLength,
}: FormFieldProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.fieldContainer}>
            <ThemedText type="small" style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                {label}
            </ThemedText>
            <TextInput
                style={[
                    styles.textInput,
                    {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                        color: theme.text,
                    },
                    multiline && styles.multilineInput,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.textMuted}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                maxLength={maxLength}
            />
            {maxLength && (
                <ThemedText type="tiny" style={[styles.charCount, { color: theme.textMuted }]}>
                    {value.length}/{maxLength}
                </ThemedText>
            )}
        </View>
    );
}

// Interest categories without "All"
const interestOptions = categories.filter(c => c !== "All");

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<EditProfileNavigationProp>();
    const { theme, isDark } = useTheme();

    // Form state
    const [displayName, setDisplayName] = useState(currentUser.name);
    const [bio, setBio] = useState("Living for the weekend vibes 🎉");
    const [email, setEmail] = useState("vincent@example.com");
    const [phone, setPhone] = useState("+254 712 345 678");
    const [avatarUri, setAvatarUri] = useState(currentUser.avatar);
    const [selectedInterests, setSelectedInterests] = useState<string[]>(["Music", "Nightlife", "Food"]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    useEffect(() => {
        // In a real app, compare against original values from Supabase
        setHasChanges(true);
    }, [displayName, bio, email, phone, avatarUri, selectedInterests]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const toggleInterest = (interest: string) => {
        Haptics.selectionAsync();
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert("Error", "Display name is required.");
            return;
        }

        setIsSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // TODO: Implement actual save to Supabase
            // const { error } = await supabase
            //   .from('users')
            //   .update({
            //     display_name: displayName,
            //     bio,
            //     interests: selectedInterests,
            //   })
            //   .eq('id', userId);

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Your profile has been updated.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (hasChanges) {
            Alert.alert(
                "Unsaved Changes",
                "You have unsaved changes. Are you sure you want to leave?",
                [
                    { text: "Stay", style: "cancel" },
                    { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{
                    paddingTop: insets.top + Spacing.lg,
                    paddingBottom: insets.bottom + Spacing["3xl"],
                    paddingHorizontal: Spacing.xl,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={handleBack}
                        style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
                    >
                        <Feather name="x" size={22} color={theme.text} />
                    </Pressable>
                    <ThemedText type="h3">Edit Profile</ThemedText>
                    <Pressable
                        onPress={handleSave}
                        disabled={isSaving}
                        style={[
                            styles.saveButton,
                            { backgroundColor: Colors.light.primary },
                            isSaving && { opacity: 0.6 },
                        ]}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <ThemedText type="small" style={{ color: "#FFF", fontWeight: "700" }}>
                                Save
                            </ThemedText>
                        )}
                    </Pressable>
                </View>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <Pressable onPress={handlePickImage} style={styles.avatarContainer}>
                        <Avatar uri={avatarUri} size={100} />
                        <View style={[styles.cameraButton, { backgroundColor: Colors.light.primary }]}>
                            <Feather name="camera" size={16} color="#FFF" />
                        </View>
                    </Pressable>
                    <Pressable onPress={handlePickImage}>
                        <ThemedText type="small" style={{ color: Colors.light.primary, marginTop: Spacing.md }}>
                            Change Photo
                        </ThemedText>
                    </Pressable>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <ThemedText type="tiny" style={[styles.sectionLabel, { color: theme.textMuted }]}>
                        BASIC INFO
                    </ThemedText>

                    <FormField
                        label="Display Name"
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Your name"
                        autoCapitalize="words"
                    />

                    <FormField
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell people about yourself..."
                        multiline
                        maxLength={150}
                    />
                </View>

                <View style={styles.formSection}>
                    <ThemedText type="tiny" style={[styles.sectionLabel, { color: theme.textMuted }]}>
                        CONTACT INFO
                    </ThemedText>

                    <FormField
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <FormField
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+254 712 345 678"
                        keyboardType="phone-pad"
                    />
                    <ThemedText type="tiny" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                        Used for M-Pesa payments and account recovery
                    </ThemedText>
                </View>

                {/* Interests Section */}
                <View style={styles.formSection}>
                    <ThemedText type="tiny" style={[styles.sectionLabel, { color: theme.textMuted }]}>
                        INTERESTS
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
                        Select categories you're interested in for personalized recommendations
                    </ThemedText>

                    <View style={styles.interestsGrid}>
                        {interestOptions.map(interest => {
                            const isSelected = selectedInterests.includes(interest);
                            return (
                                <Pressable
                                    key={interest}
                                    onPress={() => toggleInterest(interest)}
                                    style={[
                                        styles.interestChip,
                                        {
                                            backgroundColor: isSelected ? Colors.light.primaryMuted : theme.backgroundSecondary,
                                            borderColor: isSelected ? Colors.light.primary : theme.border,
                                        },
                                    ]}
                                >
                                    {isSelected && (
                                        <Feather name="check" size={14} color={Colors.light.primary} />
                                    )}
                                    <ThemedText
                                        type="small"
                                        style={{
                                            color: isSelected ? Colors.light.primary : theme.textSecondary,
                                            fontWeight: isSelected ? "600" : "400",
                                        }}
                                    >
                                        {interest}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Connected Accounts */}
                <View style={styles.formSection}>
                    <ThemedText type="tiny" style={[styles.sectionLabel, { color: theme.textMuted }]}>
                        CONNECTED ACCOUNTS
                    </ThemedText>

                    <View style={[styles.connectedAccount, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                        <View style={[styles.accountIcon, { backgroundColor: "#1DB954" }]}>
                            <Feather name="music" size={18} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText type="body">Spotify</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>Not connected</ThemedText>
                        </View>
                        <Pressable
                            style={[styles.connectButton, { borderColor: Colors.light.primary }]}
                            onPress={() => Alert.alert("Spotify", "Spotify authentication coming soon!")}
                        >
                            <ThemedText type="small" style={{ color: Colors.light.primary }}>Connect</ThemedText>
                        </Pressable>
                    </View>
                </View>
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
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    saveButton: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        minWidth: 70,
        alignItems: "center",
    },
    avatarSection: {
        alignItems: "center",
        marginBottom: Spacing["2xl"],
    },
    avatarContainer: {
        position: "relative",
    },
    cameraButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#000",
    },
    formSection: {
        marginBottom: Spacing["2xl"],
    },
    sectionLabel: {
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
    fieldContainer: {
        marginBottom: Spacing.lg,
    },
    fieldLabel: {
        marginBottom: Spacing.sm,
    },
    textInput: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        fontSize: 16,
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    charCount: {
        textAlign: "right",
        marginTop: Spacing.xs,
    },
    interestsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    interestChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    connectedAccount: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.md,
    },
    accountIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    connectButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
    },
});
