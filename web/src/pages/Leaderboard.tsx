import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/Avatar'

interface LeaderboardUser {
    id: string
    display_name: string
    avatar_url?: string
    rep_points: number
    rep_level: number
    rank?: number
}

export default function Leaderboard() {
    const { user } = useAuth()
    const [users, setUsers] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'global' | 'friends'>('global')

    useEffect(() => {
        loadLeaderboard()
    }, [filter])

    const loadLeaderboard = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('users')
                .select('id, display_name, avatar_url, rep_points, rep_level')
                .order('rep_points', { ascending: false })
                .limit(50)

            if (error) throw error

            const rankedUsers = (data || []).map((user, index) => ({
                ...user,
                rank: index + 1
            }))

            setUsers(rankedUsers)
        } catch (e) {
            console.error('Error loading leaderboard:', e)
        } finally {
            setLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-400" />
            case 2:
                return <Medal className="w-6 h-6 text-gray-300" />
            case 3:
                return <Medal className="w-6 h-6 text-orange-400" />
            default:
                return <span className="text-text-muted font-bold">#{rank}</span>
        }
    }

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border-yellow-500/30'
            case 2:
                return 'bg-gradient-to-r from-gray-600/20 to-gray-400/20 border-gray-500/30'
            case 3:
                return 'bg-gradient-to-r from-orange-600/20 to-orange-400/20 border-orange-500/30'
            default:
                return 'bg-surface border-surface-tertiary'
        }
    }

    const currentUser = users.find(u => u.id === user?.id)

    return (
        <div className="py-8">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Leaderboard</h1>
                <p className="text-text-secondary">See how you rank against other Vybz users</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('global')}
                    className={`flex-1 px-6 py-3 rounded-xl text-small font-semibold transition-colors ${
                        filter === 'global'
                            ? 'bg-gradient-primary text-white'
                            : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                    }`}
                >
                    Global
                </button>
                <button
                    onClick={() => setFilter('friends')}
                    className={`flex-1 px-6 py-3 rounded-xl text-small font-semibold transition-colors ${
                        filter === 'friends'
                            ? 'bg-gradient-primary text-white'
                            : 'bg-surface text-text-secondary hover:bg-surface-secondary'
                    }`}
                >
                    Friends
                </button>
            </div>

            {/* Current User Card */}
            {currentUser && (
                <div className="mb-6 p-6 rounded-xl bg-gradient-primary">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar
                                name={currentUser.display_name || 'You'}
                                src={currentUser.avatar_url}
                                size="lg"
                            />
                            <div>
                                <div className="text-white/80 text-small">Your Rank</div>
                                <div className="text-h2 text-white font-bold">#{currentUser.rank}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white/80 text-small">Rep Points</div>
                            <div className="text-h2 text-white font-bold">{currentUser.rep_points?.toLocaleString() || 0}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leaderboard List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
                    ))}
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-16">
                    <TrendingUp className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h2 className="text-h2 text-white mb-2">No users yet</h2>
                    <p className="text-text-secondary">Be the first to join the leaderboard!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map((leaderboardUser) => (
                        <div
                            key={leaderboardUser.id}
                            className={`p-4 rounded-xl border transition-all ${getRankColor(leaderboardUser.rank!)} ${
                                leaderboardUser.id === user?.id ? 'ring-2 ring-bright-turquoise' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Rank */}
                                    <div className="w-12 flex justify-center">
                                        {getRankIcon(leaderboardUser.rank!)}
                                    </div>

                                    {/* User Info */}
                                    <Avatar
                                        name={leaderboardUser.display_name || 'User'}
                                        src={leaderboardUser.avatar_url}
                                        size="md"
                                    />
                                    <div>
                                        <div className="text-white font-semibold flex items-center gap-2">
                                            {leaderboardUser.display_name || 'Anonymous'}
                                            {leaderboardUser.id === user?.id && (
                                                <span className="px-2 py-0.5 rounded-full bg-bright-turquoise/20 text-bright-turquoise text-tiny font-semibold">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-small text-text-secondary">
                                            Level {leaderboardUser.rep_level || 1}
                                        </div>
                                    </div>
                                </div>

                                {/* Points */}
                                <div className="text-right">
                                    <div className="text-white font-bold">
                                        {leaderboardUser.rep_points?.toLocaleString() || 0}
                                    </div>
                                    <div className="text-tiny text-text-muted">points</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
