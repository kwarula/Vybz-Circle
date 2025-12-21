/**
 * Uber API Service - Full Integration
 * Real OAuth 2.0 + API calls for ride requests
 * 
 * Uses expo-web-browser for OAuth (already installed)
 */

import { Platform, Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Configuration
// ============================================
const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID || 'YD0njJXRng7k8ChdByVPwQ2-LAxasuvV';
const UBER_CLIENT_SECRET = process.env.UBER_CLIENT_SECRET || '';

const UBER_AUTH_URL = 'https://auth.uber.com/oauth/v2/authorize';
const UBER_TOKEN_URL = 'https://auth.uber.com/oauth/v2/token';

// Use sandbox for development, production for release
const API_BASE = __DEV__
    ? 'https://sandbox-api.uber.com/v1.2'
    : 'https://api.uber.com/v1.2';

const STORAGE_KEY = '@vybz_uber_token';
const REDIRECT_SCHEME = 'vybz-circle';

// ============================================
// Types
// ============================================
export interface UberLocation {
    latitude: number;
    longitude: number;
    address?: string;
    nickname?: string;
}

export interface UberProduct {
    product_id: string;
    description: string;
    display_name: string;
    capacity: number;
    image: string;
    price_details?: {
        base: number;
        minimum: number;
        cost_per_minute: number;
        cost_per_distance: number;
        distance_unit: string;
        currency_code: string;
    };
}

export interface UberFareEstimate {
    product_id: string;
    display_name: string;
    currency_code: string;
    low_estimate: number;
    high_estimate: number;
    duration: number;
    distance: number;
    surge_multiplier?: number;
    fare_id?: string;
}

export interface UberTimeEstimate {
    product_id: string;
    display_name: string;
    estimate: number;
}

export interface UberRideRequest {
    request_id: string;
    status: 'processing' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
    product_id: string;
    driver?: {
        name: string;
        phone_number: string;
        rating: number;
        picture_url: string;
    };
    vehicle?: {
        make: string;
        model: string;
        license_plate: string;
        picture_url: string;
    };
    eta: number;
    surge_multiplier?: number;
}

export interface RideRequest {
    pickup: UberLocation;
    dropoff: UberLocation;
    productId?: string;
    fareId?: string;
    seats?: number;
}

interface StoredToken {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

// ============================================
// Token Management
// ============================================
let cachedToken: StoredToken | null = null;

async function getStoredToken(): Promise<StoredToken | null> {
    if (cachedToken && cachedToken.expires_at > Date.now()) {
        return cachedToken;
    }

    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
            const token = JSON.parse(stored) as StoredToken;
            if (token.expires_at > Date.now()) {
                cachedToken = token;
                return token;
            } else if (token.refresh_token) {
                return await refreshAccessToken(token.refresh_token);
            }
        }
    } catch (error) {
        console.error('Error getting stored token:', error);
    }
    return null;
}

async function storeToken(token: StoredToken): Promise<void> {
    cachedToken = token;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(token));
}

async function clearToken(): Promise<void> {
    cachedToken = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
}

async function refreshAccessToken(refreshToken: string): Promise<StoredToken | null> {
    try {
        const response = await fetch(UBER_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: UBER_CLIENT_ID,
                client_secret: UBER_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }).toString(),
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const token: StoredToken = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshToken,
            expires_at: Date.now() + (data.expires_in * 1000),
        };

        await storeToken(token);
        return token;
    } catch (error) {
        console.error('Error refreshing token:', error);
        await clearToken();
        return null;
    }
}

// ============================================
// OAuth Authentication
// ============================================
export async function isAuthenticated(): Promise<boolean> {
    const token = await getStoredToken();
    return token !== null;
}

