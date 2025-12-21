import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    FadeIn,
    FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const COLORS = {
    primary: '#8B5CF6',
    success: '#22C55E',
    warning: '#F59E0B',
    background: '#000000',
    surface: '#0A0A0A',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#737373',
    mpesaGreen: '#4CB64C',
};

const WAIT_TIME = 40; // 40 seconds for M-Pesa PIN entry

export default function PaymentProcessingScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { event, tier, total } = route.params || {};

    const [timeLeft, setTimeLeft] = useState(WAIT_TIME);
    const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Pulse animations
    const ring1Scale = useSharedValue(1);
    const ring2Scale = useSharedValue(1);
    const ring3Scale = useSharedValue(1);
    const iconScale = useSharedValue(1);

    useEffect(() => {
        // Start pulse animations
        ring1Scale.value = withRepeat(
            withSequence(
                withTiming(1.8, { duration: 2000, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 0 })
            ),
            -1
        );
        ring2Scale.value = withRepeat(
            withSequence(
                withDelay(400, withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.ease) })),
                withTiming(1, { duration: 0 })
            ),
            -1
        );
        ring3Scale.value = withRepeat(
            withSequence(
                withDelay(800, withTiming(2.6, { duration: 2000, easing: Easing.out(Easing.ease) })),
                withTiming(1, { duration: 0 })
            ),
            -1
        );

        // Icon pulse
        iconScale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1
        );

        // Countdown timer
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Simulate successful payment after countdown
                    clearInterval(timerRef.current!);
                    handlePaymentSuccess();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handlePaymentSuccess = () => {
        setStatus('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
            navigation.replace('PaymentSuccess', { event, tier, total });
        }, 1500);
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (timerRef.current) clearInterval(timerRef.current);
        navigation.goBack();
    };

    const ring1Style = useAnimatedStyle(() => ({
        transform: [{ scale: ring1Scale.value }],
        opacity: 2 - ring1Scale.value,
    }));

    const ring2Style = useAnimatedStyle(() => ({
        transform: [{ scale: ring2Scale.value }],
        opacity: (2.2 - ring2Scale.value) * 0.8,
    }));

    const ring3Style = useAnimatedStyle(() => ({
        transform: [{ scale: ring3Scale.value }],
        opacity: (2.6 - ring3Scale.value) * 0.6,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleCancel} style={styles.cancelButton}>
                    <Feather name="x" size={24} color={COLORS.textSecondary} />
                </Pressable>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Animated Pulse */}
                <View style={styles.pulseContainer}>
                    <Animated.View style={[styles.pulseRing, ring3Style]} />
                    <Animated.View style={[styles.pulseRing, ring2Style]} />
                    <Animated.View style={[styles.pulseRing, ring1Style]} />

                    <Animated.View style={[styles.iconContainer, iconStyle]}>
                        {status === 'success' ? (
                            <View style={[styles.iconCircle, { backgroundColor: COLORS.success }]}>
                                <Feather name="check" size={48} color="#FFF" />
                            </View>
                        ) : (
                            <View style={[styles.iconCircle, { backgroundColor: COLORS.mpesaGreen }]}>
                                <Feather name="smartphone" size={40} color="#FFF" />
                            </View>
                        )}
                    </Animated.View>
                </View>

                {/* Status Text */}
                <Animated.View entering={FadeInUp.delay(300)} style={styles.textContainer}>
                    {status === 'success' ? (
                        <>
                            <Text style={styles.title}>Payment Successful!</Text>
                            <Text style={styles.subtitle}>Redirecting to your ticket...</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.title}>Check Your Phone</Text>
                            <Text style={styles.subtitle}>
                                Enter your M-Pesa PIN to complete{'\n'}the payment
                            </Text>
                        </>
                    )}
                </Animated.View>

                {/* Timer */}
                {status === 'processing' && (
                    <Animated.View entering={FadeIn.delay(500)} style={styles.timerContainer}>
                        <View style={styles.timerBadge}>
                            <Feather name="clock" size={16} color={COLORS.warning} />
                            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        </View>
                        <Text style={styles.timerHint}>Time remaining to enter PIN</Text>
                    </Animated.View>
                )}

                {/* Amount */}
                <Animated.View entering={FadeIn.delay(600)} style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>KES {(total || 1550).toLocaleString()}</Text>
                </Animated.View>

                {/* Instructions */}
                {status === 'processing' && (
                    <Animated.View entering={FadeIn.delay(700)} style={styles.instructions}>
                        <View style={styles.instructionRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.instructionText}>Check your phone for M-Pesa prompt</Text>
                        </View>
                        <View style={styles.instructionRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.instructionText}>Enter your M-Pesa PIN</Text>
                        </View>
                        <View style={styles.instructionRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.instructionText}>Wait for confirmation</Text>
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Cancel Button */}
            {status === 'processing' && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    <Pressable onPress={handleCancel} style={styles.cancelTextButton}>
                        <Text style={styles.cancelText}>Cancel Payment</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    cancelButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    pulseContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    pulseRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: COLORS.mpesaGreen,
    },
    iconContainer: {
        zIndex: 10,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        marginBottom: 8,
    },
    timerText: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.warning,
    },
    timerHint: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    amountContainer: {
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 32,
    },
    amountLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
    },
    instructions: {
        width: '100%',
        gap: 16,
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    instructionText: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    footer: {
        paddingHorizontal: 24,
    },
    cancelTextButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    cancelText: {
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
});
