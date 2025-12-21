import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface Contact {
    id: string;
    name: string;
    phone: string;
}

export default function SafetySettingsScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // State
    const [sosEnabled, setSosEnabled] = useState(true);
    const [shakeToSos, setShakeToSos] = useState(false);
    const [shareLocation, setShareLocation] = useState(true);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('emergency_contacts')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching contacts:', error);
                Alert.alert('Error', 'Failed to load emergency contacts');
            } else if (data) {
                setContacts(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const toggleSwitch = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
        Haptics.selectionAsync();
        setter(!value);
    };

    const addContact = async () => {
        if (!newName || !newPhone) {
            Alert.alert('Missing Info', 'Please enter a name and phone number.');
            return;
        }

        if (contacts.length >= 5) {
            Alert.alert('Limit Reached', 'You can only add up to 5 emergency contacts.');
            return;
        }

        try {
            setSaving(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('emergency_contacts')
                .insert({
                    user_id: session.user.id,
                    name: newName,
                    phone: newPhone
                })
                .select()
                .single();

            if (error) {
                Alert.alert('Error', 'Failed to add contact');
                console.error(error);
            } else if (data) {
                setContacts([...contacts, data]);
                setNewName('');
                setNewPhone('');
                setIsAdding(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } finally {
            setSaving(false);
        }
    };

    const removeContact = (id: string) => {
        Alert.alert('Remove Contact', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase
                        .from('emergency_contacts')
                        .delete()
                        .eq('id', id);

                    if (error) {
                        Alert.alert('Error', 'Failed to remove contact');
                    } else {
                        setContacts(contacts.filter(c => c.id !== id));
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                }
            }
        ]);
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
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Safety Center</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

                {/* SOS Features */}
                <View style={{ marginBottom: 32 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 12, letterSpacing: 1 }}>SOS CONFIGURATION</Text>

                    <View style={{ backgroundColor: theme.backgroundDefault, borderRadius: 16, overflow: 'hidden' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                            <View style={{ flex: 1, paddingRight: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Enable SOS Button</Text>
                                <Text style={{ fontSize: 14, color: theme.textSecondary }}>Show floating SOS button in Circle Hub</Text>
                            </View>
                            <Switch
                                value={sosEnabled}
                                onValueChange={() => toggleSwitch(setSosEnabled, sosEnabled)}
                                trackColor={{ false: theme.border, true: '#EF4444' }} // Red for SOS
                            />
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
                            <View style={{ flex: 1, paddingRight: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Shake to SOS</Text>
                                <Text style={{ fontSize: 14, color: theme.textSecondary }}>Trigger SOS by shaking device 3 times</Text>
                            </View>
                            <Switch
                                value={shakeToSos}
                                onValueChange={() => toggleSwitch(setShakeToSos, shakeToSos)}
                                trackColor={{ false: theme.border, true: '#EF4444' }}
                            />
                        </View>
                    </View>
                </View>

                {/* Location Sharing */}
                <View style={{ marginBottom: 32 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 12, letterSpacing: 1 }}>LOCATION PRIVACY</Text>
                    <View style={{ backgroundColor: theme.backgroundDefault, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Share Real-time Location</Text>
                            <Text style={{ fontSize: 14, color: theme.textSecondary }}>Allow Crew members to see your live location during events</Text>
                        </View>
                        <Switch
                            value={shareLocation}
                            onValueChange={() => toggleSwitch(setShareLocation, shareLocation)}
                            trackColor={{ false: theme.border, true: '#10B981' }}
                        />
                    </View>
                </View>

                {/* Emergency Contacts */}
                <View style={{ marginBottom: 32 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, letterSpacing: 1 }}>EMERGENCY CONTACTS</Text>
                        <TouchableOpacity onPress={() => setIsAdding(!isAdding)}>
                            <Text style={{ color: theme.primary, fontWeight: '600' }}>{isAdding ? 'Cancel' : 'Add New'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ backgroundColor: theme.backgroundDefault, borderRadius: 16, overflow: 'hidden' }}>

                        {isAdding && (
                            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB' }}>
                                <TextInput
                                    style={{ backgroundColor: theme.backgroundRoot, padding: 12, borderRadius: 8, color: theme.text, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}
                                    placeholder="Contact Name"
                                    placeholderTextColor={theme.textMuted}
                                    value={newName}
                                    onChangeText={setNewName}
                                />
                                <TextInput
                                    style={{ backgroundColor: theme.backgroundRoot, padding: 12, borderRadius: 8, color: theme.text, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}
                                    placeholder="Phone Number"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="phone-pad"
                                    value={newPhone}
                                    onChangeText={setNewPhone}
                                />
                                <TouchableOpacity
                                    style={{ backgroundColor: theme.primary, borderRadius: 8, padding: 12, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                                    onPress={addContact}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={{ color: '#FFF', fontWeight: '700' }}>Save Contact</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {loading ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator color={theme.primary} size="large" />
                            </View>
                        ) : (
                            <>
                                {contacts.map((contact, index) => (
                                    <View key={contact.id} style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 16,
                                        borderBottomWidth: index < contacts.length - 1 ? 1 : 0,
                                        borderBottomColor: theme.border
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                                <Feather name="phone-call" size={18} color="#EF4444" />
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>{contact.name}</Text>
                                                <Text style={{ fontSize: 14, color: theme.textSecondary }}>{contact.phone}</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={() => removeContact(contact.id)}>
                                            <Feather name="trash-2" size={20} color={theme.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {contacts.length === 0 && !isAdding && (
                                    <View style={{ padding: 32, alignItems: 'center' }}>
                                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <Feather name="user-plus" size={28} color="#EF4444" />
                                        </View>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 }}>No Emergency Contacts</Text>
                                        <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: 'center' }}>Add trusted contacts who will be notified{'\n'}when you trigger SOS</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                    <Text style={{ marginTop: 8, fontSize: 12, color: theme.textSecondary, lineHeight: 18 }}>
                        These contacts will be notified via SMS when you trigger SOS or when a ride irregularity is detected.
                    </Text>
                </View>

                {/* Alert Box */}
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12 }}>
                    <Feather name="alert-triangle" size={24} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444', marginBottom: 4 }}>About Safety Features</Text>
                        <Text style={{ fontSize: 13, color: theme.text, opacity: 0.8, lineHeight: 19 }}>
                            Safety alerts are prioritized. Vybz Circle works with local authorities and designated responders in supported zones.
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}