export async function authenticateWithUber(): Promise<boolean> {
    // Build redirect URI
    const redirectUri = Platform.OS === 'web'
        ? `${window.location.origin}/auth/uber/callback`
        : `${REDIRECT_SCHEME}://auth/uber/callback`;

    const authUrl = `${UBER_AUTH_URL}?` + new URLSearchParams({
        client_id: UBER_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'request request.receipt profile places',
    }).toString();

    try {
        // Open auth session
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

        if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            const code = url.searchParams.get('code');

            if (code) {
                // Exchange code for token
                const tokenResponse = await fetch(UBER_TOKEN_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: UBER_CLIENT_ID,
                        client_secret: UBER_CLIENT_SECRET,
                        grant_type: 'authorization_code',
                        redirect_uri: redirectUri,
                        code: code,
                    }).toString(),
                });

                if (!tokenResponse.ok) {
                    const error = await tokenResponse.text();
                    console.error('Token exchange failed:', error);
                    throw new Error('Token exchange failed');
                }

                const tokenData = await tokenResponse.json();
                const token: StoredToken = {
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    expires_at: Date.now() + (tokenData.expires_in * 1000),
                };

                await storeToken(token);
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Authentication error:', error);
        return false;
    }
}

export async function logout(): Promise<void> {
    await clearToken();
}

// ============================================
// API Request Helper
// ============================================
async function makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = await getStoredToken();

    if (!token) {
        throw new Error('Not authenticated with Uber');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
            'Accept-Language': 'en_KE',
        },
    });

    if (response.status === 401) {
        if (token.refresh_token) {
            const newToken = await refreshAccessToken(token.refresh_token);
            if (newToken) {
                return makeAuthenticatedRequest(endpoint, options);
            }
        }
        throw new Error('Authentication expired');
    }

    return response;
}

// ============================================
// Products API
// ============================================
export async function getProducts(location: UberLocation): Promise<UberProduct[]> {
    try {
        const response = await makeAuthenticatedRequest(
            `/products?latitude=${location.latitude}&longitude=${location.longitude}`
        );

        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        return data.products;
    } catch (error) {
        console.log('Using mock products:', error);
        return getMockProducts();
    }
}

function getMockProducts(): UberProduct[] {
    return [
        {
            product_id: 'a4d41e7c-0c5e-4c9a-8e99-3e3eb7c6b1a8',
            display_name: 'UberX',
            description: 'Affordable rides, all to yourself',
            capacity: 4,
            image: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/mono/mono-uberx.png',
        },
        {
            product_id: 'b8a46e7c-1d6f-4e0b-9f00-4f4fc8d7c2b9',
            display_name: 'Comfort',
            description: 'Newer cars with extra legroom',
            capacity: 4,
            image: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/mono/mono-comfort.png',
        },
        {
            product_id: 'c9b57f8d-2e7g-5f1c-af11-5g5gd9e8d3ca',
            display_name: 'UberXL',
            description: 'Affordable rides for groups up to 6',
            capacity: 6,
            image: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/mono/mono-uberxl.png',
        },
        {
            product_id: 'd0c68g9e-3f8h-6g2d-bg22-6h6he0f9e4db',
            display_name: 'Boda',
            description: 'Motorcycle rides for quick trips',
            capacity: 1,
            image: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/mono/mono-ubermoto.png',
        },
    ];
}

// ============================================
// Price Estimates API
// ============================================
export async function getFareEstimate(
    pickup: UberLocation,
    dropoff: UberLocation
): Promise<UberFareEstimate[]> {
    try {
        const response = await makeAuthenticatedRequest(
            `/estimates/price?start_latitude=${pickup.latitude}&start_longitude=${pickup.longitude}&end_latitude=${dropoff.latitude}&end_longitude=${dropoff.longitude}`
        );

        if (!response.ok) throw new Error('Failed to fetch fare estimates');

        const data = await response.json();
        return data.prices.map((price: any) => ({
            product_id: price.product_id,
            display_name: price.display_name,
            currency_code: price.currency_code,
            low_estimate: price.low_estimate,
            high_estimate: price.high_estimate,
            duration: price.duration,
            distance: price.distance,
            surge_multiplier: price.surge_multiplier,
        }));
    } catch (error) {
        console.log('Using calculated fares:', error);
        return calculateMockFares(pickup, dropoff);
    }
}

