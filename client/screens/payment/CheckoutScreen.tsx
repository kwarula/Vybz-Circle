import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const COLORS = {
    primary: '#8B5CF6',
    success: '#22C55E',
    background: '#000000',
    surface: '#0A0A0A',
    surfaceLight: '#121212',
    border: '#1A1A1A',
    borderLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#737373',
    mpesaGreen: '#4CB64C',
};

export default function CheckoutScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { event, tier } = route.params || {};

    const [phone, setPhone] = useState('0712 345 678');
    const [loading, setLoading] = useState(false);

    // Fallback if no params
    const eventTitle = event?.title || "Event Name";
    const eventDate = event?.date || "Dec 20, 2024";
    const eventVenue = event?.venue || "Venue";
    const price = tier?.price || 1500;
    const tierName = tier?.name || "Regular";
    const serviceFee = 50;
    const total = price + serviceFee;

    const handlePay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setLoading(true);

        // Simulate STK push being sent
        setTimeout(() => {
            setLoading(false);
            // Navigate to processing screen
            navigation.replace('PaymentProcessing', { event, tier, total });
        }, 1500);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Secure Checkout</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Trust Badge */}
                <View style={styles.trustBadge}>
                    <Feather name="shield" size={16} color={COLORS.success} />
                    <Text style={styles.trustText}>Secure payment powered by M-Pesa</Text>
                </View>

                {/* Event Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.sectionLabel}>YOUR ORDER</Text>

                    <View style={styles.eventRow}>
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
                            <View style={styles.eventMeta}>
                                <Feather name="calendar" size={14} color={COLORS.textMuted} />
                                <Text style={styles.eventMetaText}>{eventDate}</Text>
                            </View>
                            <View style={styles.eventMeta}>
                                <Feather name="map-pin" size={14} color={COLORS.textMuted} />
                                <Text style={styles.eventMetaText}>{eventVenue}</Text>
                            </View>
                        </View>
                        <View style={styles.tierBadge}>
                            <Feather name="tag" size={14} color={COLORS.primary} />
                            <Text style={styles.tierText}>{tierName}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Price Breakdown */}
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Ticket Price</Text>
                        <Text style={styles.priceValue}>KES {price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Service Fee</Text>
                        <Text style={styles.priceValue}>KES {serviceFee}</Text>
                    </View>

                    <View style={[styles.divider, { marginTop: 16 }]} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>KES {total.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                    <View style={styles.paymentCard}>
                        <Image
                            source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/2560px-M-PESA_LOGO-01.svg.png" }}
                            style={styles.mpesaLogo}
                            resizeMode="contain"
                        />
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentTitle}>M-Pesa</Text>
                            <Text style={styles.paymentSubtitle}>Mobile Money</Text>
                        </View>
                        <View style={styles.checkCircle}>
                            <Feather name="check" size={14} color="#FFF" />
                        </View>
                    </View>
                </View>

                {/* Phone Number */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>M-PESA NUMBER</Text>
                    <View style={styles.phoneInputContainer}>
                        <View style={styles.countryCode}>
                            <Text style={styles.countryCodeText}>+254</Text>
                        </View>
                        <TextInput
                            style={styles.phoneInput}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="712 345 678"
                            placeholderTextColor={COLORS.textMuted}
                        />
                    </View>
                    <Text style={styles.helperText}>
                        You'll receive an STK push to confirm payment
                    </Text>
                </View>
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.footerTotal}>
                    <Text style={styles.footerLabel}>Total</Text>
                    <Text style={styles.footerAmount}>KES {total.toLocaleString()}</Text>
                </View>

                <Pressable
                    onPress={handlePay}
                    disabled={loading}
                    style={({ pressed }) => [
                        styles.payButton,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                        loading && { opacity: 0.7 }
                    ]}
                >
                    <LinearGradient
                        colors={[COLORS.mpesaGreen, '#3BA33B']}
                        style={styles.payButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Feather name="lock" size={18} color="#FFF" />
                                <Text style={styles.payButtonText}>Pay with M-Pesa</Text>
                            </>
                        )}
                    </LinearGradient>
                </Pressable>

                {/* Security Footer */}
                <View style={styles.securityRow}>
                    <Feather name="shield" size={12} color={COLORS.textMuted} />
                    <Text style={styles.securityText}>256-bit SSL encryption</Text>
                    <View style={styles.securityDot} />
                    <Feather name="lock" size={12} color={COLORS.textMuted} />
                    <Text style={styles.securityText}>Secure checkout</Text>
                </View>
            </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 200,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 12,
        marginBottom: 24,
    },
    trustText: {
        fontSize: 13,
        color: COLORS.success,
        fontWeight: '500',
    },
    summaryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textMuted,
        letterSpacing: 1,
        marginBottom: 16,
    },
    eventRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    eventInfo: {
        flex: 1,
        marginRight: 16,
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    eventMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    eventMetaText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    tierText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    priceValue: {
        fontSize: 15,
        color: COLORS.text,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
    },
    section: {
        marginBottom: 24,
    },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.mpesaGreen,
    },
    mpesaLogo: {
        width: 50,
        height: 28,
    },
    paymentInfo: {
        marginLeft: 16,
        flex: 1,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    paymentSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.mpesaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    countryCode: {
        paddingHorizontal: 16,
        paddingVertical: 18,
        backgroundColor: COLORS.surfaceLight,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    phoneInput: {
        flex: 1,
        fontSize: 18,
        color: COLORS.text,
        paddingHorizontal: 16,
        paddingVertical: 18,
    },
    helperText: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 8,
        marginLeft: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        paddingTop: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    footerTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    footerLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    footerAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    payButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    payButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
    },
    payButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
    },
    securityDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.textMuted,
    },
    securityText: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
});
