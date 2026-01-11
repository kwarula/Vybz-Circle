import { Link } from 'react-router-dom'
import { ChevronRight, User, Shield, Bell, Palette, HelpCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/')
    }

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <h2 className="text-h2 text-white mb-2">Sign in to access settings</h2>
                <Link to="/auth/signin" className="text-sunset-orange hover:text-electric-berry transition-colors">
                    Sign In
                </Link>
            </div>
        )
    }

    const settingsGroups = [
        {
            title: 'Account',
            items: [
                { label: 'Edit Profile', icon: User, to: '/settings/edit-profile' },
                { label: 'Notification Preferences', icon: Bell, to: '/settings/notifications' }
            ]
        },
        {
            title: 'Privacy & Security',
            items: [
                { label: 'Safety Settings', icon: Shield, to: '/settings/safety' }
            ]
        },
        {
            title: 'Preferences',
            items: [
                { label: 'Theme', icon: Palette, to: '/settings/theme' }
            ]
        },
        {
            title: 'Support',
            items: [
                { label: 'Help Center', icon: HelpCircle, to: '/settings/help' }
            ]
        }
    ]

    return (
        <div className="py-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Settings</h1>
                <p className="text-text-secondary">Manage your account and preferences</p>
            </div>

            <div className="space-y-6">
                {settingsGroups.map(group => (
                    <div key={group.title}>
                        <h2 className="text-small text-text-muted font-semibold uppercase tracking-wider mb-3 px-4">
                            {group.title}
                        </h2>
                        <div className="bg-surface rounded-xl border border-surface-tertiary overflow-hidden">
                            {group.items.map((item, index) => (
                                <Link
                                    key={item.label}
                                    to={item.to}
                                    className={`
                                        flex items-center justify-between p-4 hover:bg-surface-secondary transition-colors
                                        ${index !== group.items.length - 1 ? 'border-b border-surface-tertiary' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5 text-text-secondary" />
                                        <span className="text-white">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-text-muted" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Sign Out</span>
                </button>
            </div>
        </div>
    )
}