function calculateMockFares(pickup: UberLocation, dropoff: UberLocation): UberFareEstimate[] {
    const distance = calculateDistance(
        pickup.latitude, pickup.longitude,
        dropoff.latitude, dropoff.longitude
    );

    const baseFare = 150;
    const perKm = 45;
    const estimatedFare = Math.round(baseFare + (distance * perKm));

    return [
        {
            product_id: 'a4d41e7c-0c5e-4c9a-8e99-3e3eb7c6b1a8',
            display_name: 'UberX',
            currency_code: 'KES',
            low_estimate: Math.round(estimatedFare * 0.9),
            high_estimate: Math.round(estimatedFare * 1.1),
            duration: Math.round(distance * 3 * 60),
            distance: distance,
        },
        {
            product_id: 'b8a46e7c-1d6f-4e0b-9f00-4f4fc8d7c2b9',
            display_name: 'Comfort',
            currency_code: 'KES',
            low_estimate: Math.round(estimatedFare * 1.2),
            high_estimate: Math.round(estimatedFare * 1.4),
            duration: Math.round(distance * 3 * 60),
            distance: distance,
        },
        {
            product_id: 'c9b57f8d-2e7g-5f1c-af11-5g5gd9e8d3ca',
            display_name: 'UberXL',
            currency_code: 'KES',
            low_estimate: Math.round(estimatedFare * 1.5),
            high_estimate: Math.round(estimatedFare * 1.8),
            duration: Math.round(distance * 3 * 60),
            distance: distance,
        },
        {
            product_id: 'd0c68g9e-3f8h-6g2d-bg22-6h6he0f9e4db',
            display_name: 'Boda',
            currency_code: 'KES',
            low_estimate: Math.round(estimatedFare * 0.5),
            high_estimate: Math.round(estimatedFare * 0.7),
            duration: Math.round(distance * 2 * 60),
            distance: distance,
        },
    ];
}

// ============================================
// Time Estimates API
// ============================================
export async function getTimeEstimate(pickup: UberLocation): Promise<UberTimeEstimate[]> {
    try {
        const response = await makeAuthenticatedRequest(
            `/estimates/time?start_latitude=${pickup.latitude}&start_longitude=${pickup.longitude}`
        );

        if (!response.ok) throw new Error('Failed to fetch time estimates');

        const data = await response.json();
        return data.times.map((time: any) => ({
            product_id: time.product_id,
            display_name: time.display_name,
            estimate: time.estimate,
        }));
    } catch (error) {
        console.log('Using mock times:', error);
        return [
            { product_id: 'a4d41e7c-0c5e-4c9a-8e99-3e3eb7c6b1a8', display_name: 'UberX', estimate: 180 },
            { product_id: 'b8a46e7c-1d6f-4e0b-9f00-4f4fc8d7c2b9', display_name: 'Comfort', estimate: 300 },
            { product_id: 'c9b57f8d-2e7g-5f1c-af11-5g5gd9e8d3ca', display_name: 'UberXL', estimate: 420 },
            { product_id: 'd0c68g9e-3f8h-6g2d-bg22-6h6he0f9e4db', display_name: 'Boda', estimate: 120 },
        ];
    }
}

// ============================================
// Ride Request Estimate (gets fare_id)
// ============================================
export async function getRideEstimate(
    request: RideRequest
): Promise<{ fare_id: string; fare: UberFareEstimate } | null> {
    try {
        const response = await makeAuthenticatedRequest('/requests/estimate', {
            method: 'POST',
            body: JSON.stringify({
                product_id: request.productId,
                start_latitude: request.pickup.latitude,
                start_longitude: request.pickup.longitude,
                end_latitude: request.dropoff.latitude,
                end_longitude: request.dropoff.longitude,
            }),
        });

        if (!response.ok) throw new Error('Failed to get ride estimate');

        const data = await response.json();
        return {
            fare_id: data.fare.fare_id,
            fare: {
                product_id: request.productId || '',
                display_name: data.trip?.display_name || '',
                currency_code: data.fare.currency_code,
                low_estimate: data.fare.value,
                high_estimate: data.fare.value,
                duration: data.trip?.duration_estimate || 0,
                distance: data.trip?.distance_estimate || 0,
                surge_multiplier: data.fare.surge_multiplier,
                fare_id: data.fare.fare_id,
            },
        };
    } catch (error) {
        console.error('Error getting ride estimate:', error);
        return null;
    }
}

