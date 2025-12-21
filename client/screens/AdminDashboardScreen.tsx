import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Platform, TextInput, Modal, Pressable } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { EventCard } from "@/components/EventCard";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

const API_URL = process.env.EXPO_PUBLIC_DOMAIN || 'http://localhost:5000';

type Event = any; // Using any for now to match flexible backend data

// Edit Modal Component
const EditEventModal = ({ visible, event, onClose, onSave }: { visible: boolean; event: Event | null; onClose: () => void; onSave: (data: any) => void }) => {
    const { theme, isDark } = useTheme();
    const [formData, setFormData] = useState<any>({});

    React.useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description,
                venue_name: event.venue_name || event.location?.name,
                category: event.category,
                price_range: event.price_range,
                image_url: event.image_url,
            });
        }
    }, [event]);

    if (!event) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: theme.backgroundDefault, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%', padding: Spacing.xl }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
                        <ThemedText type="h3">Edit Event</ThemedText>
                        <Pressable onPress={onClose}>
                            <Feather name="x" size={24} color={theme.text} />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={{ gap: Spacing.md, paddingBottom: 50 }}>
                        {Object.keys(formData).map((key) => (
                            <View key={key}>
                                <ThemedText type="small" style={{ marginBottom: 4, textTransform: 'capitalize' }}>{key.replace('_', ' ')}</ThemedText>
                                <TextInput
                                    style={{
                                        backgroundColor: theme.backgroundSecondary,
                                        color: theme.text,
                                        padding: Spacing.md,
                                        borderRadius: BorderRadius.md,
                                        borderWidth: 1,
                                        borderColor: theme.border
                                    }}
                                    value={formData[key]}
                                    onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                                    multiline={key === 'description'}
                                    textAlignVertical={key === 'description' ? 'top' : 'center'}
                                    numberOfLines={key === 'description' ? 4 : 1}
                                />
                            </View>
                        ))}
                    </ScrollView>

                    <View style={{ paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <Pressable
                            style={{ backgroundColor: Colors.light.primary, padding: Spacing.md, borderRadius: BorderRadius.full, alignItems: 'center' }}
                            onPress={() => onSave(formData)}
                        >
                            <ThemedText type="h4" style={{ color: '#FFF' }}>Save Changes</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function AdminDashboardScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [filterSource, setFilterSource] = useState<string | null>(null); // null = all, ticketsasa, etc.
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    // Fetch Stats
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/admin/stats`);
            return res.json();
        }
    });

    // Fetch Events
    const { data: eventsData, isLoading, refetch } = useQuery({
        queryKey: ['admin-events', filterSource],
        queryFn: async () => {
            const url = new URL(`${API_URL}/api/admin/events`);
            if (filterSource) url.searchParams.append('source', filterSource);
            const res = await fetch(url.toString());
            return res.json();
        }
    });

    const adaptedEvents = React.useMemo(() => {
        if (!eventsData?.events) return [];
        return eventsData.events.map((e: any) => ({
            ...e,
            id: e.id,
            title: e.title,
            date: e.starts_at ? new Date(e.starts_at).toLocaleDateString() : 'TBD',
            time: e.starts_at ? new Date(e.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            venue: e.venue_name || e.location?.name || 'Unknown Venue',
            location: e.location?.city || 'Nairobi',
            imageUrl: e.image_url || 'https://via.placeholder.com/300',
            category: e.category || 'Event',
            price: e.price_range || 0,
            currency: 'KES',
            attendees: 120, // Mock
            isPremium: false,
            isGoing: false,
            rating: 4.5,
            organizer: { name: 'Vybz', avatar: 'https://i.pravatar.cc/150?img=12' },
            coordinates: { latitude: 0, longitude: 0 }
        }));
    }, [eventsData]);

    // Mutations
    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_URL}/api/admin/events/${editingEvent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            setEditingEvent(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/api/admin/events/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <ThemedText type="h2">Admin Dashboard</ThemedText>
                <Pressable onPress={() => refetch()} style={{ padding: 8 }}>
                    <Feather name="refresh-ccw" size={20} color={theme.text} />
                </Pressable>
            </View>

            <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
                {/* Stats Row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                    <StatCard label="Total Events" value={stats?.total || 0} color={Colors.light.primary} />
                    <StatCard label="Scraped" value={stats?.external || 0} color={Colors.light.success} />
                    <StatCard label="Internal" value={stats?.internal || 0} color={Colors.light.warning} />
                    <StatCard label="Scraper Runs" value={stats?.scraperRuns || 0} color={Colors.light.error} />
                </ScrollView>

                {/* Filter Tabs */}
                <View style={styles.filterRow}>
                    {['All', 'ticketsasa', 'hustle', 'madfun'].map((src) => (
                        <Pressable
                            key={src}
                            onPress={() => setFilterSource(src === 'All' ? null : src)}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: (filterSource === src || (src === 'All' && !filterSource))
                                        ? theme.text
                                        : theme.backgroundSecondary
                                }
                            ]}
                        >
                            <ThemedText
                                type="small"
                                style={{
                                    color: (filterSource === src || (src === 'All' && !filterSource))
                                        ? theme.backgroundDefault
                                        : theme.textSecondary
                                }}
                            >
                                {src}
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>

                {/* Events List */}
                <View style={styles.listContainer}>
                    {adaptedEvents.map((event: any) => (
                        <View key={event.id} style={{ marginBottom: Spacing.md }}>
                            <EventCard
                                event={event}
                                variant="compact"
                                onPress={() => setEditingEvent(event)}
                            />
                            <View style={styles.actionRow}>
                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: theme.backgroundSecondary }]}
                                    onPress={() => setEditingEvent(event)}
                                >
                                    <Feather name="edit-2" size={14} color={Colors.light.primary} />
                                    <ThemedText type="tiny">Edit</ThemedText>
                                </Pressable>
                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                                    onPress={() => deleteMutation.mutate(event.id)}
                                >
                                    <Feather name="trash-2" size={14} color={Colors.light.error} />
                                    <ThemedText type="tiny" style={{ color: Colors.light.error }}>Delete</ThemedText>
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <EditEventModal
                visible={!!editingEvent}
                event={editingEvent}
                onClose={() => setEditingEvent(null)}
                onSave={(data) => updateMutation.mutate(data)}
            />
        </View>
    );
}

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => {
    const { theme } = useTheme();
    return (
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h2" style={{ color }}>{value}</ThemedText>
            <ThemedText type="tiny" style={{ color: theme.textSecondary }}>{label}</ThemedText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    statsScroll: {
        padding: Spacing.lg,
    },
    statCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginRight: Spacing.md,
        minWidth: 100,
        alignItems: 'center',
        ...Shadows.subtle,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
    },
    listContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.md,
        marginTop: -8,
        marginBottom: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
    }
});
