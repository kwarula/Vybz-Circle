import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

export default function CreateCrewScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Info', 'Please enter a crew name.');
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLoading(true);

        try {
            const { error } = await supabase.rpc('create_crew', {
                name_input: name,
                description_input: description,
                image_url_input: null, // TODO: Implement image upload to Storage
                emoji_input: null,
                color_input: '#8B5CF6',
                is_public_input: !isPrivate
            });

            if (error) throw error;

            Alert.alert('Success', 'Crew created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create crew');
        } finally {
            setLoading(false);
        }
    };

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
                    <Feather name="x" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Create Crew</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>

                {/* Image Picker */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <TouchableOpacity onPress={pickImage} style={{ position: 'relative' }}>
                        <View style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: theme.backgroundDefault,
                            borderWidth: 1,
                            borderColor: theme.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            {image ? (
                                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Feather name="camera" size={32} color={theme.textMuted} />
                            )}
                        </View>
                        <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: theme.primary,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: theme.backgroundRoot
                        }}>
                            <Feather name="plus" size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ marginTop: 12, color: theme.textSecondary, fontSize: 14 }}>Add Crew Icon</Text>
                </View>

                {/* Inputs */}
                <View style={{ gap: 20 }}>
                    <View>
                        <Text style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '600' }}>CREW NAME</Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.backgroundDefault,
                                padding: 16,
                                borderRadius: 12,
                                color: theme.text,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border
                            }}
                            placeholder="e.g. Westlands Ravers"
                            placeholderTextColor={theme.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View>
                        <Text style={{ color: theme.textSecondary, marginBottom: 8, fontWeight: '600' }}>DESCRIPTION</Text>
                        <TextInput
                            style={{
                                backgroundColor: theme.backgroundDefault,
                                padding: 16,
                                borderRadius: 12,
                                color: theme.text,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: theme.border,
                                minHeight: 100,
                                textAlignVertical: 'top'
                            }}
                            placeholder="What's this crew about?"
                            placeholderTextColor={theme.textMuted}
                            multiline
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Privacy Toggle */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: theme.backgroundDefault,
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.border
                    }}>
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Private Crew</Text>
                            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>Only invited members can join</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.selectionAsync();
                                setIsPrivate(!isPrivate);
                            }}
                            style={{
                                width: 50,
                                height: 30,
                                backgroundColor: isPrivate ? theme.primary : theme.border,
                                borderRadius: 15,
                                padding: 2,
                                alignItems: isPrivate ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2.5 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={loading}
                    style={{
                        backgroundColor: theme.primary,
                        height: 56,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 40,
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Create Crew</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}