// ============================================
// Request Ride API
// ============================================
export async function requestRide(request: RideRequest): Promise<UberRideRequest | null> {
    try {
        // Get fare_id first
        const estimate = await getRideEstimate(request);
        if (!estimate) {
            throw new Error('Could not get fare estimate');
        }

        const response = await makeAuthenticatedRequest('/requests', {
            method: 'POST',
            body: JSON.stringify({
                product_id: request.productId,
                fare_id: estimate.fare_id,
                start_latitude: request.pickup.latitude,
                start_longitude: request.pickup.longitude,
                end_latitude: request.dropoff.latitude,
                end_longitude: request.dropoff.longitude,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to request ride');
        }

        const data = await response.json();
        return {
            request_id: data.request_id,
            status: data.status,
            product_id: data.product_id,
            driver: data.driver,
            vehicle: data.vehicle,
            eta: data.eta,
            surge_multiplier: data.surge_multiplier,
        };
    } catch (error) {
        console.error('Error requesting ride:', error);
        Alert.alert(
            'Ride Request Failed',
            'Unable to request a ride. Would you like to open Uber directly?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Open Uber',
                    onPress: () => openUberApp(request)
                },
            ]
        );
        return null;
    }
}

// ============================================
// Get Ride Status
// ============================================
export async function getRideStatus(requestId: string): Promise<UberRideRequest | null> {
    try {
        const response = await makeAuthenticatedRequest(`/requests/${requestId}`);
        if (!response.ok) throw new Error('Failed to get ride status');

        const data = await response.json();
        return {
            request_id: data.request_id,
            status: data.status,
            product_id: data.product_id,
            driver: data.driver,
            vehicle: data.vehicle,
            eta: data.eta,
            surge_multiplier: data.surge_multiplier,
        };
    } catch (error) {
        console.error('Error getting ride status:', error);
        return null;
    }
}

// ============================================
// Cancel Ride
// ============================================
export async function cancelRide(requestId: string): Promise<boolean> {
    try {
        const response = await makeAuthenticatedRequest(`/requests/${requestId}`, {
            method: 'DELETE',
        });
        return response.status === 204;
    } catch (error) {
        console.error('Error cancelling ride:', error);
        return false;
    }
}

// ============================================
// Deep Link Fallback
// ============================================
export async function openUberApp(request: RideRequest): Promise<boolean> {
    const { pickup, dropoff } = request;

    const params = new URLSearchParams({
        'client_id': UBER_CLIENT_ID,
        'action': 'setPickup',
        'pickup[latitude]': pickup.latitude.toString(),
        'pickup[longitude]': pickup.longitude.toString(),
        'dropoff[latitude]': dropoff.latitude.toString(),
        'dropoff[longitude]': dropoff.longitude.toString(),
    });

    if (pickup.nickname) params.append('pickup[nickname]', pickup.nickname);
    if (dropoff.nickname) params.append('dropoff[nickname]', dropoff.nickname);

    const uberAppUrl = `uber://?${params.toString()}`;
    const uberWebUrl = `https://m.uber.com/ul/?${params.toString()}`;

    try {
        const canOpenApp = await Linking.canOpenURL(uberAppUrl);

        if (canOpenApp && Platform.OS !== 'web') {
            await Linking.openURL(uberAppUrl);
            return true;
        } else {
            if (Platform.OS === 'web') {
                window.open(uberWebUrl, '_blank');
            } else {
                await WebBrowser.openBrowserAsync(uberWebUrl);
            }
            return true;
        }
    } catch (error) {
        console.error('Error opening Uber:', error);
        return false;
    }
}

// ============================================
// Utilities
// ============================================
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

export function formatFare(amount: number, currency: string = 'KES'): string {
    return `${currency} ${amount.toLocaleString()}`;
}

export function formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

export function getAvailableProducts(): UberProduct[] {
    return getMockProducts();
}
