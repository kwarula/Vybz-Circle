import { Award, Lock, CheckCircle, Calendar, Users, Globe, DollarSign, Sunrise, Moon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'

interface Achievement {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    unlocked: boolean
    progress?: number
    total?: number
    unlockedDate?: string
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: '1',
        title: 'Party Animal',
        description: 'Attend your first 10 events',
        icon: <Award className="w-8 h-8" />,
        unlocked: true,
        progress: 10,
        total: 10,
        unlockedDate: '2025-01-05'
    },
    {
        id: '2',
        title: 'Social Butterfly',
        description: 'Connect with 50 other users',
        icon: <Users className="w-8 h-8" />,
        unlocked: true,
        progress: 50,
        total: 50,
        unlockedDate: '2025-01-08'
    },
    {
        id: '3',
        title: 'Globetrotter',
        description: 'Attend events in 5 different cities',
        icon: <Globe className="w-8 h-8" />,
        unlocked: false,
        progress: 2,
        total: 5
    },
    {
        id: '4',
        title: 'Big Spender',
        description: 'Spend over KES 50,000 on tickets',
        icon: <DollarSign className="w-8 h-8" />,
        unlocked: false,
        progress: 15000,
        total: 50000
    },
    {
        id: '5',
        title: 'Early Bird',
        description: 'Purchase 10 early bird tickets',
        icon: <Sunrise className="w-8 h-8" />,
        unlocked: true,
        progress: 10,
        total: 10,
        unlockedDate: '2024-12-20'
    },
    {
        id: '6',
        title: 'Night Owl',
        description: 'Attend 20 nightlife events',
        icon: <Moon className="w-8 h-8" />,
        unlocked: false,
        progress: 12,
        total: 20
    },
    {
        id: '7',
        title: 'First Timer',
        description: 'Attend your first event',
        icon: <Calendar className="w-8 h-8" />,
        unlocked: true,
        progress: 1,
        total: 1,
        unlockedDate: '2024-11-15'
    }
]

export default function Achievements() {
    const { user } = useAuth()

    const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length
    const totalAchievements = ACHIEVEMENTS.length

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <Award className="w-16 h-16 text-text-muted mb-4" />
                <h2 className="text-h2 text-white mb-2">Sign in to view achievements</h2>
                <Link to="/auth/signin" className="text-sunset-orange hover:text-electric-berry transition-colors">
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="py-8">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Achievements & Rewards</h1>
                <p className="text-text-secondary">
                    {unlockedCount} of {totalAchievements} achievements unlocked
                </p>
            </div>

            {/* Progress Overview */}
            <div className="mb-8 p-6 rounded-2xl bg-gradient-primary">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-white/80 text-small mb-1">Overall Progress</div>
                        <div className="text-h2 text-white font-bold">
                            {Math.round((unlockedCount / totalAchievements) * 100)}%
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/10">
                        <Award className="w-12 h-12 text-white" />
                    </div>
                </div>
                <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
                    />
                </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ACHIEVEMENTS.map(achievement => (
                    <div
                        key={achievement.id}
                        className={`p-6 rounded-xl border transition-all ${
                            achievement.unlocked
                                ? 'bg-gradient-to-br from-sunset-orange/10 to-electric-berry/10 border-sunset-orange/30'
                                : 'bg-surface border-surface-tertiary'
                        }`}
                    >
                        {/* Icon */}
                        <div className="relative mb-4">
                            <div
                                className={`p-4 rounded-2xl inline-flex ${
                                    achievement.unlocked
                                        ? 'bg-gradient-primary text-white'
                                        : 'bg-surface-tertiary text-text-muted'
                                }`}
                            >
                                {achievement.unlocked ? (
                                    achievement.icon
                                ) : (
                                    <Lock className="w-8 h-8" />
                                )}
                            </div>
                            {achievement.unlocked && (
                                <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-success">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <h3 className={`text-h4 mb-2 ${achievement.unlocked ? 'text-white' : 'text-text-secondary'}`}>
                            {achievement.title}
                        </h3>
                        <p className="text-small text-text-secondary mb-4">{achievement.description}</p>

                        {/* Progress */}
                        {achievement.progress !== undefined && achievement.total !== undefined && (
                            <div>
                                <div className="flex items-center justify-between text-tiny mb-2">
                                    <span className={achievement.unlocked ? 'text-white' : 'text-text-muted'}>
                                        {achievement.progress} / {achievement.total}
                                    </span>
                                    <span className={achievement.unlocked ? 'text-white' : 'text-text-muted'}>
                                        {Math.round((achievement.progress / achievement.total) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            achievement.unlocked ? 'bg-gradient-primary' : 'bg-text-muted'
                                        }`}
                                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Unlocked Date */}
                        {achievement.unlockedDate && (
                            <div className="mt-4 pt-4 border-t border-surface-tertiary">
                                <div className="text-tiny text-text-muted">
                                    Unlocked on{' '}
                                    {new Date(achievement.unlockedDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
