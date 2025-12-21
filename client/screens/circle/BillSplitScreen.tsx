import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Typography } from "@/constants/theme";
import { currentCircle, CircleMember } from "@/data/mockData";

interface SplitMember extends CircleMember {
    selected: boolean;
    customAmount?: number;
}

type SplitType = 'equal' | 'custom' | 'percentage';

export default function BillSplitScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme } = useTheme();

    const [billAmount, setBillAmount] = useState("");
    const [billName, setBillName] = useState("");
    const [splitType, setSplitType] = useState<SplitType>('equal');
    const [members, setMembers] = useState<SplitMember[]>(
        currentCircle.members.map(m => ({ ...m, selected: true }))
    );

    const selectedMembers = members.filter(m => m.selected);
    const totalAmount = parseFloat(billAmount) || 0;

    const perPersonAmount = useMemo(() => {
        if (selectedMembers.length === 0) return 0;
        return Math.ceil(totalAmount / selectedMembers.length);
    }, [totalAmount, selectedMembers.length]);

    const toggleMember = (memberId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMembers(prev => prev.map(m =>
            m.id === memberId ? { ...m, selected: !m.selected } : m
        ));
    };

    const handleSendRequest = () => {
        if (!billAmount || totalAmount <= 0) {
            Alert.alert("Enter Amount", "Please enter the total bill amount");
            return;
        }
        if (selectedMembers.length === 0) {
            Alert.alert("Select Members", "Please select at least one member to split with");
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
            "Request Sent! 💸",
            `Bill split request sent to ${selectedMembers.length} members.\n\nEach person owes KES ${perPersonAmount.toLocaleString()}`,
            [
                {
                    text: "Done",
                    onPress: () => navigation.goBack()
                }
            ]
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="x" size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h3">Split Bill</ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Amount Input */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
                    <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.sm }}>
                        BILL AMOUNT
                    </ThemedText>
                    <View style={[styles.amountContainer, { backgroundColor: theme.backgroundSecondary }]}>
                        <ThemedText type="h2" style={{ color: theme.textMuted }}>KES</ThemedText>
                        <TextInput
                            style={[styles.amountInput, { color: theme.text }]}
                            placeholder="0"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                            value={billAmount}
                            onChangeText={setBillAmount}
                        />
                    </View>
                </Animated.View>

                {/* Bill Name */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
                    <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.sm }}>
                        WHAT'S THIS FOR? (Optional)
                    </ThemedText>
                    <TextInput
                        style={[styles.nameInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                        placeholder="e.g., Dinner at K1"
                        placeholderTextColor={theme.textMuted}
                        value={billName}
                        onChangeText={setBillName}
                    />
                </Animated.View>

                {/* Split Type */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
                    <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.sm }}>
                        SPLIT TYPE
                    </ThemedText>
                    <View style={styles.splitTypeRow}>
                        {(['equal', 'custom', 'percentage'] as SplitType[]).map((type) => (
                            <Pressable
                                key={type}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSplitType(type);
                                }}
                                style={[
                                    styles.splitTypeButton,
                                    {
                                        backgroundColor: splitType === type ? Colors.light.primary + '20' : theme.backgroundSecondary,
                                        borderColor: splitType === type ? Colors.light.primary : 'transparent',
                                    }
                                ]}
                            >
                                <ThemedText
                                    type="small"
                                    style={{
                                        color: splitType === type ? Colors.light.primary : theme.text,
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {type}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Members */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="small" style={{ color: theme.textMuted }}>
                            SPLIT WITH ({selectedMembers.length} selected)
                        </ThemedText>
                        <Pressable onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const allSelected = members.every(m => m.selected);
                            setMembers(prev => prev.map(m => ({ ...m, selected: !allSelected })));
                        }}>
                            <ThemedText type="small" style={{ color: Colors.light.primary }}>
                                {members.every(m => m.selected) ? 'Deselect All' : 'Select All'}
                            </ThemedText>
                        </Pressable>
                    </View>

                    {members.map((member, index) => (
                        <Animated.View key={member.id} entering={FadeInDown.delay(350 + index * 50).duration(300)}>
                            <Pressable
                                onPress={() => toggleMember(member.id)}
                                style={[
                                    styles.memberRow,
                                    {
                                        backgroundColor: member.selected ? Colors.light.primary + '10' : theme.backgroundSecondary,
                                        borderColor: member.selected ? Colors.light.primary + '40' : 'transparent',
                                    }
                                ]}
                            >
                                <View style={styles.memberInfo}>
                                    <Avatar uri={member.avatar} size={44} />
                                    <View>
                                        <ThemedText type="body" style={{ fontWeight: '600' }}>{member.name}</ThemedText>
                                        {member.selected && totalAmount > 0 && (
                                            <ThemedText type="small" style={{ color: Colors.light.primary }}>
                                                KES {perPersonAmount.toLocaleString()}
                                            </ThemedText>
                                        )}
                                    </View>
                                </View>
                                <View style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: member.selected ? Colors.light.primary : 'transparent',
                                        borderColor: member.selected ? Colors.light.primary : theme.textMuted,
                                    }
                                ]}>
                                    {member.selected && <Feather name="check" size={14} color="#FFF" />}
                                </View>
                            </Pressable>
                        </Animated.View>
                    ))}
                </Animated.View>
            </ScrollView>

            {/* Bottom Action */}
            <Animated.View
                entering={FadeInUp.delay(500).duration(400)}
                style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundDefault }]}
            >
                {totalAmount > 0 && selectedMembers.length > 0 && (
                    <View style={styles.summaryRow}>
                        <ThemedText type="body" style={{ color: theme.textSecondary }}>
                            {selectedMembers.length} people × KES {perPersonAmount.toLocaleString()}
                        </ThemedText>
                        <ThemedText type="h3">
                            KES {totalAmount.toLocaleString()}
                        </ThemedText>
                    </View>
                )}
                <Pressable
                    onPress={handleSendRequest}
                    style={[styles.sendButton, { backgroundColor: Colors.light.primary }]}
                >
                    <MaterialCommunityIcons name="send" size={20} color="#FFF" />
                    <ThemedText type="body" style={{ color: '#FFF', fontWeight: '700' }}>
                        Send Split Request
                    </ThemedText>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: Spacing.xl,
        paddingBottom: 200,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        gap: Spacing.md,
    },
    amountInput: {
        flex: 1,
        fontSize: 48,
        fontWeight: '700',
    },
    nameInput: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        fontSize: 16,
    },
    splitTypeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    splitTypeButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
    },
});
