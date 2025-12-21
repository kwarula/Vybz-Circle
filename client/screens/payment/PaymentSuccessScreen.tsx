import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    FadeIn,
    FadeInUp,
    FadeInDown,
    ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const COLORS = {
    primary: '#8B5CF6',
    success: '#22C55E',
    background: '#000000',
    surface: '#0A0A0A',
    surfaceLight: '#121212',
    border: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#737373',
};

export default function PaymentSuccessScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { event, tier, total } = route.params || {};

    const checkScale = useSharedValue(0);
    const confettiOpacity = useSharedValue(0);

    useEffect(() => {
        // Celebration animation
        checkScale.value = withSpring(1, { damping: 8 });
        confettiOpacity.value = withDelay(300, withSpring(1));

        // Haptic celebration
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const checkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
    }));

    const handleViewTicket = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.reset({
            index: 0,
            routes: [
                { name: 'Main' },
                { name: 'MyTickets' },
            ],
        });
    };

    const handleBackToEvents = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
        });
    };

    const eventTitle = event?.title || "Event Name";
    const eventDate = event?.date || "Dec 20, 2024";
    const eventVenue = event?.venue || "Venue";
    const tierName = tier?.name || "Regular";
    const ticketId = `VYB-${Date.now().toString(36).toUpperCase()}`;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="light" />

            {/* Confetti Background Effect */}
            <View style={styles.confettiContainer}>
                {[...Array(20)].map((_, i) => (
                    <Animated.View
                        key={i}
                        entering={FadeIn.delay(i * 50).duration(500)}
                        style={[
                            styles.confettiDot,
                            {
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 40}%`,
                                backgroundColor: i % 3 === 0 ? COLORS.primary : i % 3 === 1 ? COLORS.success : '#F59E0B',
                                width: 4 + Math.random() * 4,
                                height: 4 + Math.random() * 4,
                            },
                        ]}
                    />
                ))}
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Success Icon */}
                <Animated.View style={[styles.successCircle, checkStyle]}>
                    <LinearGradient
                        colors={[COLORS.success, '#16A34A']}
                        style={styles.successGradient}
                    >
                        <Feather name="check" size={56} color="#FFF" />
                    </LinearGradient>
                </Animated.View>

                {/* Success Text */}
                <Animated.View entering={FadeInUp.delay(200)} style={styles.textContainer}>
                    <Text style={styles.title}>Payment Successful!</Text>
                    <Text style={styles.subtitle}>Your ticket has been confirmed</Text>
                </Animated.View>

                {/* Ticket Card */}
                <Animated.View entering={FadeInUp.delay(400)} style={styles.ticketCard}>
                    {/* Ticket Header */}
                    <View style={styles.ticketHeader}>
                        <View style={styles.ticketBadge}>
                            <Feather name="check-circle" size={14} color={COLORS.success} />
                            <Text style={styles.ticketBadgeText}>Confirmed</Text>
                        </View>
                        <Text style={styles.ticketId}>{ticketId}</Text>
                    </View>

                    {/* Event Info */}
                    <Text style={styles.ticketTitle} numberOfLines={2}>{eventTitle}</Text>

                    <View style={styles.ticketDetails}>
                        <View style={styles.ticketDetailRow}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                            <Text style={styles.ticketDetailText}>{eventDate}</Text>
                        </View>
                        <View style={styles.ticketDetailRow}>
                            <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                            <Text style={styles.ticketDetailText}>{eventVenue}</Text>
                        </View>
                    </View>

                    {/* Dashed Divider */}
                    <View style={styles.dashedDivider}>
                        <View style={styles.circleLeft} />
                        {[...Array(20)].map((_, i) => (
                            <View key={i} style={styles.dash} />
                        ))}
                        <View style={styles.circleRight} />
                    </View>

                    {/* Ticket Footer */}
                    <View style={styles.ticketFooter}>
                        <View>
                            <Text style={styles.ticketFooterLabel}>Ticket Type</Text>
                            <Text style={styles.ticketFooterValue}>{tierName}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.ticketFooterLabel}>Amount Paid</Text>
                            <Text style={[styles.ticketFooterValue, { color: COLORS.success }]}>
                                KES {(total || 1550).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Receipt Info */}
                <Animated.View entering={FadeIn.delay(600)} style={styles.receiptInfo}>
                    <Feather name="mail" size={16} color={COLORS.textMuted} />
                    <Text style={styles.receiptText}>
                        Confirmation sent to your email and phone
                    </Text>
                </Animated.View>
            </View>

            {/* Bottom Actions */}
            <Animated.View
                entering={FadeInDown.delay(800)}
                style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
            >
                <Pressable
                    onPress={handleViewTicket}
                    style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                    ]}
                >
                    <LinearGradient
                        colors={[COLORS.primary, '#7C3AED']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Feather name="tag" size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>View My Ticket</Text>
                    </LinearGradient>
                </Pressable>

                <Pressable
                    onPress={handleBackToEvents}
                    style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed && { opacity: 0.7 }
                    ]}
                >
                    <Text style={styles.secondaryButtonText}>Back to Events</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    confettiDot: {
        position: 'absolute',
        borderRadius: 10,
        opacity: 0.6,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    successCircle: {
        marginBottom: 32,
    },
    successGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    ticketCard: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ticketBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ticketBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.success,
    },
    ticketId: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontFamily: 'monospace',
    },
    ticketTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    ticketDetails: {
        gap: 8,
    },
    ticketDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    ticketDetailText: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    dashedDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        overflow: 'hidden',
    },
    circleLeft: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        marginLeft: -34,
    },
    circleRight: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        marginRight: -34,
    },
    dash: {
        flex: 1,
        height: 2,
        backgroundColor: COLORS.border,
        marginHorizontal: 2,
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    ticketFooterLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    ticketFooterValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    receiptInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
    },
    receiptText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    footer: {
        paddingHorizontal: 24,
        gap: 12,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    secondaryButtonText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
});
