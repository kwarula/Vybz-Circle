import { Link } from 'react-router-dom'
import { Settings, Ticket, Wallet, LogOut, ChevronRight, Trophy, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'

const menuItems = [
    { icon: Ticket, label: 'My Tickets', to: '/tickets', color: 'text-sunset-orange' },
    { icon: Wallet, label: 'Vybz Wallet', to: '/wallet', color: 'text-bright-turquoise' },
    { icon: Trophy, label: 'Rewards & Badges', to: '/rewards', color: 'text-electric-berry' },
    { icon: Shield, label: 'Safety Settings', to: '/safety', color: 'text-success' },
    { icon: Settings, label: 'Settings', to: '/settings', color: 'text-text-secondary' },
]

export default function Profile() {
    const { user, signOut } = useAuth()

    const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
    const userEmail = user?.email || ''

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <div className="max-w-sm w-full text-center">
                    <Avatar size="xl" alt="?" className="mx-auto mb-6" />
                    <h1 className="text-h2 text-white mb-2">Not Signed In</h1>
                    <p className="text-text-secondary mb-8">Sign in to access your profile, tickets, and more</p>
                    <Link to="/auth/signin">
                        <Button className="w-full" size="lg">Sign In</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="pt-20 lg:pt-8 pb-8 px-4 lg:px-8">
                <div className="flex items-center gap-6 mb-8">
                    <Avatar
                        src={user.user_metadata?.avatar_url}
                        alt={userName}
                        size="xl"
                        className="ring-4 ring-sunset-orange/30"
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-h2 text-white truncate">{userName}</h1>
                        <p className="text-text-secondary truncate">{userEmail}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Events', value: '12' },
                        { label: 'Rep Points', value: '450' },
                        { label: 'Level', value: '3' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-surface rounded-xl p-4 text-center sticker">
                            <p className="text-h2 text-sunset-orange font-bold">{stat.value}</p>
                            <p className="text-tiny text-text-muted">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu */}
            <div className="px-4 lg:px-8">
                <div className="bg-surface rounded-2xl overflow-hidden sticker">
                    {menuItems.map((item, index) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                'flex items-center gap-4 p-4 hover:bg-surface-secondary transition-colors',
                                index !== menuItems.length - 1 && 'border-b border-surface-tertiary'
                            )}
                        >
                            <item.icon className={cn('w-5 h-5', item.color)} />
                            <span className="flex-1 text-body text-white">{item.label}</span>
                            <ChevronRight className="w-5 h-5 text-text-muted" />
                        </Link>
                    ))}
                </div>

                {/* Sign Out */}
                <button
                    onClick={signOut}
                    className="w-full mt-6 flex items-center justify-center gap-3 p-4 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Sign Out</span>
                </button>
            </div>
        </div>
    )
}
