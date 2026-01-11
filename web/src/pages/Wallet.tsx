import { useState } from 'react'
import { Wallet as WalletIcon, Plus, Minus, Send, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'

interface Transaction {
    id: string
    type: 'top-up' | 'withdraw' | 'payment' | 'refund'
    amount: number
    description: string
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
}

export default function Wallet() {
    const { user } = useAuth()
    const [balance] = useState(2500) // Mock balance
    const [showTopUp, setShowTopUp] = useState(false)
    const [showWithdraw, setShowWithdraw] = useState(false)
    const [amount, setAmount] = useState('')
    const [phone, setPhone] = useState('')

    const transactions: Transaction[] = [
        {
            id: '1',
            type: 'payment',
            amount: -1500,
            description: 'Ticket - Blankets & Wine',
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: 'completed'
        },
        {
            id: '2',
            type: 'top-up',
            amount: 5000,
            description: 'M-Pesa Top Up',
            timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
            status: 'completed'
        },
        {
            id: '3',
            type: 'payment',
            amount: -1000,
            description: 'Ticket - Nairobi Jazz Festival',
            timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
            status: 'completed'
        }
    ]

    const handleTopUp = () => {
        // TODO: Implement M-Pesa STK push
        alert(`Top up KES ${amount} via M-Pesa to ${phone}`)
        setShowTopUp(false)
        setAmount('')
        setPhone('')
    }

    const handleWithdraw = () => {
        // TODO: Implement M-Pesa withdrawal
        alert(`Withdraw KES ${amount} to ${phone}`)
        setShowWithdraw(false)
        setAmount('')
        setPhone('')
    }

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <WalletIcon className="w-16 h-16 text-text-muted mb-4" />
                <h2 className="text-h2 text-white mb-2">Sign in to view your wallet</h2>
                <Link to="/auth/signin" className="text-sunset-orange hover:text-electric-berry transition-colors">
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-h1 text-white mb-2">Vybz Wallet</h1>
                <p className="text-text-secondary">Manage your event payments</p>
            </div>

            {/* Balance Card */}
            <div className="p-8 rounded-2xl bg-gradient-primary mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <WalletIcon className="w-5 h-5 text-white/80" />
                    <span className="text-small text-white/80">Available Balance</span>
                </div>
                <div className="text-h1 text-white mb-6">KES {balance.toLocaleString()}</div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setShowTopUp(true)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <Plus className="w-6 h-6 text-white" />
                        <span className="text-tiny text-white">Top Up</span>
                    </button>
                    <button
                        onClick={() => setShowWithdraw(true)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <Minus className="w-6 h-6 text-white" />
                        <span className="text-tiny text-white">Withdraw</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                        <Send className="w-6 h-6 text-white" />
                        <span className="text-tiny text-white">Send</span>
                    </button>
                </div>
            </div>

            {/* Top Up Modal */}
            {showTopUp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-h2 text-white mb-4">Top Up Wallet</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Amount (KES)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="1000"
                                    className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-small text-text-secondary mb-2">M-Pesa Number</label>
                                <div className="flex gap-2">
                                    <div className="px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-text-secondary">
                                        +254
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="712 345 678"
                                        className="flex-1 px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowTopUp(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleTopUp} disabled={!amount || !phone}>
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdraw && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-surface rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-h2 text-white mb-4">Withdraw to M-Pesa</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-small text-text-secondary mb-2">Amount (KES)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="1000"
                                    max={balance}
                                    className="w-full px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                />
                                <p className="text-tiny text-text-muted mt-1">Available: KES {balance.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-small text-text-secondary mb-2">M-Pesa Number</label>
                                <div className="flex gap-2">
                                    <div className="px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-text-secondary">
                                        +254
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="712 345 678"
                                        className="flex-1 px-4 py-3 rounded-xl bg-midnight-teal border border-surface-tertiary text-white focus:border-sunset-orange focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowWithdraw(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleWithdraw} disabled={!amount || !phone || parseInt(amount) > balance}>
                                    Withdraw
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div>
                <h2 className="text-h2 text-white mb-4">Transaction History</h2>
                <div className="space-y-3">
                    {transactions.map(tx => (
                        <div key={tx.id} className="p-4 rounded-xl bg-surface border border-surface-tertiary flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${
                                    tx.type === 'top-up' ? 'bg-success/10' :
                                    tx.type === 'withdraw' ? 'bg-electric-berry/10' :
                                    'bg-sunset-orange/10'
                                }`}>
                                    {tx.type === 'top-up' ? (
                                        <ArrowDownLeft className="w-5 h-5 text-success" />
                                    ) : tx.type === 'withdraw' ? (
                                        <ArrowUpRight className="w-5 h-5 text-electric-berry" />
                                    ) : (
                                        <WalletIcon className="w-5 h-5 text-sunset-orange" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-white font-semibold">{tx.description}</div>
                                    <div className="text-tiny text-text-muted flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(tx.timestamp).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-h3 font-bold ${tx.amount > 0 ? 'text-success' : 'text-white'}`}>
                                {tx.amount > 0 ? '+' : ''}KES {Math.abs(tx.amount).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
