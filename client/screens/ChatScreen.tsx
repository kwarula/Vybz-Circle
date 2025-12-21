import React, { useState, useRef } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { mockMessages, mockUsers } from "@/data/mockData";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;

interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    isMe: boolean;
    timestamp: string;
}

const mockChatMessages: ChatMessage[] = [
    { id: "1", text: "Hey everyone! Who's going to Amapiano Night?", sender: "Alex M.", isMe: false, timestamp: "10:30 AM" },
    { id: "2", text: "I'm definitely in! Already got my tickets 🎉", sender: "You", isMe: true, timestamp: "10:32 AM" },
    { id: "3", text: "Same here! VIP section?", sender: "Sarah K.", isMe: false, timestamp: "10:35 AM" },
    { id: "4", text: "Yes! Let's meet at 9pm by the entrance", sender: "You", isMe: true, timestamp: "10:36 AM" },
    { id: "5", text: "Perfect, see you all there! 🔥", sender: "James O.", isMe: false, timestamp: "10:40 AM" },
];

export default function ChatScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<ChatScreenRouteProp>();
    const { theme } = useTheme();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
    const flatListRef = useRef<FlatList>(null);

    const crew = mockMessages.find((m) => m.id === route.params.messageId) || mockMessages[0];

    const handleSend = () => {
        if (message.trim()) {
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                text: message.trim(),
                sender: "You",
                isMe: true,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, newMessage]);
            setMessage("");
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => (
        <View style={[styles.messageRow, item.isMe && styles.messageRowMe]}>
            {!item.isMe && (
                <Avatar uri={mockUsers[0].avatar} size={32} />
            )}
            <View
                style={[
                    styles.messageBubble,
                    {
                        backgroundColor: item.isMe ? Colors.light.primary : theme.backgroundDefault,
                    },
                    item.isMe && styles.messageBubbleMe,
                ]}
            >
                {!item.isMe && (
                    <ThemedText type="tiny" style={{ color: Colors.light.primary, fontWeight: "600", marginBottom: 4 }}>
                        {item.sender}
                    </ThemedText>
                )}
                <ThemedText type="body" style={{ color: item.isMe ? "#FFF" : theme.text }}>
                    {item.text}
                </ThemedText>
                <ThemedText type="tiny" style={{ color: item.isMe ? "rgba(255,255,255,0.7)" : theme.textMuted, marginTop: 4, alignSelf: "flex-end" }}>
                    {item.timestamp}
                </ThemedText>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={80}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <View style={styles.headerInfo}>
                    <ThemedText type="h4">{crew.crewName}</ThemedText>
                    <ThemedText type="tiny" secondary>{crew.members.length} members</ThemedText>
                </View>
                <View style={styles.avatarStack}>
                    {crew.members.slice(0, 3).map((member, index) => (
                        <View key={member.id} style={{ marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index }}>
                            <Avatar uri={member.avatar} size={28} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.sm }]}>
                <Pressable style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="plus" size={20} color={theme.textSecondary} />
                </Pressable>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.textMuted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                />
                <Pressable
                    onPress={handleSend}
                    style={[styles.sendButton, { backgroundColor: message.trim() ? Colors.light.primary : theme.backgroundSecondary }]}
                >
                    <Feather name="send" size={18} color={message.trim() ? "#FFF" : theme.textMuted} />
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.1)",
    },
    backButton: {
        marginRight: Spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    avatarStack: {
        flexDirection: "row",
    },
    messagesList: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    messageRow: {
        flexDirection: "row",
        marginBottom: Spacing.md,
        alignItems: "flex-end",
        gap: Spacing.sm,
    },
    messageRowMe: {
        flexDirection: "row-reverse",
    },
    messageBubble: {
        maxWidth: "75%",
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderBottomLeftRadius: BorderRadius.xs,
    },
    messageBubbleMe: {
        borderBottomLeftRadius: BorderRadius.lg,
        borderBottomRightRadius: BorderRadius.xs,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        gap: Spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(0,0,0,0.1)",
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
});
