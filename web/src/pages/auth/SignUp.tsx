import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/Button'

export default function SignUp() {
    const { signUpWithEmail, signInWithGoogle } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        try {
            setLoading(true)
            setError('')
            await signUpWithEmail(email, password)
            // Redirect to interest selection or home
            navigate('/auth/interests')
        } catch (e: any) {
            setError(e.message || 'Failed to create account. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        try {
            setLoading(true)
            setError('')
            await signInWithGoogle()
        } catch (e) {
            setError('Failed to sign up with Google')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-midnight-teal flex flex-col">
            {/* Header */}
            <div className="p-4">
                <Link to="/auth/signin" className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Sign In</span>
                </Link>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-black text-2xl">V</span>
                        </div>
                        <h1 className="text-h1 text-white mb-2">Join Vybz Circle</h1>
                        <p className="text-text-secondary">Create your account and discover amazing events</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error text-small">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Google Sign Up */}
                        <button
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-white text-midnight-teal font-semibold hover:bg-clay transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-surface-tertiary"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-midnight-teal text-text-muted">or</span>
                            </div>
                        </div>

                        {/* Email Sign Up Form */}
                        <form onSubmit={handleEmailSignUp} className="space-y-4">
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-white placeholder:text-text-muted focus:border-sunset-orange focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-white placeholder:text-text-muted focus:border-sunset-orange focus:outline-none transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-tertiary text-white placeholder:text-text-muted focus:border-sunset-orange focus:outline-none transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={loading || !email || !password || !confirmPassword}
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Button>
                        </form>

                        <p className="text-center text-tiny text-text-muted mt-6">
                            By signing up, you agree to our Terms of Service and Privacy Policy
                        </p>

                        <p className="text-center text-small text-text-secondary mt-4">
                            Already have an account?{' '}
                            <Link to="/auth/signin" className="text-sunset-orange hover:text-electric-berry transition-colors font-semibold">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
