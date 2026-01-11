import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, Calendar, TrendingUp, DollarSign, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api, type Event } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/Button'

export default function AdminDashboard() {
    const { user } = useAuth()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalUsers: 0,
        totalTickets: 0,
        revenue: 0
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)

            // Load events
            const eventData = await api.events.list()
            setEvents(eventData)

            // Load stats
            const { count: userCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })

            const { count: ticketCount } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })

            setStats({
                totalEvents: eventData.length,
                totalUsers: userCount || 0,
                totalTickets: ticketCount || 0,
                revenue: 125000 // Mock revenue
            })
        } catch (e) {
            console.error('Error loading data:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event)
        setShowEditModal(true)
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return

        try {
            await supabase.from('events').delete().eq('id', id)
            setEvents(events.filter(e => e.id !== id))
        } catch (e) {
            console.error('Error deleting event:', e)
        }
    }

    const handleSaveEvent = async () => {
        if (!editingEvent) return

        try {
            const { error } = await supabase
                .from('events')
                .update({
                    title: editingEvent.title,
                    description: editingEvent.description,
                    venue_name: editingEvent.venue_name,
                    category: editingEvent.category,
                    status: editingEvent.status
                })
                .eq('id', editingEvent.id)

            if (error) throw error

            setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e))
            setShowEditModal(false)
            setEditingEvent(null)
        } catch (e) {
            console.error('Error updating event:', e)
        }
    }

    // Check if user is admin (you can implement your own logic)
    const isAdmin = user?.email?.includes('admin') || user?.user_metadata?.role === 'admin'

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <h2 className="text-h2 text-white mb-2">Sign in to access admin dashboard</h2>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <h2 className="text-h2 text-white mb-2">Access Denied</h2>
                <p className="text-text-secondary">You need admin privileges to access this page</p>
            </div>
        )
    }

    return (
        <div className="py-8">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Admin Dashboard</h1>
                <p className="text-text-secondary">Manage events and view platform statistics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="p-6 rounded-xl bg-gradient-to-br from-sunset-orange/20 to-sunset-orange/5 border border-sunset-orange/30">
                    <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-8 h-8 text-sunset-orange" />
                    </div>
                    <div className="text-h2 text-white font-bold mb-1">{stats.totalEvents}</div>
                    <div className="text-small text-text-secondary">Total Events</div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-bright-turquoise/20 to-bright-turquoise/5 border border-bright-turquoise/30">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-bright-turquoise" />
                    </div>
                    <div className="text-h2 text-white font-bold mb-1">{stats.totalUsers}</div>
                    <div className="text-small text-text-secondary">Total Users</div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-electric-berry/20 to-electric-berry/5 border border-electric-berry/30">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8 text-electric-berry" />
                    </div>
                    <div className="text-h2 text-white font-bold mb-1">{stats.totalTickets}</div>
                    <div className="text-small text-text-secondary">Tickets Sold</div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30">
                    <div className="flex items-center justify-between mb-4">
                        <DollarSign className="w-8 h-8 text-success" />
                    </div>
                    <div className="text-h2 text-white font-bold mb-1">KES {stats.revenue.toLocaleString()}</div>
                    <div className="text-small text-text-secondary">Revenue</div>
                </div>
            </div>

            {/* Events Management */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-h2 text-white">Event Management</h2>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity">
                        <Plus className="w-5 h-5" />
                        Add Event
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map(event => (
                            <div key={event.id} className="p-4 rounded-xl bg-surface border border-surface-tertiary flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-white font-semibold">{event.title}</h3>
                                        <span className={`px-2 py-1 rounded-lg text-tiny font-semibold ${
                                            event.status === 'published' ? 'bg-success/10 text-success' :
                                            event.status === 'draft' ? 'bg-text-muted/10 text-text-muted' :
                                            'bg-sunset-orange/10 text-sunset-orange'
                                        }`}>
                                            {event.status || 'draft'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-small text-text-secondary">
                                        <span>{event.venue_name || 'No venue'}</span>
                                        <span>•</span>
                                        <span>{event.category || 'Uncategorized'}</span>
                                        {event.starts_at && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    {new Date(event.starts_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditEvent(event)}
                                        className="p-2 rounded-lg text-bright-turquoise hover:bg-bright-turquoise/10 transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-h2 text-white">Edit Event</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
                            >
                                <X className="w-6 h-6 text-text-secondary" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Title</label>
                                <input
                                    type="text"
                                    value={editingEvent.title}
                                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-small text-text-secondary mb-2">Description</label>
                                <textarea
                                    value={editingEvent.description || ''}
                                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-small text-text-secondary mb-2">Venue</label>
                                    <input
                                        type="text"
                                        value={editingEvent.venue_name || ''}
                                        onChange={(e) => setEditingEvent({ ...editingEvent, venue_name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-small text-text-secondary mb-2">Category</label>
                                    <select
                                        value={editingEvent.category || ''}
                                        onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                    >
                                        <option value="">Select category</option>
                                        <option value="music">Music</option>
                                        <option value="sports">Sports</option>
                                        <option value="food">Food & Drinks</option>
                                        <option value="wellness">Wellness</option>
                                        <option value="networking">Networking</option>
                                        <option value="social">Social</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-small text-text-secondary mb-2">Status</label>
                                <select
                                    value={editingEvent.status || 'draft'}
                                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleSaveEvent}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
