import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ScrollView, Platform, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import {
    isAuthenticated,
    authenticateWithUber,
    requestRide,
    getRideStatus,
    cancelRide,
    getFareEstimate,
    getTimeEstimate,
    getAvailableProducts,
    openUberApp,
    formatFare,
    formatDuration,
    UberFareEstimate,
    UberTimeEstimate,
    UberProduct,
    UberLocation,
    UberRideRequest,
} from "@/lib/uber";

interface RideRequestScreenParams {
    pickup?: UberLocation;
    dropoff: UberLocation;
    venueName?: string;
}

type RideState = 'selecting' | 'confirming' | 'requesting' | 'tracking' | 'completed' | 'cancelled';

// Web-compatible location getter
async function getCurrentLocation(): Promise<UberLocation> {
    return new Promise((resolve) => {
        // Default Nairobi location
        const defaultLocation: UberLocation = {
            latitude: -1.2864,
            longitude: 36.8172,
            nickname: 'My Location',
        };

        if (Platform.OS === 'web' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        nickname: 'My Location',
                    });
                },
                () => resolve(defaultLocation),
                { timeout: 10000 }
            );
        } else {
            // For native, we'd use expo-location but fallback for now
            resolve(defaultLocation);
        }
    });
}

export default function RideRequestScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: RideRequestScreenParams }, 'params'>>();
    const { theme } = useTheme();

    // Location state
    const [currentLocation, setCurrentLocation] = useState<UberLocation | null>(null);
    const [locationLoading, setLocationLoading] = useState(true);

    const dropoff = route.params?.dropoff || {
        latitude: -1.2870,
        longitude: 36.7880,
        nickname: 'Event Venue',
    };

    // Ride state
    const [rideState, setRideState] = useState<RideState>('selecting');
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [fareEstimates, setFareEstimates] = useState<UberFareEstimate[]>([]);
    const [timeEstimates, setTimeEstimates] = useState<UberTimeEstimate[]>([]);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [activeRide, setActiveRide] = useState<UberRideRequest | null>(null);

    const products = getAvailableProducts();

    // Get current location on mount
    useEffect(() => {
        (async () => {
            setLocationLoading(true);
            const location = await getCurrentLocation();
            setCurrentLocation(location);
            setLocationLoading(false);
        })();
    }, []);

    // Check auth and load estimates when location is ready
    useEffect(() => {
        if (currentLocation) {
            checkAuthAndLoadEstimates();
        }
    }, [currentLocation]);

    const checkAuthAndLoadEstimates = async () => {
        if (!currentLocation) return;

        setLoading(true);
        try {
            const isAuth = await isAuthenticated();
            setAuthenticated(isAuth);

            const [fares, times] = await Promise.all([
                getFareEstimate(currentLocation, dropoff),
                getTimeEstimate(currentLocation),
            ]);

            setFareEstimates(fares);
            setTimeEstimates(times);

            if (fares.length > 0 && !selectedProduct) {
                setSelectedProduct(fares[0].product_id);
            }
        } catch (error) {
            console.error('Error loading estimates:', error);
        } finally {
            setLoading(false);
        }
    };

    // Poll ride status when tracking
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (rideState === 'tracking' && activeRide) {
            interval = setInterval(async () => {
                const status = await getRideStatus(activeRide.request_id);
                if (status) {
                    setActiveRide(status);
                    if (status.status === 'completed') {
                        setRideState('completed');
                    } else if (status.status === 'cancelled') {
                        setRideState('cancelled');
                    }
                }
            }, 5000);
        }

        return () => { if (interval) clearInterval(interval); };
    }, [rideState, activeRide]);

    const handleHaptic = useCallback((type: 'light' | 'medium' | 'success' | 'warning') => {
        if (Platform.OS !== 'web') {
            if (type === 'success') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (type === 'warning') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else {
                Haptics.impactAsync(type === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
            }
        }
    }, []);

    const handleAuthenticate = async () => {
        handleHaptic('medium');
        const success = await authenticateWithUber();
        if (success) {
            setAuthenticated(true);
            await checkAuthAndLoadEstimates();
        }
    };

    const handleConfirmRide = () => {
        handleHaptic('medium');
        setRideState('confirming');
    };

    const handleRequestRide = async () => {
        if (!currentLocation) return;

        handleHaptic('success');
        setRideState('requesting');

        if (!authenticated) {
            // Fallback to deep link
            const success = await openUberApp({
                pickup: currentLocation,
                dropoff,
                productId: selectedProduct,
            });
            if (success) {
                navigation.goBack();
            } else {
                setRideState('selecting');
            }
            return;
        }

        // Real API request
        const ride = await requestRide({
            pickup: currentLocation,
            dropoff,
            productId: selectedProduct,
        });

        if (ride) {
            setActiveRide(ride);
            setRideState('tracking');
        } else {
            setRideState('selecting');
        }
    };

    const handleCancelRide = async () => {
        if (!activeRide) return;

        handleHaptic('warning');
        const success = await cancelRide(activeRide.request_id);
        if (success) {
            setActiveRide(null);
            setRideState('cancelled');
        }
    };

    const getSelectedFare = () => fareEstimates.find(f => f.product_id === selectedProduct);
    const getSelectedTime = () => timeEstimates.find(t => t.product_id === selectedProduct);

    const selectedFare = getSelectedFare();
    const selectedTime = getSelectedTime();

    // Loading state
    if (locationLoading) {
        return (
            <View style={[styles.root, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <ThemedText type="body" style={{ marginTop: Spacing.lg }}>Getting your location...</ThemedText>
            </View>
        );
    }

    // Tracking state
    if (rideState === 'tracking' && activeRide) {
        return (
            <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
                <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                    <View style={{ width: 40 }} />
                    <ThemedText type="h3">Ride in Progress</ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={[styles.trackingContent, { flex: 1 }]}>
                    <Animated.View entering={FadeIn.duration(400)} style={styles.statusCard}>
                        <View style={[styles.statusIcon, { backgroundColor: Colors.light.success + '20' }]}>
                            <MaterialCommunityIcons name="car" size={48} color={Colors.light.success} />
                        </View>
                        <ThemedText type="h2" style={{ textAlign: 'center', marginTop: Spacing.lg }}>
                            {activeRide.status === 'accepted' ? 'Driver on the way!' :
                                activeRide.status === 'arriving' ? 'Driver arriving!' :
                                    activeRide.status === 'in_progress' ? 'On your way!' :
                                        'Finding your driver...'}
                        </ThemedText>
                        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
                            {activeRide.eta ? `${Math.round(activeRide.eta / 60)} min away` : 'Calculating...'}
                        </ThemedText>

                        {activeRide.driver && (
                            <View style={[styles.driverCard, { backgroundColor: theme.backgroundSecondary }]}>
                                {activeRide.driver.picture_url && (
                                    <Image source={{ uri: activeRide.driver.picture_url }} style={styles.driverPhoto} />
                                )}
                                <View style={styles.driverInfo}>
                                    <ThemedText type="body" style={{ fontWeight: '700' }}>{activeRide.driver.name}</ThemedText>
                                    <View style={styles.ratingRow}>
                                        <Feather name="star" size={14} color={Colors.light.warning} />
                                        <ThemedText type="small">{activeRide.driver.rating.toFixed(1)}</ThemedText>
                                    </View>
                                </View>
                                <Pressable style={[styles.callButton, { backgroundColor: Colors.light.success }]}>
                                    <Feather name="phone" size={20} color="#FFF" />
                                </Pressable>
                            </View>
                        )}

                        {activeRide.vehicle && (
                            <View style={styles.vehicleInfo}>
                                <ThemedText type="body" style={{ fontWeight: '600' }}>
                                    {activeRide.vehicle.make} {activeRide.vehicle.model}
                                </ThemedText>
                                <ThemedText type="h3" style={{ color: Colors.light.primary }}>
                                    {activeRide.vehicle.license_plate}
                                </ThemedText>
                            </View>
                        )}
                    </Animated.View>
                </View>

                <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundDefault }]}>
                    <Pressable onPress={handleCancelRide} style={[styles.cancelButton, { borderColor: Colors.light.error }]}>
                        <ThemedText type="body" style={{ color: Colors.light.error, fontWeight: '700' }}>Cancel Ride</ThemedText>
                    </Pressable>
                </View>
            </View>
        );
    }

    // Completed/Cancelled state
    if (rideState === 'completed' || rideState === 'cancelled') {
        return (
            <View style={[styles.root, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
                <View style={[styles.statusIcon, { backgroundColor: rideState === 'completed' ? Colors.light.success + '20' : Colors.light.error + '20' }]}>
                    <Feather
                        name={rideState === 'completed' ? 'check-circle' : 'x-circle'}
                        size={64}
                        color={rideState === 'completed' ? Colors.light.success : Colors.light.error}
                    />
                </View>
                <ThemedText type="h2" style={{ marginTop: Spacing.xl }}>
                    {rideState === 'completed' ? 'Ride Complete!' : 'Ride Cancelled'}
                </ThemedText>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={[styles.requestButton, { backgroundColor: Colors.light.primary, marginTop: Spacing.xl, paddingHorizontal: Spacing['2xl'] }]}
                >
                    <ThemedText type="body" style={{ color: '#FFF', fontWeight: '700' }}>Done</ThemedText>
                </Pressable>
            </View>
        );
    }

    // Confirmation state
    if (rideState === 'confirming') {
        const confirmProduct = products.find(p => p.product_id === selectedProduct);
        return (
            <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
                <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                    <Pressable onPress={() => setRideState('selecting')} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </Pressable>
                    <ThemedText type="h3">Confirm Ride</ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.confirmContent}>
                    <Animated.View entering={FadeInDown.duration(400)} style={[styles.confirmCard, { backgroundColor: theme.backgroundSecondary }]}>
                        {confirmProduct && (
                            <Image source={{ uri: confirmProduct.image }} style={styles.confirmProductImage} resizeMode="contain" />
                        )}
                        <ThemedText type="h2">{confirmProduct?.display_name}</ThemedText>

                        <View style={styles.confirmDetails}>
                            <View style={styles.confirmRow}>
                                <Feather name="map-pin" size={16} color={Colors.light.success} />
                                <ThemedText type="small">{currentLocation?.nickname || 'Pickup'}</ThemedText>
                            </View>
                            <View style={styles.confirmDivider} />
                            <View style={styles.confirmRow}>
                                <Feather name="flag" size={16} color={Colors.light.primary} />
                                <ThemedText type="small">{dropoff.nickname || 'Destination'}</ThemedText>
                            </View>
                        </View>

                        {selectedFare && (
                            <View style={styles.confirmPricing}>
                                <ThemedText type="small" style={{ color: theme.textSecondary }}>Estimated fare</ThemedText>
                                <ThemedText type="h1">{formatFare(selectedFare.low_estimate)}</ThemedText>
                                {selectedFare.surge_multiplier && selectedFare.surge_multiplier > 1 && (
                                    <View style={styles.surgeBadge}>
                                        <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFF" />
                                        <ThemedText type="small" style={{ color: '#FFF' }}>{selectedFare.surge_multiplier}x surge</ThemedText>
                                    </View>
                                )}
                            </View>
                        )}
                    </Animated.View>
                </View>

                <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundDefault }]}>
                    <Pressable
                        onPress={handleRequestRide}
                        disabled={rideState === 'requesting'}
                        style={[styles.requestButton, { backgroundColor: Colors.light.primary }]}
                    >
                        {rideState === 'requesting' ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="car" size={24} color="#FFF" />
                                <ThemedText type="body" style={{ color: '#FFF', fontWeight: '700' }}>Confirm Booking</ThemedText>
                            </>
                        )}
                    </Pressable>
                    {!authenticated && (
                        <ThemedText type="tiny" style={{ color: theme.textMuted, textAlign: 'center', marginTop: Spacing.sm }}>
                            Will open in Uber app
                        </ThemedText>
                    )}
                </View>
            </View>
        );
    }

    // Default: Selection state
    return (
        <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="x" size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h3">Get a Ride</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Auth Banner */}
                {!authenticated && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                        <Pressable onPress={handleAuthenticate} style={[styles.authBanner, { backgroundColor: Colors.light.primary + '15' }]}>
                            <MaterialCommunityIcons name="shield-check" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <ThemedText type="small" style={{ fontWeight: '700' }}>Connect Uber Account</ThemedText>
                                <ThemedText type="tiny" style={{ color: theme.textSecondary }}>Book rides directly in app</ThemedText>
                            </View>
                            <Feather name="chevron-right" size={20} color={Colors.light.primary} />
                        </Pressable>
                    </Animated.View>
                )}

                {/* Route Summary */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
                    <View style={[styles.routeCard, { backgroundColor: theme.backgroundSecondary }]}>
                        <View style={styles.routeRow}>
                            <View style={[styles.routeDot, { backgroundColor: Colors.light.success }]} />
                            <View style={styles.routeInfo}>
                                <ThemedText type="tiny" style={{ color: theme.textMuted }}>PICKUP</ThemedText>
                                <ThemedText type="body">{currentLocation?.nickname || 'My Location'}</ThemedText>
                            </View>
                        </View>
                        <View style={styles.routeDivider} />
                        <View style={styles.routeRow}>
                            <View style={[styles.routeDot, { backgroundColor: Colors.light.primary }]} />
                            <View style={styles.routeInfo}>
                                <ThemedText type="tiny" style={{ color: theme.textMuted }}>DROPOFF</ThemedText>
                                <ThemedText type="body">{dropoff.nickname || route.params?.venueName || 'Destination'}</ThemedText>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Ride Options */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
                    <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.md }}>CHOOSE A RIDE</ThemedText>

                    {loading ? (
                        <ActivityIndicator color={Colors.light.primary} style={{ marginVertical: Spacing.xl }} />
                    ) : (
                        products.map((product, index) => {
                            const fare = fareEstimates.find(f => f.product_id === product.product_id);
                            const time = timeEstimates.find(t => t.product_id === product.product_id);
                            const isSelected = selectedProduct === product.product_id;

                            return (
                                <Animated.View key={product.product_id} entering={FadeInDown.delay(150 + index * 50).duration(300)}>
                                    <Pressable
                                        onPress={() => {
                                            handleHaptic('light');
                                            setSelectedProduct(product.product_id);
                                        }}
                                        style={[
                                            styles.productCard,
                                            {
                                                backgroundColor: isSelected ? Colors.light.primary + '15' : theme.backgroundSecondary,
                                                borderColor: isSelected ? Colors.light.primary : 'transparent',
                                            }
                                        ]}
                                    >
                                        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
                                        <View style={styles.productInfo}>
                                            <ThemedText type="body" style={{ fontWeight: '700' }}>{product.display_name}</ThemedText>
                                            <ThemedText type="tiny" style={{ color: theme.textSecondary }}>{product.description}</ThemedText>
                                            {time && (
                                                <View style={styles.etaRow}>
                                                    <Feather name="clock" size={12} color={Colors.light.success} />
                                                    <ThemedText type="tiny" style={{ color: Colors.light.success }}>
                                                        {formatDuration(time.estimate)} away
                                                    </ThemedText>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.priceSection}>
                                            {fare && (
                                                <>
                                                    <ThemedText type="body" style={{ fontWeight: '700' }}>{formatFare(fare.low_estimate)}</ThemedText>
                                                    {fare.surge_multiplier && fare.surge_multiplier > 1 && (
                                                        <View style={styles.surgeBadge}>
                                                            <MaterialCommunityIcons name="lightning-bolt" size={12} color="#FFF" />
                                                            <ThemedText type="tiny" style={{ color: '#FFF' }}>{fare.surge_multiplier}x</ThemedText>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                        <View style={[
                                            styles.radio,
                                            {
                                                borderColor: isSelected ? Colors.light.primary : theme.textMuted,
                                                backgroundColor: isSelected ? Colors.light.primary : 'transparent',
                                            }
                                        ]}>
                                            {isSelected && <Feather name="check" size={14} color="#FFF" />}
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            );
                        })
                    )}
                </Animated.View>

                {/* Trip Details */}
                {selectedFare && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
                        <View style={[styles.tripDetails, { backgroundColor: theme.backgroundSecondary }]}>
                            <View style={styles.tripRow}>
                                <Feather name="clock" size={16} color={theme.textMuted} />
                                <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>Trip duration</ThemedText>
                                <ThemedText type="small" style={{ fontWeight: '600' }}>{formatDuration(selectedFare.duration)}</ThemedText>
                            </View>
                            <View style={styles.tripRow}>
                                <Feather name="map" size={16} color={theme.textMuted} />
                                <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>Distance</ThemedText>
                                <ThemedText type="small" style={{ fontWeight: '600' }}>{selectedFare.distance.toFixed(1)} km</ThemedText>
                            </View>
                            <View style={styles.tripRow}>
                                <MaterialCommunityIcons name="account-group" size={16} color={theme.textMuted} />
                                <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>Capacity</ThemedText>
                                <ThemedText type="small" style={{ fontWeight: '600' }}>
                                    {products.find(p => p.product_id === selectedProduct)?.capacity} passengers
                                </ThemedText>
                            </View>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>

            {/* Bottom CTA */}
            <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundDefault }]}
            >
                {selectedFare && (
                    <View style={styles.fareBreakdown}>
                        <ThemedText type="body" style={{ color: theme.textSecondary }}>Estimated fare</ThemedText>
                        <ThemedText type="h2">{formatFare(selectedFare.low_estimate)} - {formatFare(selectedFare.high_estimate)}</ThemedText>
                    </View>
                )}
                <Pressable
                    onPress={handleConfirmRide}
                    disabled={loading || !selectedProduct}
                    style={[styles.requestButton, { backgroundColor: Colors.light.primary, opacity: loading ? 0.7 : 1 }]}
                >
                    <MaterialCommunityIcons name="car" size={24} color="#FFF" />
                    <ThemedText type="body" style={{ color: '#FFF', fontWeight: '700' }}>
                        {authenticated ? 'Request Ride' : 'Continue with Uber'}
                    </ThemedText>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.xl, paddingBottom: 280 },
    section: { marginBottom: Spacing.xl },
    authBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    routeCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    routeDot: { width: 12, height: 12, borderRadius: 6 },
    routeInfo: { flex: 1, gap: 2 },
    routeDivider: { width: 2, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 5, marginVertical: Spacing.sm },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.sm,
        borderWidth: 2,
        gap: Spacing.md,
    },
    productImage: { width: 60, height: 40 },
    productInfo: { flex: 1, gap: 2 },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    priceSection: { alignItems: 'flex-end', gap: 4 },
    surgeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.warning,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        gap: 2,
    },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    tripDetails: { padding: Spacing.lg, borderRadius: BorderRadius.xl, gap: Spacing.md },
    tripRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    fareBreakdown: { alignItems: 'center', marginBottom: Spacing.lg },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
    },
    trackingContent: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    statusCard: { alignItems: 'center', width: '100%' },
    statusIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginTop: Spacing.xl,
        width: '100%',
        gap: Spacing.md,
    },
    driverPhoto: { width: 56, height: 56, borderRadius: 28 },
    driverInfo: { flex: 1 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    callButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    vehicleInfo: { alignItems: 'center', marginTop: Spacing.lg, gap: 4 },
    confirmContent: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
    confirmCard: { padding: Spacing.xl, borderRadius: BorderRadius["2xl"], alignItems: 'center' },
    confirmProductImage: { width: 120, height: 80, marginBottom: Spacing.lg },
    confirmDetails: { marginTop: Spacing.xl, width: '100%' },
    confirmRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
    confirmDivider: { height: 20, width: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 7 },
    confirmPricing: { alignItems: 'center', marginTop: Spacing.xl },
});
