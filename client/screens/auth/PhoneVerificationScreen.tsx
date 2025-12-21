import React, { useState, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type PhoneVerificationRouteProp = RouteProp<{ PhoneVerification: { phone: string } }, "PhoneVerification">;
type NavigationProp = NativeStackNavigationProp<any>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function PhoneVerificationScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<PhoneVerificationRouteProp>();
    const { theme, isDark } = useTheme();

    const phone = route.params?.phone || "+254 712 345 678";

    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
    const [canResend, setCanResend] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    // Focus first input on mount
    useEffect(() => {
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newOtp = [...otp];

        // Handle paste (multiple characters)
        if (value.length > 1) {
            const chars = value.slice(0, OTP_LENGTH - index).split("");
            chars.forEach((char, i) => {
                if (index + i < OTP_LENGTH) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);

            const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            setFocusedIndex(nextIndex);

            // Auto-verify if complete
            if (newOtp.every(v => v !== "")) {
                handleVerify(newOtp.join(""));
            }
            return;
        }

        // Handle single character
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
            setFocusedIndex(index + 1);
        }

        // Auto-verify when complete
        if (value && index === OTP_LENGTH - 1 && newOtp.every(v => v !== "")) {
            handleVerify(newOtp.join(""));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            inputRefs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);
            const newOtp = [...otp];
            newOtp[index - 1] = "";
            setOtp(newOtp);
        }
    };

    const handleVerify = async (code: string) => {
        Keyboard.dismiss();
        setIsVerifying(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Early feedback for engagement

        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: phone.replace(/\s/g, ""),
                token: code,
                type: "sms",
            });

            if (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert("Verification Failed", error.message);
                setOtp(new Array(OTP_LENGTH).fill(""));
                inputRefs.current[0]?.focus();
                setFocusedIndex(0);
            } else {
                navigation.navigate("InterestSelection");
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCanResend(false);
        setResendTimer(RESEND_TIMEOUT);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone.replace(/\s/g, ""),
            });

            if (error) {
                Alert.alert("Error", error.message);
                setCanResend(true);
            } else {
                Alert.alert("Code Sent", "A new verification code has been sent to your phone.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to resend code. Please try again.");
            setCanResend(true);
        }
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <StatusBar style="light" />

            <Animated.View
                entering={FadeInDown.duration(800)}
                style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
            >
                {/* Back Button */}
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                    <Feather name="arrow-left" size={22} color={theme.text} />
                </Pressable>

                {/* Header */}
                <View style={styles.header}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: Colors.light.primaryMuted }]}>
                        <Feather name="smartphone" size={32} color={Colors.light.primary} />
                    </View>

                    {/* Title */}
                    <ThemedText type="h1" style={styles.title}>
                        Verify your phone
                    </ThemedText>
                    <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
                        We sent a 6-digit code to
                    </ThemedText>
                    <ThemedText type="h4" style={{ textAlign: "center", marginTop: Spacing.xs }}>
                        {phone}
                    </ThemedText>
                </View>

                {/* OTP Input */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                {
                                    backgroundColor: theme.backgroundSecondary,
                                    borderColor: focusedIndex === index ? Colors.light.primary : theme.border,
                                    color: theme.text,
                                },
                                digit && { borderColor: Colors.light.primary },
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            onFocus={() => setFocusedIndex(index)}
                            keyboardType="number-pad"
                            maxLength={index === 0 ? OTP_LENGTH : 1}
                            selectTextOnFocus
                            editable={!isVerifying}
                        />
                    ))}
                </Animated.View>

                {/* Verify Button */}
                <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.buttonContainer}>
                    <Pressable
                        onPress={() => handleVerify(otp.join(""))}
                        disabled={isVerifying || otp.some(v => !v)}
                        style={({ pressed }) => [
                            styles.verifyButton,
                            {
                                backgroundColor: Colors.light.primary,
                                opacity: isVerifying || otp.some(v => !v) ? 0.6 : pressed ? 0.9 : 1,
                            },
                        ]}
                    >
                        {isVerifying ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <ThemedText type="h4" style={{ color: "#FFF" }}>
                                    Verify
                                </ThemedText>
                                <Feather name="arrow-right" size={20} color="#FFF" />
                            </>
                        )}
                    </Pressable>
                </Animated.View>

                {/* Resend */}
                <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.resendContainer}>
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                        Didn't receive the code?
                    </ThemedText>
                    <Pressable onPress={handleResend} disabled={!canResend}>
                        <ThemedText
                            type="small"
                            style={{
                                color: canResend ? Colors.light.primary : theme.textMuted,
                                fontWeight: "600",
                            }}
                        >
                            {canResend ? "Resend Code" : `Resend in ${formatTimer(resendTimer)}`}
                        </ThemedText>
                    </Pressable>
                </Animated.View>
            </Animated.View>

            {/* Skip for development */}
            <Pressable
                onPress={() => {
                    Alert.alert(
                        "Skip Verification",
                        "This is for development only. In production, phone verification is required.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Skip", onPress: () => navigation.navigate("Main") },
                        ]
                    );
                }}
                style={[styles.skipButton, { bottom: insets.bottom + Spacing.xl }]}
            >
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                    Skip for now (Dev only)
                </ThemedText>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        alignItems: "center",
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: Spacing.xl,
    },
    title: {
        textAlign: "center",
        marginBottom: Spacing.md,
    },
    subtitle: {
        textAlign: "center",
    },
    otpContainer: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing["3xl"],
        marginBottom: Spacing["2xl"],
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    buttonContainer: {
        width: "100%",
    },
    verifyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        height: 56,
        borderRadius: BorderRadius.lg,
    },
    resendContainer: {
        alignItems: "center",
        marginTop: Spacing.xl,
        gap: Spacing.xs,
    },
    skipButton: {
        position: "absolute",
        alignSelf: "center",
    },
});
