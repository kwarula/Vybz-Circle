import React, { useState, useCallback } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    Pressable,
    Image,
    RefreshControl,
    Dimensions,
    Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows, Gradients } from "@/constants/theme";
import { mockEvents } from "@/data/mockData";

const { width } = Dimensions.get("window");

// Mock ticket data based on events
const mockTickets = [
    {
        id: "t1",
        eventId: "1",
        ticketCode: "VYBZ-2024-A1B2C3",
        tier: "VIP",
        price: 6000,
        status: "valid" as const,
        purchasedAt: "2024-12-15T10:30:00Z",
        event: mockEvents[0],
    },
    {
        id: "t2",
        eventId: "2",
        ticketCode: "VYBZ-2024-D4E5F6",
        tier: "Regular",
        price: 1500,
        status: "valid" as const,
        purchasedAt: "2024-12-14T15:45:00Z",
        event: mockEvents[1],
    },
    {
        id: "t3",
        eventId: "3",
        ticketCode: "VYBZ-2024-G7H8I9",
        tier: "Early Bird",
        price: 2000,
        status: "used" as const,
        purchasedAt: "2024-11-20T09:00:00Z",
        checkedInAt: "2024-12-01T19:30:00Z",
        event: mockEvents[2],
    },
];

type Ticket = typeof mockTickets[0];

interface TicketCardProps {
    ticket: Ticket;
    onPress: () => void;
    index: number;
}

function TicketCard({ ticket, onPress, index }: TicketCardProps) {
    const { theme } = useTheme();
    const isPast = ticket.status === "used";

    return (
        <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }}
                style={({ pressed }) => [
                    styles.ticketCard,
                    {
                        backgroundColor: theme.backgroundDefault,
                        borderColor: theme.border,
                        opacity: pressed ? 0.95 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                ]}
            >
                {/* Event Image */}
                <View style={styles.ticketImageContainer}>
                    <Image
                        source={{ uri: ticket.event.imageUrl }}
                        style={[styles.ticketImage, isPast && styles.ticketImagePast]}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={Gradients.darkOverlay}
                        style={styles.imageGradient}
                    />
                    {/* Status Badge */}
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: isPast ? theme.backgroundSecondary : Colors.light.success }
                    ]}>
                        <Ionicons
                            name={isPast ? "checkmark-circle" : "ticket-outline"}
                            size={12}
                            color={isPast ? theme.textMuted : "#FFF"}
                        />
                        <ThemedText
                            type="tiny"
                            style={{ color: isPast ? theme.textMuted : "#FFF" }}
                        >
                            {isPast ? "Attended" : "Valid"}
                        </ThemedText>
                    </View>
                    {/* Tier Badge */}
                    <View style={styles.tierBadge}>
                        <ThemedText type="tiny" style={{ color: "#FFF", fontWeight: "700" }}>
                            {ticket.tier}
                        </ThemedText>
                    </View>
                </View>

                {/* Ticket Details */}
                <View style={styles.ticketDetails}>
                    <ThemedText type="h4" numberOfLines={2} style={isPast && { color: theme.textMuted }}>
                        {ticket.event.title}
                    </ThemedText>

                    <View style={styles.ticketMeta}>
                        <View style={styles.metaRow}>
                            <Feather name="calendar" size={14} color={theme.textMuted} />
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                {ticket.event.date}
                            </ThemedText>
                        </View>
                        <View style={styles.metaRow}>
                            <Feather name="map-pin" size={14} color={theme.textMuted} />
                            <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
                                {ticket.event.venue}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Ticket Code & Actions */}
                    <View style={styles.ticketFooter}>
                        <View style={[styles.codeContainer, { backgroundColor: theme.backgroundSecondary }]}>
                            <ThemedText type="tiny" style={{ color: theme.textMuted, fontFamily: "monospace" }}>
                                {ticket.ticketCode}
                            </ThemedText>
                        </View>
                        <View style={[styles.qrHint, { backgroundColor: Colors.light.primaryMuted }]}>
                            <Ionicons name="qr-code" size={18} color={Colors.light.primary} />
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

