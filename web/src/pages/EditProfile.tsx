import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/Button'
import { Avatar } from '@/components/Avatar'

export default function EditProfile() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        display_name: '',
        email: user?.email || '',
        phone: '',
        bio: ''
    })

    useEffect(() => {
        if (user) {
            loadUserData()
        }
    }, [user])

    const loadUserData = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user!.id)
                .single()

            if (error) throw error

            if (data) {
                setFormData({
                    display_name: data.display_name || '',
                    email: user!.email || '',
                    phone: data.phone || '',
                    bio: data.bio || ''
                })
            }
        } catch (e: any) {
            console.error('Error loading user data:', e)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    display_name: formData.display_name,
                    phone: formData.phone,
                    bio: formData.bio
                })
                .eq('id', user!.id)

            if (updateError) throw updateError

            setSuccess(true)
            setTimeout(() => navigate('/profile'), 1500)
        } catch (e: any) {
            setError(e.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return <div className="p-8 text-center text-white">Please sign in to edit your profile</div>
    }

    return (
        <div className="py-8 max-w-2xl">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>

            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Edit Profile</h1>
                <p className="text-text-secondary">Update your personal information</p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/30 text-success">
                    Profile updated successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-surface border border-surface-tertiary">
                    <Avatar
                        name={formData.display_name || user.email || 'User'}
                        size="xl"
                    />
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-white text-small font-semibold hover:opacity-90 transition-opacity"
                    >
                        <Camera className="w-4 h-4" />
                        Change Photo
                    </button>
                </div>

                {/* Display Name */}
                <div>
                    <label className="block text-small text-text-secondary mb-2">Display Name</label>
                    <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-white placeholder:text-text-muted focus:border-sunset-orange focus:outline-none transition-colors"
                    />
                </div>

                {/* Email (read-only) */}
                <div>
                    <label className="block text-small text-text-secondary mb-2">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-surface-tertiary text-text-muted cursor-not-allowed"
                    />
                    <p className="text-tiny text-text-muted mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-small text-text-secondary mb-2">Phone Number</label>
                    <div className="flex gap-2">
                        <div className="px-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-text-secondary">
                            +254
                        </div>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="712 345 678"
                            className="flex-1 px-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-white placeholder:text-text-muted focus:border-sunset-orange focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-small text-text-secondary mb-2">Bio</label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-white placeholder:text-text-muted focus:border-sunset-orange focus:outline-none transition-colors resize-none"
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
