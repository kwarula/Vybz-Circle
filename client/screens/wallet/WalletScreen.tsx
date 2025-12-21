import React, { useState, useCallback } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
    Alert,
    TextInput,
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

type NavigationProp = NativeStackNavigationProp<any>;

// Mock transaction history
const mockTransactions = [
    {
        id: "1",
        type: "purchase" as const,
        title: "Sunset Yoga & Chill",
        subtitle: "VIP Ticket",
        amount: -6000,
        date: "Today, 2:30 PM",
        icon: "ticket-outline",
    },
    {
        id: "2",
        type: "topup" as const,
        title: "M-Pesa Top Up",
        subtitle: "From 0712 345 678",
        amount: 10000,
        date: "Yesterday, 10:15 AM",
        icon: "arrow-down",
    },
    {
        id: "3",
        type: "purchase" as const,
        title: "Amapiano Night",
        subtitle: "Regular Ticket x2",
        amount: -3000,
        date: "Dec 15, 4:20 PM",
        icon: "ticket-outline",
    },
    {
        id: "4",
        type: "refund" as const,
        title: "Event Cancelled",
        subtitle: "Jazz Night Refund",
        amount: 2500,
        date: "Dec 14, 9:00 AM",
        icon: "refresh",
    },
    {
        id: "5",
        type: "split" as const,
        title: "Bill Split Received",
        subtitle: "From Sarah K.",
        amount: 1500,
        date: "Dec 12, 8:45 PM",
        icon: "people",
    },
];

interface TransactionItemProps {
    transaction: typeof mockTransactions[0];
    index: number;
}

