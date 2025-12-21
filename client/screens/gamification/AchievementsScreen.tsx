import React from 'react';
import { View, Text, FlatList, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';

// Mock Data
const ACHIEVEMENTS = [
    { id: '1', title: 'Party Animal', description: 'Attend 5 events in a month', icon: 'musical-notes', color: '#8B5CF6', unlocked: true, date: '12 Dec' },
    { id: '2', title: 'Social Butterfly', description: 'Add 10 friends to your circle', icon: 'people', color: '#EC4899', unlocked: true, date: '10 Dec' },
    { id: '3', title: 'Globetrotter', description: 'Check in at 3 different venues', icon: 'map', color: '#10B981', unlocked: false },
    { id: '4', title: 'Big Spender', description: 'Spend 5000 KES on tickets', icon: 'card', color: '#F59E0B', unlocked: false },
    { id: '5', title: 'Early Bird', description: 'Buy a ticket 1 week in advance', icon: 'alarm', color: '#3B82F6', unlocked: true, date: '5 Nov' },
    { id: '6', title: 'Night Owl', description: 'Check out after 3 AM', icon: 'moon', color: '#6366F1', unlocked: false },
];

export default function AchievementsScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const renderItem = ({ item }: { item: typeof ACHIEVEMENTS[0] }) => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: theme.backgroundDefault,
            marginBottom: 12,
            borderRadius: 16,
            opacity: item.unlocked ? 1 : 0.6,
            borderWidth: 1,
            borderColor: item.unlocked ? item.color : theme.border
        }}>
            <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: item.unlocked ? `${item.color}20` : theme.backgroundSecondary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
            }}>
                <Ionicons name={item.icon as any} size={28} color={item.unlocked ? item.color : theme.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>{item.description}</Text>
            </View>
            {item.unlocked ? (
                <View style={{ alignItems: 'flex-end' }}>
                    <Ionicons name="checkmark-circle" size={24} color={item.color} />
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{item.date}</Text>
                </View>
            ) : (
                <Ionicons name="lock-closed" size={20} color={theme.textMuted} />
            )}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={{
                paddingTop: insets.top,
                paddingHorizontal: 20,
                paddingBottom: 20,
                backgroundColor: theme.backgroundDefault,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Achievements</Text>
            </View>

            <FlatList
                data={ACHIEVEMENTS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={{ marginBottom: 24, alignItems: 'center' }}>
                        <Text style={{ fontSize: 32, fontWeight: '800', color: theme.primary, marginBottom: 8 }}>3/6</Text>
                        <Text style={{ fontSize: 14, color: theme.textSecondary, letterSpacing: 1, textTransform: 'uppercase' }}>Unlocked</Text>
                    </View>
                )}
            />
        </View>
    );
}
