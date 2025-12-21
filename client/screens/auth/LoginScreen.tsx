import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

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

const AnimatedInput = ({ icon, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, keyboardType, isPassword, isPasswordVisible, setPasswordVisible }: any) => {
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
            transform: [{ scale: withTiming(focusValue.value ? 1.02 : 1, { duration: 200 }) }],
        };
    });

    return (
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
    );
};

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setPasswordVisible] = useState(false);

    async function signInWithEmail() {
        if (!email || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert('Missing Fields', 'Please enter your email and password.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setLoading(false);
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Brand Header */}
                <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryLight]}
                            style={styles.logoGradient}
                        >
                            <Feather name="zap" size={36} color="#FFF" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Log in to your Vybz Circle account</Text>
                </Animated.View>

                {/* Form */}
                <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <AnimatedInput
                            icon="mail"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <AnimatedInput
                            icon="lock"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            isPassword={true}
                            isPasswordVisible={isPasswordVisible}
                            setPasswordVisible={setPasswordVisible}
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={signInWithEmail}
                        disabled={loading}
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitText}>Log In</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.footerLink}>Sign Up</Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
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
    forgotButton: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
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