function TransactionItem({ transaction, index }: TransactionItemProps) {
    const { theme } = useTheme();
    const isPositive = transaction.amount > 0;

    return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable
                style={[styles.transactionItem, { borderBottomColor: theme.border }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
                <View
                    style={[
                        styles.transactionIcon,
                        { backgroundColor: isPositive ? Colors.light.goingBg : Colors.light.primaryMuted },
                    ]}
                >
                    <Ionicons
                        name={transaction.icon as any}
                        size={20}
                        color={isPositive ? Colors.light.success : Colors.light.primary}
                    />
                </View>
                <View style={styles.transactionInfo}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {transaction.title}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                        {transaction.subtitle}
                    </ThemedText>
                </View>
                <View style={styles.transactionAmount}>
                    <ThemedText
                        type="body"
                        style={{
                            fontWeight: "700",
                            color: isPositive ? Colors.light.success : theme.text,
                        }}
                    >
                        {isPositive ? "+" : ""}KES {Math.abs(transaction.amount).toLocaleString()}
                    </ThemedText>
                    <ThemedText type="tiny" style={{ color: theme.textMuted }}>
                        {transaction.date}
                    </ThemedText>
                </View>
            </Pressable>
        </Animated.View>
    );
}

interface TopUpModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

function TopUpModal({ visible, onClose, onConfirm }: TopUpModalProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const quickAmounts = [500, 1000, 2000, 5000];

    const handleConfirm = async () => {
        const numAmount = parseInt(amount);
        if (!numAmount || numAmount < 50) {
            Alert.alert("Invalid Amount", "Minimum top-up is KES 50");
            return;
        }

        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Simulate M-Pesa STK push
        await new Promise((resolve) => setTimeout(resolve, 1500));

        Alert.alert(
            "M-Pesa Request Sent",
            `Check your phone for the STK push to complete payment of KES ${numAmount.toLocaleString()}.`,
            [{ text: "OK", onPress: onClose }]
        );
        setIsLoading(false);
        setAmount("");
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
                <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.lg }]}>
                    <Pressable
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
                    >
                        <Feather name="x" size={22} color={theme.text} />
                    </Pressable>
                    <ThemedText type="h3">Top Up Wallet</ThemedText>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.modalContent}>
                    {/* M-Pesa Logo/Badge */}
                    <View style={[styles.mpesaBadge, { backgroundColor: "#4CAF50" }]}>
                        <ThemedText type="h4" style={{ color: "#FFF" }}>
                            M-PESA
                        </ThemedText>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.amountSection}>
                        <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.sm }}>
                            Enter amount
                        </ThemedText>
                        <View style={[styles.amountInputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                            <ThemedText type="h3" style={{ color: theme.textMuted }}>
                                KES
                            </ThemedText>
                            <TextInput
                                style={[styles.amountInput, { color: theme.text }]}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    </View>

                    {/* Quick Amounts */}
                    <View style={styles.quickAmounts}>
                        {quickAmounts.map((quickAmount) => (
                            <Pressable
                                key={quickAmount}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setAmount(quickAmount.toString());
                                }}
                                style={[
                                    styles.quickAmountBtn,
                                    {
                                        backgroundColor: amount === quickAmount.toString()
                                            ? Colors.light.primaryMuted
                                            : theme.backgroundSecondary,
                                        borderColor: amount === quickAmount.toString()
                                            ? Colors.light.primary
                                            : theme.border,
                                    },
                                ]}
                            >
                                <ThemedText
                                    type="small"
                                    style={{
                                        color: amount === quickAmount.toString() ? Colors.light.primary : theme.text,
                                        fontWeight: "600",
                                    }}
                                >
                                    {quickAmount.toLocaleString()}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>

                    {/* Phone Number */}
                    <View style={[styles.phoneInfo, { backgroundColor: theme.backgroundSecondary }]}>
                        <Feather name="smartphone" size={20} color={theme.textMuted} />
                        <View style={{ flex: 1 }}>
                            <ThemedText type="small" style={{ color: theme.textMuted }}>
                                STK Push will be sent to
                            </ThemedText>
                            <ThemedText type="body" style={{ fontWeight: "600" }}>
                                +254 712 345 678
                            </ThemedText>
                        </View>
                        <Pressable>
                            <ThemedText type="small" style={{ color: Colors.light.primary }}>
                                Change
                            </ThemedText>
                        </Pressable>
                    </View>

                    {/* Confirm Button */}
                    <Pressable
                        onPress={handleConfirm}
                        disabled={!amount || isLoading}
                        style={[
                            styles.confirmButton,
                            {
                                backgroundColor: Colors.light.primary,
                                opacity: !amount || isLoading ? 0.6 : 1,
                            },
                        ]}
                    >
                        <ThemedText type="h4" style={{ color: "#FFF" }}>
                            {isLoading ? "Requesting..." : "Confirm Top Up"}
                        </ThemedText>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

export default function WalletScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const { theme, isDark } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [showTopUp, setShowTopUp] = useState(false);

    // Mock wallet balance
    const balance = 4500;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRefreshing(false);
    }, []);

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
                <ThemedText type="h2">Wallet</ThemedText>
                <Pressable style={{ padding: Spacing.sm }}>
                    <Feather name="help-circle" size={22} color={theme.textMuted} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing["3xl"] }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
                }
            >
                {/* Balance Card */}
                <Animated.View entering={FadeIn.duration(500)}>
                    <LinearGradient
                        colors={Gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <View style={styles.balanceHeader}>
                            <ThemedText type="small" style={{ color: "rgba(255,255,255,0.7)" }}>
                                Available Balance
                            </ThemedText>
                            <View style={styles.mpesaTag}>
                                <ThemedText type="tiny" style={{ color: "#FFF", fontWeight: "700" }}>
                                    M-PESA
                                </ThemedText>
                            </View>
                        </View>
                        <ThemedText type="hero" style={{ color: "#FFF" }}>
                            KES {balance.toLocaleString()}
                        </ThemedText>

                        {/* Quick Actions */}
                        <View style={styles.quickActions}>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setShowTopUp(true);
                                }}
                                style={styles.quickActionBtn}
                            >
                                <View style={styles.quickActionIcon}>
                                    <Feather name="plus" size={20} color={Colors.light.primary} />
                                </View>
                                <ThemedText type="small" style={{ color: "#FFF" }}>
                                    Top Up
                                </ThemedText>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    Alert.alert("Withdraw", "Withdraw to M-Pesa coming soon!");
                                }}
                                style={styles.quickActionBtn}
                            >
                                <View style={styles.quickActionIcon}>
                                    <Feather name="arrow-up-right" size={20} color={Colors.light.primary} />
                                </View>
                                <ThemedText type="small" style={{ color: "#FFF" }}>
                                    Withdraw
                                </ThemedText>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    Alert.alert("Send", "Send to friends coming soon!");
                                }}
                                style={styles.quickActionBtn}
                            >
                                <View style={styles.quickActionIcon}>
                                    <Feather name="send" size={18} color={Colors.light.primary} />
                                </View>
                                <ThemedText type="small" style={{ color: "#FFF" }}>
                                    Send
                                </ThemedText>
                            </Pressable>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Transaction History */}
                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="h3">Transactions</ThemedText>
                        <Pressable>
                            <ThemedText type="small" style={{ color: Colors.light.primary }}>
                                See all
                            </ThemedText>
                        </Pressable>
                    </View>

                    {mockTransactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
                            <ThemedText type="body" style={{ color: theme.textMuted, marginTop: Spacing.lg }}>
                                No transactions yet
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={[styles.transactionsList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                            {mockTransactions.map((transaction, index) => (
                                <TransactionItem key={transaction.id} transaction={transaction} index={index} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Top Up Modal */}
            <TopUpModal
                visible={showTopUp}
                onClose={() => setShowTopUp(false)}
                onConfirm={(amount) => console.log("Top up:", amount)}
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
    scrollView: {
        flex: 1,
    },
    balanceCard: {
        marginHorizontal: Spacing.xl,
        padding: Spacing.xl,
        borderRadius: BorderRadius["2xl"],
        marginBottom: Spacing["2xl"],
    },
    balanceHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.sm,
    },
    mpesaTag: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: Spacing["2xl"],
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.2)",
    },
    quickActionBtn: {
        alignItems: "center",
        gap: Spacing.sm,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center",
        justifyContent: "center",
    },
    transactionsSection: {
        paddingHorizontal: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    transactionsList: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: "hidden",
    },
    transactionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderBottomWidth: 1,
        gap: Spacing.md,
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    transactionInfo: {
        flex: 1,
    },
    transactionAmount: {
        alignItems: "flex-end",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: Spacing["3xl"],
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
    mpesaBadge: {
        alignSelf: "center",
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing["2xl"],
    },
    amountSection: {
        marginBottom: Spacing.xl,
    },
    amountInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.md,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: "700",
    },
    quickAmounts: {
        flexDirection: "row",
        gap: Spacing.md,
        marginBottom: Spacing["2xl"],
    },
    quickAmountBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: "center",
    },
    phoneInfo: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: Spacing.md,
        marginBottom: Spacing["2xl"],
    },
    confirmButton: {
        height: 56,
        borderRadius: BorderRadius.lg,
        alignItems: "center",
        justifyContent: "center",
    },
});
