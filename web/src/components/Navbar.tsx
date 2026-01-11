import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, MessageCircle, User, Search, Globe, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Explore' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
]

export function Navbar() {
    const location = useLocation()
    const { user } = useAuth()

    return (
        <>
            {/* Desktop Top Navbar - Airbnb style */}
            <header className="hidden lg:block fixed top-0 left-0 right-0 h-16 bg-surface border-b border-white/[0.06] z-50">
                <div className="max-w-[1600px] mx-auto h-full px-6 flex items-center justify-between">
                    {/* Left - Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-electric-berry flex items-center justify-center transition-transform group-hover:scale-105">
                            <span className="text-white font-bold text-sm">V</span>
                        </div>
                        <span className="text-base font-semibold text-sunset-orange">vybz</span>
                    </Link>

                    {/* Center - Search Bar (Airbnb style pill) */}
                    <div className="flex-1 max-w-md mx-8">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all shadow-sm">
                            <Search className="w-4 h-4 text-text-secondary" />
                            <span className="text-sm text-text-secondary">Search events, venues, artists...</span>
                        </button>
                    </div>

                    {/* Right - Nav + User */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Nav Links */}
                        {navItems.map(({ to, label }) => {
                            const isActive = location.pathname === to
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    className={cn(
                                        'px-3 py-2 rounded-full text-sm font-medium transition-colors',
                                        isActive
                                            ? 'text-white'
                                            : 'text-text-secondary hover:bg-white/[0.04] hover:text-white'
                                    )}
                                >
                                    {label}
                                </Link>
                            )
                        })}

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/10 mx-2" />

                        {/* Globe icon */}
                        <button className="p-2 rounded-full hover:bg-white/[0.04] transition-colors">
                            <Globe className="w-4 h-4 text-text-secondary" />
                        </button>

                        {/* User Menu */}
                        {user ? (
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-white/10 hover:border-white/20 hover:shadow-md transition-all"
                            >
                                <Menu className="w-4 h-4 text-text-secondary" />
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-surface-tertiary">
                                    {user.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium bg-gradient-to-br from-sunset-orange to-electric-berry">
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <Link
                                to="/auth/signin"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-midnight-teal text-sm font-medium hover:bg-white/90 transition-colors"
                            >
                                Sign up
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Top Header - Compact */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface/95 backdrop-blur-lg border-b border-white/[0.06] z-[60]">
                <div className="flex items-center justify-between h-full px-4">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-electric-berry flex items-center justify-center">
                            <span className="text-white font-bold text-sm">V</span>
                        </div>
                    </Link>

                    {/* Mobile Search */}
                    <button className="flex-1 mx-3 flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/[0.02]">
                        <Search className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-muted">Search...</span>
                    </button>

                    {/* User avatar or sign in */}
                    {user ? (
                        <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden bg-surface-tertiary">
                            {user.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium bg-gradient-to-br from-sunset-orange to-electric-berry">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                            )}
                        </Link>
                    ) : (
                        <Link to="/auth/signin" className="text-sm font-medium text-white">
                            Sign in
                        </Link>
                    )}
                </div>
            </header>

            {/* Mobile Bottom Tab Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-white/[0.06] z-[60] pb-safe">
                <div className="grid grid-cols-4 h-14">
                    {[...navItems, { to: '/profile', icon: User, label: 'Profile' }].map(({ to, icon: Icon, label }) => {
                        const isActive = location.pathname === to
                        return (
                            <Link
                                key={to}
                                to={to}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-0.5',
                                    isActive ? 'text-sunset-orange' : 'text-text-muted'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
