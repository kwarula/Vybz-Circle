import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

export interface QuickAction {
    id: string;
    icon: string;
    iconFamily?: 'feather' | 'material';
    label: string;
    color?: string;
    onPress: () => void;
}

interface QuickActionBarProps {
    actions: QuickAction[];
}

export function QuickActionBar({ actions }: QuickActionBarProps) {
    const { theme } = useTheme();

    const handlePress = (action: QuickAction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        action.onPress();
    };

    const renderIcon = (action: QuickAction) => {
        const color = action.color || Colors.light.primary;
        if (action.iconFamily === 'material') {
            return <MaterialCommunityIcons name={action.icon as any} size={22} color={color} />;
        }
        return <Feather name={action.icon as any} size={22} color={color} />;
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {actions.map((action) => (
                <Pressable
                    key={action.id}
                    onPress={() => handlePress(action)}
                    style={({ pressed }) => [
                        styles.actionButton,
                        {
                            backgroundColor: theme.backgroundSecondary,
                            opacity: pressed ? 0.8 : 1,
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                        }
                    ]}
                >
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: (action.color || Colors.light.primary) + '20' }
                        ]}
                    >
                        {renderIcon(action)}
                    </View>
                    <ThemedText type="tiny" style={{ color: theme.text }}>
                        {action.label}
                    </ThemedText>
                </Pressable>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    actionButton: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        minWidth: 80,
        gap: Spacing.sm,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