interface TicketDetailModalProps {
    ticket: Ticket | null;
    visible: boolean;
    onClose: () => void;
}

function TicketDetailModal({ ticket, visible, onClose }: TicketDetailModalProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    if (!ticket) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
                {/* Header */}
                <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.lg }]}>
                    <Pressable
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
                    >
                        <Feather name="x" size={22} color={theme.text} />
                    </Pressable>
                    <ThemedText type="h3">Ticket Details</ThemedText>
                    <View style={{ width: 44 }} />
                </View>

                {/* Content */}
                <View style={styles.modalContent}>
                    {/* Event Info */}
                    <View style={[styles.eventInfoCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                        <Image
                            source={{ uri: ticket.event.imageUrl }}
                            style={styles.eventImage}
                            resizeMode="cover"
                        />
                        <View style={styles.eventInfo}>
                            <ThemedText type="h4">{ticket.event.title}</ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                                {ticket.event.date} • {ticket.event.time}
                            </ThemedText>
                            <ThemedText type="small" style={{ color: theme.textMuted, marginTop: 2 }}>
                                {ticket.event.venue}
                            </ThemedText>
                        </View>
                    </View>

                    {/* QR Code Placeholder */}
                    <View style={[styles.qrContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                        <View style={styles.qrCode}>
                            <Ionicons name="qr-code" size={120} color={theme.text} />
                        </View>
                        <ThemedText type="body" style={{ marginTop: Spacing.lg, fontWeight: "600" }}>
                            {ticket.ticketCode}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                            Show this QR code at the entrance
                        </ThemedText>
                    </View>

                    {/* Ticket Details */}
                    <View style={[styles.detailsCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                        <View style={styles.detailRow}>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>Tier</ThemedText>
                            <ThemedText type="body" style={{ fontWeight: "600" }}>{ticket.tier}</ThemedText>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <View style={styles.detailRow}>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>Price</ThemedText>
                            <ThemedText type="body" style={{ fontWeight: "600", color: Colors.light.primary }}>
                                KES {ticket.price.toLocaleString()}
                            </ThemedText>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <View style={styles.detailRow}>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>Status</ThemedText>
                            <View style={[
                                styles.statusPill,
                                { backgroundColor: ticket.status === "valid" ? Colors.light.goingBg : theme.backgroundSecondary }
                            ]}>
                                <ThemedText
                                    type="tiny"
                                    style={{
                                        color: ticket.status === "valid" ? Colors.light.success : theme.textMuted,
                                        fontWeight: "600",
                                    }}
                                >
                                    {ticket.status === "valid" ? "Valid" : "Used"}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    {ticket.status === "valid" && (
                        <View style={styles.actionButtons}>
                            <Pressable
                                style={[styles.actionButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
                                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                            >
                                <Feather name="share-2" size={20} color={theme.text} />
                                <ThemedText type="small">Share</ThemedText>
                            </Pressable>
                            <Pressable
                                style={[styles.actionButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
                                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                            >
                                <Feather name="send" size={20} color={theme.text} />
                                <ThemedText type="small">Transfer</ThemedText>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default function MyTicketsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { theme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const upcomingTickets = mockTickets.filter(t => t.status === "valid");
    const pastTickets = mockTickets.filter(t => t.status === "used");
    const currentTickets = activeTab === "upcoming" ? upcomingTickets : pastTickets;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // TODO: Fetch tickets from Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    }, []);

    const ListEmpty = () => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="ticket-outline" size={48} color={theme.textMuted} />
            </View>
            <ThemedText type="h3" style={{ marginTop: Spacing.xl }}>
                {activeTab === "upcoming" ? "No upcoming tickets" : "No past tickets"}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textMuted, textAlign: "center", marginTop: Spacing.sm }}>
                {activeTab === "upcoming"
                    ? "Your tickets for upcoming events will appear here"
                    : "Tickets from events you've attended will appear here"
                }
            </ThemedText>
            {activeTab === "upcoming" && (
                <Pressable
                    onPress={() => navigation.navigate("Main", { screen: "ExploreTab" })}
                    style={[styles.exploreButton, { backgroundColor: Colors.light.primary }]}
                >
                    <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                        Explore Events
                    </ThemedText>
                </Pressable>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                    <Feather name="arrow-left" size={22} color={theme.text} />
                </Pressable>
                <ThemedText type="h2">My Tickets</ThemedText>
                <Pressable style={[styles.backButton, { backgroundColor: "transparent" }]}>
                    <Feather name="search" size={22} color={theme.text} />
                </Pressable>
            </View>

            {/* Tabs */}
            <View style={[styles.tabBar, { borderColor: theme.border }]}>
                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        setActiveTab("upcoming");
                    }}
                    style={[
                        styles.tab,
                        activeTab === "upcoming" && [styles.tabActive, { borderColor: Colors.light.primary }],
                    ]}
                >
                    <ThemedText
                        type="body"
                        style={[
                            { color: theme.textMuted },
                            activeTab === "upcoming" && { color: Colors.light.primary, fontWeight: "600" },
                        ]}
                    >
                        Upcoming ({upcomingTickets.length})
                    </ThemedText>
                </Pressable>
                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        setActiveTab("past");
                    }}
                    style={[
                        styles.tab,
                        activeTab === "past" && [styles.tabActive, { borderColor: Colors.light.primary }],
                    ]}
                >
                    <ThemedText
                        type="body"
                        style={[
                            { color: theme.textMuted },
                            activeTab === "past" && { color: Colors.light.primary, fontWeight: "600" },
                        ]}
                    >
                        Past ({pastTickets.length})
                    </ThemedText>
                </Pressable>
            </View>

            {/* Ticket List */}
            <FlatList
                data={currentTickets}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <TicketCard
                        ticket={item}
                        index={index}
                        onPress={() => setSelectedTicket(item)}
                    />
                )}
                contentContainerStyle={{
                    padding: Spacing.xl,
                    paddingBottom: insets.bottom + Spacing["3xl"],
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={ListEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.light.primary}
                    />
                }
            />

            {/* Ticket Detail Modal */}
            <TicketDetailModal
                ticket={selectedTicket}
                visible={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    tabBar: {
        flexDirection: "row",
        marginHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        marginBottom: Spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        borderBottomWidth: 2,
    },
    ticketCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: "hidden",
        marginBottom: Spacing.lg,
    },
    ticketImageContainer: {
        height: 140,
        position: "relative",
    },
    ticketImage: {
        width: "100%",
        height: "100%",
    },
    ticketImagePast: {
        opacity: 0.6,
    },
    imageGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    statusBadge: {
        position: "absolute",
        top: Spacing.md,
        left: Spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    tierBadge: {
        position: "absolute",
        top: Spacing.md,
        right: Spacing.md,
        backgroundColor: Colors.light.primary,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    ticketDetails: {
        padding: Spacing.lg,
    },
    ticketMeta: {
        marginTop: Spacing.md,
        gap: Spacing.xs,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    ticketFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: Spacing.lg,
    },
    codeContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    qrHint: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.sm,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing["3xl"],
        paddingTop: Spacing["3xl"],
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    exploreButton: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing["2xl"],
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.full,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    modalContent: {
        flex: 1,
        padding: Spacing.xl,
    },
    eventInfoCard: {
        flexDirection: "row",
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    eventImage: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.lg,
    },
    eventInfo: {
        flex: 1,
        justifyContent: "center",
    },
    qrContainer: {
        alignItems: "center",
        padding: Spacing["2xl"],
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
    },
    qrCode: {
        padding: Spacing.lg,
        backgroundColor: "#FFF",
        borderRadius: BorderRadius.lg,
    },
    detailsCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: Spacing.sm,
    },
    divider: {
        height: 1,
    },
    statusPill: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    actionButtons: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
});
