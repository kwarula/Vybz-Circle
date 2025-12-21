import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import { Layout } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

interface LeaderboardUser {
    id: string;
    name: string;
    points: number;
    rank: number;
    isUser: boolean;
}

export default function LeaderboardScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [filter, setFilter] = useState<'global' | 'friends'>('global');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user.id;

            const { data, error } = await supabase
                .from('users')
                .select('id, display_name, rep_points')
                .order('rep_points', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching leaderboard:', error);
            } else if (data) {
                const mapped = data.map((u: any, index: number) => ({
                    id: u.id,
                    name: u.display_name || 'Anonymous',
                    points: u.rep_points || 0,
                    rank: index + 1,
                    isUser: u.id === currentUserId
                }));
                setLeaderboardData(mapped);
            }
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return '#FFD700'; // Gold
            case 2: return '#C0C0C0'; // Silver
            case 3: return '#CD7F32'; // Bronze
            default: return theme.text;
        }
    };

    const renderItem = ({ item }: { item: LeaderboardUser }) => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: item.isUser ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
            borderBottomWidth: 1,
            borderBottomColor: theme.border
        }}>
            <View style={{ width: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: getRankColor(item.rank) }}>#{item.rank}</Text>
            </View>
            <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.backgroundSecondary,
                marginHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: item.isUser ? '700' : '500', color: theme.text }}>
                    {item.name} {item.isUser && '(Me)'}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontWeight: '700', color: theme.primary }}>{item.points}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>REP</Text>
            </View>
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
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Leaderboard</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Filter Tabs */}
                <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 4 }}>
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            borderRadius: 10,
                            backgroundColor: filter === 'global' ? theme.backgroundRoot : 'transparent',
                            shadowColor: filter === 'global' ? "#000" : "transparent",
                            shadowOpacity: 0.1,
                            shadowRadius: 2
                        }}
                        onPress={() => setFilter('global')}
                    >
                        <Text style={{ fontWeight: '600', color: filter === 'global' ? theme.text : theme.textSecondary }}>Global</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: 'center',
                            borderRadius: 10,
                            backgroundColor: filter === 'friends' ? theme.backgroundRoot : 'transparent',
                            shadowColor: filter === 'friends' ? "#000" : "transparent",
                            shadowOpacity: 0.1,
                            shadowRadius: 2
                        }}
                        onPress={() => setFilter('friends')}
                    >
                        <Text style={{ fontWeight: '600', color: filter === 'friends' ? theme.text : theme.textSecondary }}>Friends</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, paddingTop: 20 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.border
                        }}>
                            <View style={{ width: 40, height: 20, backgroundColor: theme.backgroundSecondary, borderRadius: 4 }} />
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundSecondary, marginHorizontal: 12 }} />
                            <View style={{ flex: 1 }}>
                                <View style={{ width: '60%', height: 16, backgroundColor: theme.backgroundSecondary, borderRadius: 4, marginBottom: 4 }} />
                                <View style={{ width: '30%', height: 12, backgroundColor: theme.backgroundSecondary, borderRadius: 4 }} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : leaderboardData.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(139, 92, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Ionicons name="trophy" size={40} color="#8B5CF6" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8 }}>No Rankings Yet</Text>
                    <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: 'center', paddingHorizontal: 40 }}>
                        Be the first to earn rep points by{'\n'}attending events and completing challenges!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboardData}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
