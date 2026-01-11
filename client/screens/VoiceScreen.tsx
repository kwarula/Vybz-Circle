import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, StatusBar, Dimensions, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioRecorder, useAudioPlayer, AudioModule } from "expo-audio";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    FadeIn,
    FadeInUp
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { pcmToWav } from "@/utils/audio";

// Only import FileSystem on native platforms
let FileSystem: typeof import("expo-file-system/legacy") | null = null;
if (Platform.OS !== "web") {
    FileSystem = require("expo-file-system/legacy");
}

const { width, height } = Dimensions.get("window");

// Read API Key from environment
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-live-2.5-flash-preview"; // Live API model from docs
const WEBSOCKET_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

export default function VoiceScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();

    // Connection & Voice State
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [statusText, setStatusText] = useState("Tap to connect");

    // Audio Hooks
    const recorder = useAudioRecorder({
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 256000,
        extension: '.wav',
        android: {
            extension: '.wav',
            outputFormat: 'default',
            audioEncoder: 'default',
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 256000,
        } as any,
        ios: {
            extension: '.wav',
            outputFormat: 'lpcm',
            audioQuality: 0x7f,
            sampleRate: 16000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
        } as any,
        web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
        },
    } as any);
    const player = useAudioPlayer();

    // Refs
    const ws = useRef<WebSocket | null>(null);
    const audioQueue = useRef<string[]>([]);
    const isPlayingRef = useRef(false);
    const setupComplete = useRef(false);

    // Animated pulse rings
    const ring1Scale = useSharedValue(1);
    const ring2Scale = useSharedValue(1);
    const ring3Scale = useSharedValue(1);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
            if (recorder.isRecording) {
                recorder.stop();
            }
        };
    }, []);

    // Pulse animation effect
    useEffect(() => {
        if (isListening || isSpeaking) {
            ring1Scale.value = withRepeat(
                withSequence(
                    withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 0 })
                ),
                -1
            );
            ring2Scale.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 300 }),
                    withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 0 })
                ),
                -1
            );
            ring3Scale.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 600 }),
                    withTiming(2.1, { duration: 1500, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 0 })
                ),
                -1
            );
        } else {
            ring1Scale.value = withTiming(1);
            ring2Scale.value = withTiming(1);
            ring3Scale.value = withTiming(1);
        }
    }, [isListening, isSpeaking]);

    const ring1Style = useAnimatedStyle(() => ({
        transform: [{ scale: ring1Scale.value }],
        opacity: (isListening || isSpeaking) ? 0.4 : 0,
    }));

    const ring2Style = useAnimatedStyle(() => ({
        transform: [{ scale: ring2Scale.value }],
        opacity: (isListening || isSpeaking) ? 0.25 : 0,
    }));

    const ring3Style = useAnimatedStyle(() => ({
        transform: [{ scale: ring3Scale.value }],
        opacity: (isListening || isSpeaking) ? 0.15 : 0,
    }));

    // Helper to read WebSocket message (handles Blob on web)
    const readWebSocketMessage = async (data: any): Promise<string> => {
        if (typeof data === "string") return data;
        if (data instanceof Blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsText(data);
            });
        }
        if (data instanceof ArrayBuffer) {
            return new TextDecoder().decode(data);
        }
        return JSON.stringify(data);
    };

    // Audio Playback Queue
    const processAudioQueue = async () => {
        if (Platform.OS === "web" || !FileSystem) {
            // For web, we'd need Web Audio API - skipping for now
            if (audioQueue.current.length > 0) {
                console.log("Web audio playback - clearing queue");
                audioQueue.current = [];
                setIsSpeaking(false);
                setStatusText("Hold to speak");
            }
            return;
        }

        if (isPlayingRef.current || audioQueue.current.length === 0) return;

        isPlayingRef.current = true;
        const nextChunkBase64 = audioQueue.current.shift();

        if (nextChunkBase64) {
            try {
                setIsSpeaking(true);
                const wavBase64 = pcmToWav(nextChunkBase64, 24000);

                const timestamp = Date.now();
                const uri = `${FileSystem.cacheDirectory}gemini_response_${timestamp}.wav`;
                await FileSystem.writeAsStringAsync(uri, wavBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                await AudioModule.setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                });

                player.replace(uri);
                player.play();

                const listener = player.addListener('playbackFinished' as any, async () => {
                    listener.remove();
                    if (FileSystem) {
                        await FileSystem.deleteAsync(uri, { idempotent: true });
                    }
                    isPlayingRef.current = false;

                    if (audioQueue.current.length === 0) {
                        setIsSpeaking(false);
                        setStatusText("Hold to speak");
                    }
                    processAudioQueue();
                });
            } catch (error) {
                console.error("Error playing audio chunk:", error);
                isPlayingRef.current = false;
                setIsSpeaking(false);
                processAudioQueue();
            }
        } else {
            isPlayingRef.current = false;
            setIsSpeaking(false);
        }
    };

    const queueAudio = (base64Data: string) => {
        console.log("Queueing audio chunk, length:", base64Data.length);
        audioQueue.current.push(base64Data);
        processAudioQueue();
    };

    // Connect to Gemini Live
    const connect = async () => {
        if (!GEMINI_API_KEY) {
            Alert.alert(
                "Missing API Key",
                "Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file."
            );
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setStatusText("Connecting...");
            console.log("Connecting to Gemini Live...");
            console.log("Using model:", MODEL_NAME);

            const socket = new WebSocket(WEBSOCKET_URL);

            socket.onopen = () => {
                console.log("WebSocket opened, sending setup...");

                // Setup message using snake_case for raw WebSocket protocol
                const setupMessage = {
                    setup: {
                        model: `models/${MODEL_NAME}`,
                        generation_config: {
                            response_modalities: ["AUDIO"],
                            speech_config: {
                                voice_config: {
                                    prebuilt_voice_config: {
                                        voice_name: "Aoede"
                                    }
                                }
                            }
                        }
                    }
                };

                console.log("Sending setup:", JSON.stringify(setupMessage));
                socket.send(JSON.stringify(setupMessage));
            };

            socket.onmessage = async (event) => {
                try {
                    const messageText = await readWebSocketMessage(event.data);
                    console.log("Received message:", messageText.substring(0, 200));
                    const data = JSON.parse(messageText);

                    // Check for setup complete
                    if (data.setupComplete) {
                        console.log("Setup complete!");
                        setupComplete.current = true;
                        setIsConnected(true);
                        setStatusText("Hold to speak");
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        return;
                    }

                    // Handle server content with audio
                    if (data.serverContent?.modelTurn?.parts) {
                        for (const part of data.serverContent.modelTurn.parts) {
                            if (part.inlineData?.data) {
                                console.log("Received audio data, mime:", part.inlineData.mimeType);
                                setStatusText("AI is responding...");
                                queueAudio(part.inlineData.data);
                            }
                            if (part.text) {
                                console.log("AI text:", part.text);
                            }
                        }
                    }

                    // Handle turn complete
                    if (data.serverContent?.turnComplete) {
                        console.log("Turn complete");
                        if (audioQueue.current.length === 0 && !isPlayingRef.current) {
                            setIsSpeaking(false);
                            setStatusText("Hold to speak");
                        }
                    }

                    // Handle errors
                    if (data.error) {
                        console.error("Server error:", data.error);
                        Alert.alert("AI Error", data.error.message || "Unknown error");
                    }

                } catch (e) {
                    console.error("Error parsing message:", e);
                }
            };

            socket.onerror = (error) => {
                console.error("WebSocket Error:", error);
                Alert.alert("Connection Error", "Failed to connect to Vybz AI.");
                setIsConnected(false);
                setupComplete.current = false;
                setStatusText("Tap to connect");
            };

            socket.onclose = (event) => {
                console.log("WebSocket Closed:", event.code, event.reason);
                setIsConnected(false);
                setupComplete.current = false;
                setStatusText("Tap to connect");
            };

            ws.current = socket;
        } catch (err) {
            console.error("Connection setup failed:", err);
            Alert.alert("Error", "Could not initiate connection.");
            setStatusText("Tap to connect");
        }
    };

    const disconnect = () => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
        setupComplete.current = false;
        setStatusText("Tap to connect");
    };

    // Send text message to Gemini
    const sendTextMessage = (text: string) => {
        if (!ws.current || !isConnected || !setupComplete.current) return;

        const message = {
            client_content: {
                turns: [
                    {
                        role: "user",
                        parts: [{ text }]
                    }
                ],
                turn_complete: true
            }
        };

        console.log("Sending text:", text);
        ws.current.send(JSON.stringify(message));
        setStatusText("Waiting for AI...");
    };

    const startRecording = async () => {
        if (!isConnected || !setupComplete.current) {
            console.log("Not connected or setup not complete");
            return;
        }
        if (recorder.isRecording || isListening) {
            console.log("Already recording");
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            await AudioModule.setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            recorder.record();
            setIsListening(true);
            setStatusText("Listening...");
            console.log("Recording started");
        } catch (err) {
            console.error("Failed to start recording:", err);
            setIsListening(false);
        }
    };

    const stopRecording = async () => {
        if (!recorder.isRecording) {
            console.log("No recording to stop");
            return;
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsListening(false);
            setStatusText("Sending...");

            await recorder.stop();
            const uri = recorder.uri;
            console.log("Recording stopped, file at:", uri);

            if (uri && ws.current && isConnected && setupComplete.current) {
                let base64Audio: string;
                let mimeType: string;

                if (Platform.OS === "web") {
                    // Web: fetch blob and convert
                    const response = await fetch(uri);
                    const blob = await response.blob();

                    base64Audio = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = reader.result as string;
                            resolve(result.split(",")[1]);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    mimeType = "audio/webm";
                } else if (FileSystem) {
                    // Native: read file directly
                    base64Audio = await FileSystem.readAsStringAsync(uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    // For WAV files recorded on iOS/Android, strip the 44-byte header to get raw PCM
                    // But we can also try sending as-is since Gemini might handle WAV
                    mimeType = "audio/pcm;rate=16000";
                } else {
                    throw new Error("FileSystem not available");
                }

                // Send audio using realtime_input format (snake_case for raw WebSocket)
                const audioMessage = {
                    realtime_input: {
                        media_chunks: [
                            {
                                mime_type: mimeType,
                                data: base64Audio
                            }
                        ]
                    }
                };

                console.log("Sending audio, mime:", mimeType, "length:", base64Audio.length);
                ws.current.send(JSON.stringify(audioMessage));
                setStatusText("Waiting for AI...");
            } else {
                console.log("Cannot send - ws:", !!ws.current, "connected:", isConnected, "setup:", setupComplete.current);
                setStatusText("Connection lost");
            }
        } catch (err) {
            console.error("Failed to stop recording:", err);
            setStatusText("Error sending audio");
        }
    };

    const handleMicPress = () => {
        if (!isConnected) {
            connect();
        }
    };

    const suggestions = [
        "Find me a concert this weekend",
        "What events are happening near me?",
        "Show me wellness events",
        "Any comedy shows tonight?",
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <ThemedText type="h2">Vybz AI</ThemedText>
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: 4 }}>
                    {isConnected ? "Your AI is ready" : "Your personal event assistant"}
                </ThemedText>
            </View>

            {/* Main Voice Button Area */}
            <View style={styles.centerArea}>
                {/* Pulse Rings */}
                <Animated.View style={[styles.pulseRing, styles.ring3, ring3Style]} />
                <Animated.View style={[styles.pulseRing, styles.ring2, ring2Style]} />
                <Animated.View style={[styles.pulseRing, styles.ring1, ring1Style]} />

                {/* Main Button */}
                <Pressable
                    onPress={handleMicPress}
                    onPressIn={isConnected && setupComplete.current ? startRecording : undefined}
                    onPressOut={isConnected && setupComplete.current ? stopRecording : undefined}
                    style={({ pressed }) => [
                        styles.micButton,
                        pressed && { transform: [{ scale: 0.95 }] }
                    ]}
                >
                    <LinearGradient
                        colors={
                            isListening ? ['#10B981', '#059669'] :
                                isSpeaking ? ['#F59E0B', '#D97706'] :
                                    isConnected ? ['#8B5CF6', '#7C3AED'] :
                                        ['#6D28D9', '#5B21B6']
                        }
                        style={styles.micGradient}
                    >
                        <Feather
                            name={isListening ? "mic" : isSpeaking ? "volume-2" : "mic"}
                            size={40}
                            color="#FFF"
                        />
                    </LinearGradient>
                </Pressable>

                <Animated.View entering={FadeInUp.delay(200)}>
                    <ThemedText type="h4" style={{ marginTop: Spacing["2xl"], textAlign: 'center' }}>
                        {statusText}
                    </ThemedText>
                </Animated.View>

                {/* Disconnect button when connected */}
                {isConnected && (
                    <Pressable
                        onPress={disconnect}
                        style={styles.disconnectButton}
                    >
                        <ThemedText type="tiny" style={{ color: '#FF6B6B' }}>
                            Disconnect
                        </ThemedText>
                    </Pressable>
                )}
            </View>

            {/* Suggestions - only show when not connected */}
            {!isConnected && (
                <View style={[styles.suggestionsArea, { paddingBottom: 100 }]}>
                    <ThemedText type="tiny" style={{ color: theme.textMuted, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Try asking
                    </ThemedText>
                    <View style={styles.suggestionsList}>
                        {suggestions.map((suggestion, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeIn.delay(300 + index * 100)}
                            >
                                <Pressable
                                    style={[styles.suggestionChip, { backgroundColor: theme.backgroundSecondary }]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        if (isConnected && setupComplete.current) {
                                            sendTextMessage(suggestion);
                                        }
                                    }}
                                >
                                    <Feather name="message-circle" size={14} color={theme.textMuted} />
                                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                        {suggestion}
                                    </ThemedText>
                                </Pressable>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    centerArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        borderRadius: 100,
        borderWidth: 2,
        borderColor: Colors.light.primary,
    },
    ring1: {
        width: 140,
        height: 140,
    },
    ring2: {
        width: 140,
        height: 140,
    },
    ring3: {
        width: 140,
        height: 140,
    },
    micButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        ...Shadows.fab,
    },
    micGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disconnectButton: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    suggestionsArea: {
        paddingHorizontal: Spacing.xl,
    },
    suggestionsList: {
        gap: Spacing.sm,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
});
