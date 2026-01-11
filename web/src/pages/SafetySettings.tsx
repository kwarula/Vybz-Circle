import { useState, useEffect } from 'react'
import { Plus, Trash2, Phone, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/Button'

interface EmergencyContact {
    id: string
    name: string
    phone: string
}

export default function SafetySettings() {
    const { user } = useAuth()
    const [contacts, setContacts] = useState<EmergencyContact[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [newContact, setNewContact] = useState({ name: '', phone: '' })

    useEffect(() => {
        if (user) {
            loadContacts()
        }
    }, [user])

    const loadContacts = async () => {
        try {
            const { data, error } = await supabase
                .from('emergency_contacts')
                .select('*')
                .eq('user_id', user!.id)

            if (error) throw error
            setContacts(data || [])
        } catch (e) {
            console.error('Error loading contacts:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleAddContact = async () => {
        if (!newContact.name || !newContact.phone) return

        try {
            const { data, error } = await supabase
                .from('emergency_contacts')
                .insert({
                    user_id: user!.id,
                    name: newContact.name,
                    phone: newContact.phone
                })
                .select()
                .single()

            if (error) throw error

            setContacts([...contacts, data])
            setNewContact({ name: '', phone: '' })
            setShowAdd(false)
        } catch (e) {
            console.error('Error adding contact:', e)
        }
    }

    const handleDeleteContact = async (id: string) => {
        try {
            const { error } = await supabase
                .from('emergency_contacts')
                .delete()
                .eq('id', id)

            if (error) throw error

            setContacts(contacts.filter(c => c.id !== id))
        } catch (e) {
            console.error('Error deleting contact:', e)
        }
    }

    if (!user) {
        return <div className="p-8 text-center text-white">Please sign in to access safety settings</div>
    }

    return (
        <div className="py-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Safety Settings</h1>
                <p className="text-text-secondary">Manage your emergency contacts and safety preferences</p>
            </div>

            {/* Emergency Contacts */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-h3 text-white">Emergency Contacts</h2>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-white text-small font-semibold hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Add Contact
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-text-secondary">Loading...</div>
                ) : contacts.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-surface border border-surface-tertiary">
                        <p className="text-text-secondary">No emergency contacts added yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contacts.map(contact => (
                            <div key={contact.id} className="p-4 rounded-xl bg-surface border border-surface-tertiary flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-bright-turquoise/10">
                                        <UserIcon className="w-5 h-5 text-bright-turquoise" />
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold">{contact.name}</div>
                                        <div className="text-small text-text-secondary flex items-center gap-2">
                                            <Phone className="w-3 h-3" />
                                            {contact.phone}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteContact(contact.id)}
                                    className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Contact Modal */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-h2 text-white mb-4">Add Emergency Contact</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Phone Number</label>
                                <div className="flex gap-2">
                                    <div className="px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-text-secondary">
                                        +254
                                    </div>
                                    <input
                                        type="tel"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        placeholder="712 345 678"
                                        className="flex-1 px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleAddContact} disabled={!newContact.name || !newContact.phone}>
                                    Add Contact
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Safety Features */}
            <div>
                <h2 className="text-h3 text-white mb-4">Safety Features</h2>
                <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-surface border border-surface-tertiary flex items-center justify-between">
                        <div>
                            <div className="text-white font-semibold">Share Live Location</div>
                            <div className="text-small text-text-secondary">Allow friends to see your location during events</div>
                        </div>
                        <button className="w-12 h-6 rounded-full bg-surface-tertiary relative">
                            <div className="w-5 h-5 rounded-full bg-text-muted absolute left-0.5 top-0.5" />
                        </button>
                    </div>

                    <div className="p-4 rounded-xl bg-surface border border-surface-tertiary flex items-center justify-between">
                        <div>
                            <div className="text-white font-semibold">SOS Alerts</div>
                            <div className="text-small text-text-secondary">Send emergency alerts to your contacts</div>
                        </div>
                        <button className="w-12 h-6 rounded-full bg-gradient-primary relative">
                            <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
