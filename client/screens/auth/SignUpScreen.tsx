import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Using inline styles for consistency with theme.ts values
const COLORS = {
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    background: '#000000',
    surface: '#0A0A0A',
    border: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#737373',
};

const AnimatedInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, keyboardType, isPassword, isPasswordVisible, setPasswordVisible, label }: any) => {
    const focusValue = useSharedValue(0);

    const onFocus = () => {
        focusValue.value = withTiming(1, { duration: 200 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onBlur = () => {
        focusValue.value = withTiming(0, { duration: 200 });
    };

    const containerStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            focusValue.value,
            [0, 1],
            [COLORS.border, COLORS.primary]
        );
        return {
            borderColor,
            transform: [{ scale: withTiming(focusValue.value ? 1.01 : 1, { duration: 200 }) }],
        };
    });

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <Animated.View style={[styles.inputContainer, containerStyle]}>
                <Feather name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                />
                {isPassword && (
                    <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
                        <Feather name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
};

export default function SignUpScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setPasswordVisible] = useState(false);

    async function signUpWithEmail() {
        if (!email || !password || !fullName || !phone) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: fullName,
                    phone: phone,
                },
            },
        });

        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (error.message.includes("User already registered") || error.message.includes("already exists")) {
                Alert.alert(
                    'Account Exists',
                    'This email is already registered. Please log in.',
                    [
                        { text: 'OK', onPress: () => navigation.navigate('Login') }
                    ]
                );
            } else {
                Alert.alert('Error', error.message);
            }
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Success! Navigate to phone verification
            navigation.navigate('PhoneVerification', { phone });
        }
        setLoading(false);
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join the circle and start discovering.</Text>
                    </Animated.View>

                    {/* Form */}
                    <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.form}>
                        <AnimatedInput
                            label="Full Name"
                            icon="user"
                            placeholder="Your full name"
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <AnimatedInput
                            label="Phone Number (M-Pesa)"
                            icon="phone"
                            placeholder="0712 345 678"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />

                        <AnimatedInput
                            label="Email"
                            icon="mail"
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <AnimatedInput
                            label="Password"
                            icon="lock"
                            placeholder="Create a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            isPassword={true}
                            isPasswordVisible={isPasswordVisible}
                            setPasswordVisible={setPasswordVisible}
                        />

                        <TouchableOpacity
                            onPress={signUpWithEmail}
                            disabled={loading}
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitText}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerLink}>Log In</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderRadius: 16,
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    eyeButton: {
        padding: 4,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    footerLink: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '700',
    },
});
