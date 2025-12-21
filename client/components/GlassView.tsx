import React from "react";
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius } from "@/constants/theme";

interface GlassViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
}

export function GlassView({ children, style, intensity = 40 }: GlassViewProps) {
    const { isDark, theme } = useTheme();

    // On Android, BlurView doesn't work well, use solid semi-transparent background
    if (Platform.OS === "android") {
        return (
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: isDark
                            ? "rgba(10, 10, 10, 0.85)"  // True black base
                            : "rgba(255, 255, 255, 0.9)",
                        borderColor: isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(0, 0, 0, 0.05)",
                    },
                    style,
                ]}
            >
                {children}
            </View>
        );
    }

    // iOS & Web - Use BlurView
    return (
        <BlurView
            intensity={intensity}
            tint={isDark ? "dark" : "light"}
            style={[
                styles.container,
                {
                    backgroundColor: isDark
                        ? "rgba(10, 10, 10, 0.6)"  // True black with transparency
                        : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                },
                style,
            ]}
        >
            {children}
        </BlurView>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: "hidden",
        borderWidth: 1,
        borderRadius: BorderRadius.md,
    },
});
