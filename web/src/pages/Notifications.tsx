import { useState } from 'react'
import { Bell, Calendar, Users, Tag, Check, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'

interface Notification {
    id: string
    type: 'event' | 'social' | 'promo'
    title: string
    message: string
    time: string
    read: boolean
    avatar?: string
    icon?: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'event',
        title: 'Event Reminder',
        message: 'Blankets & Wine starts in 2 hours',
        time: new Date(Date.now() - 3600000).toISOString(),
        read: false
    },
    {
        id: '2',
        type: 'social',
        title: 'New Friend Request',
        message: 'John Doe sent you a friend request',
        time: new Date(Date.now() - 7200000).toISOString(),
        read: false
    },
    {
        id: '3',
        type: 'promo',
        title: 'Early Bird Tickets',
        message: 'Get 20% off on Nyege Nyege Festival tickets',
        time: new Date(Date.now() - 86400000).toISOString(),
        read: true
    },
    {
        id: '4',
        type: 'event',
        title: 'Ticket Purchased',
        message: 'Your ticket for Nairobi Jazz Festival is confirmed',
        time: new Date(Date.now() - 172800000).toISOString(),
        read: true
    }
]

export default function Notifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'event':
                return <Calendar className="w-5 h-5" />
            case 'social':
                return <Users className="w-5 h-5" />
            case 'promo':
                return <Tag className="w-5 h-5" />
            default:
                return <Bell className="w-5 h-5" />
        }
    }

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'event':
                return 'bg-sunset-orange/10 text-sunset-orange'
            case 'social':
                return 'bg-bright-turquoise/10 text-bright-turquoise'
            case 'promo':
                return 'bg-electric-berry/10 text-electric-berry'
            default:
                return 'bg-surface-tertiary text-text-muted'
        }
    }

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
    }

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
    }

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id))
    }

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' ? true : !n.read
    )

    const unreadCount = notifications.filter(n => !n.read).length

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <Bell className="w-16 h-16 text-text-muted mb-4" />
                <h2 className="text-h2 text-white mb-2">Sign in to view notifications</h2>
                <Link to="/auth/signin" className="text-sunset-orange hover:text-electric-berry transition-colors">
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="py-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Notifications</h1>
                <p className="text-text-secondary">
                    {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-small font-semibold transition-colors ${
                            filter === 'all'
                                ? 'bg-gradient-primary text-white'
                                : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-xl text-small font-semibold transition-colors ${
                            filter === 'unread'
                                ? 'bg-gradient-primary text-white'
                                : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                        }`}
                    >
                        Unread
                    </button>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-small text-bright-turquoise hover:bg-bright-turquoise/10 transition-colors"
                    >
                        <Check className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                    <Bell className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h2 className="text-h2 text-white mb-2">No notifications</h2>
                    <p className="text-text-secondary">
                        {filter === 'unread' ? 'You\'re all caught up!' : 'You don\'t have any notifications yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-xl border transition-all ${
                                notification.read
                                    ? 'bg-surface border-surface-tertiary'
                                    : 'bg-sunset-orange/5 border-sunset-orange/20'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                                    {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="text-white font-semibold">{notification.title}</h3>
                                        {!notification.read && (
                                            <div className="w-2 h-2 rounded-full bg-sunset-orange flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <p className="text-text-secondary text-small mb-2">{notification.message}</p>
                                    <p className="text-tiny text-text-muted">
                                        {new Date(notification.time).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-2 rounded-lg text-bright-turquoise hover:bg-bright-turquoise/10 transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
