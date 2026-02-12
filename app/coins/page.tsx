"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { Coins, Search, Plus, Minus, User as UserIcon, Crown, ArrowUpRight, History, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface UserResult {
    id: string;
    email: string;
    display_name: string;
    coins_balance: number;
    is_premium: boolean;
    created_at: string;
}

interface Transaction {
    id: string;
    user_id: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
    // joined from user lookup
    user_name?: string;
    user_email?: string;
}

export default function CoinManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

    // Coin form
    const [coinAmount, setCoinAmount] = useState('');
    const [coinReason, setCoinReason] = useState('');
    const [coinAction, setCoinAction] = useState<'add' | 'deduct'>('add');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

    // Transaction history
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [txLoading, setTxLoading] = useState(true);

    // Fetch transaction history on mount
    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setTxLoading(true);
        try {
            const res = await api.get('/transactions?limit=50');
            setTransactions(res.data || []);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setTxLoading(false);
        }
    };

    const searchUsers = useCallback(async (query: string) => {
        setSearching(true);
        try {
            const res = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=20`);
            setUsers(res.data || []);
        } catch (err) {
            console.error('Search failed:', err);
            setUsers([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchUsers(searchQuery);
    };

    const handleCoinAction = async () => {
        if (!selectedUser || !coinAmount || !coinReason) return;

        setProcessing(true);
        setResult(null);
        try {
            const endpoint = coinAction === 'add' ? '/coins/add' : '/coins/deduct';
            const res = await api.post(endpoint, {
                user_id: selectedUser.id,
                amount: parseInt(coinAmount),
                reason: coinReason
            });

            setResult({
                success: true,
                message: `${coinAction === 'add' ? 'เพิ่ม' : 'หัก'} ${coinAmount} coins สำเร็จ! ยอดใหม่: ${res.data.new_balance}`
            });

            // Update user in list
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id
                    ? { ...u, coins_balance: res.data.new_balance }
                    : u
            ));
            setSelectedUser(prev => prev ? { ...prev, coins_balance: res.data.new_balance } : null);

            setCoinAmount('');
            setCoinReason('');

            // Refresh transaction history
            fetchTransactions();
        } catch (err: any) {
            setResult({
                error: err?.response?.data?.detail || err.message || 'เกิดข้อผิดพลาด'
            });
        } finally {
            setProcessing(false);
        }
    };

    const formatTxType = (type: string, amount: number) => {
        if (type.includes('admin_adjust_add')) return { label: 'Admin เพิ่ม', color: 'bg-green-50 text-green-700', icon: '+' };
        if (type.includes('admin_adjust_deduct')) return { label: 'Admin หัก', color: 'bg-red-50 text-red-700', icon: '−' };
        if (type.includes('premium')) return { label: 'Premium', color: 'bg-purple-50 text-purple-700', icon: '★' };
        if (amount < 0) return { label: 'ใช้ Coin', color: 'bg-orange-50 text-orange-700', icon: '−' };
        return { label: 'เติม Coin', color: 'bg-blue-50 text-blue-700', icon: '+' };
    };

    // Filter admin-only transactions
    const adminTransactions = transactions.filter(t =>
        t.type?.includes('admin') || t.description?.toLowerCase().includes('admin')
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-2">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Coins size={24} className="text-amber-500" />
                    Coin Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">จัดการ Coin ให้ผู้ใช้ — ค้นหาผู้ใช้แล้วเพิ่ม/หัก Coin</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Search & User List */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาด้วย email หรือชื่อ..."
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={searching}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {searching ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Search size={14} />
                            )}
                            ค้นหา
                        </button>
                    </form>

                    {/* User List */}
                    <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                        {users.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-400">
                                {searching ? 'กำลังค้นหา...' : 'ค้นหาผู้ใช้เพื่อจัดการ Coin'}
                            </div>
                        ) : (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => { setSelectedUser(user); setResult(null); }}
                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedUser?.id === user.id ? 'bg-amber-50/50 border-l-2 border-l-amber-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <UserIcon size={14} className="text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {user.display_name || 'ไม่มีชื่อ'}
                                                    </p>
                                                    {user.is_premium && (
                                                        <Crown size={12} className="text-amber-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 truncate">{user.email || user.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-semibold text-amber-600 flex-shrink-0">
                                            <Coins size={12} />
                                            {user.coins_balance?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Coin Action */}
                <div className="lg:col-span-2">
                    {selectedUser ? (
                        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5 sticky top-8">
                            {/* Selected User Info */}
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                    <UserIcon size={18} className="text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                        {selectedUser.display_name || 'ไม่มีชื่อ'}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{selectedUser.email || selectedUser.id}</p>
                                </div>
                            </div>

                            {/* Current Balance */}
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-400">ยอด Coin ปัจจุบัน</p>
                                <p className="text-2xl font-bold text-amber-600 flex items-center justify-center gap-1 mt-1">
                                    <Coins size={20} />
                                    {selectedUser.coins_balance?.toLocaleString() || 0}
                                </p>
                            </div>

                            {/* Action Toggle */}
                            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setCoinAction('add')}
                                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-sm font-medium transition-all ${coinAction === 'add'
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Plus size={14} />
                                    เพิ่ม Coin
                                </button>
                                <button
                                    onClick={() => setCoinAction('deduct')}
                                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-sm font-medium transition-all ${coinAction === 'deduct'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Minus size={14} />
                                    หัก Coin
                                </button>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">จำนวน Coin</label>
                                <input
                                    type="number"
                                    value={coinAmount}
                                    onChange={(e) => setCoinAmount(e.target.value)}
                                    placeholder="เช่น 100"
                                    min="1"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">เหตุผล</label>
                                <input
                                    type="text"
                                    value={coinReason}
                                    onChange={(e) => setCoinReason(e.target.value)}
                                    placeholder="เช่น โบนัสท็อปอัพ, คืนเงิน..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleCoinAction}
                                disabled={processing || !coinAmount || !coinReason}
                                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${coinAction === 'add'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                            >
                                {processing ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ArrowUpRight size={14} />
                                )}
                                {coinAction === 'add' ? `เพิ่ม ${coinAmount || '0'} Coins` : `หัก ${coinAmount || '0'} Coins`}
                            </button>

                            {/* Result */}
                            {result && (
                                <div className={`rounded-lg p-3 text-xs ${result.error
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-green-50 text-green-600'
                                    }`}>
                                    {result.error ? `❌ ${result.error}` : `✅ ${result.message}`}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
                            <Coins size={32} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">เลือกผู้ใช้จากรายการเพื่อจัดการ Coin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════ */}
            {/* Transaction History Section */}
            {/* ═══════════════════════════════════════════════════ */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-slate-400" />
                        <h2 className="text-lg font-semibold text-slate-900">ประวัติการปรับ Coin (Admin)</h2>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {adminTransactions.length} รายการ
                        </span>
                    </div>
                    <button
                        onClick={fetchTransactions}
                        className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-50"
                    >
                        <RefreshCw size={14} className={txLoading ? 'animate-spin' : ''} />
                        รีเฟรช
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    {txLoading ? (
                        <div className="p-8 flex justify-center">
                            <RefreshCw size={20} className="animate-spin text-slate-300" />
                        </div>
                    ) : adminTransactions.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                            ยังไม่มีประวัติการปรับ Coin โดย Admin
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80 text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ประเภท</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">จำนวน</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">เหตุผล</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">เวลา</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {adminTransactions.map((tx) => {
                                        const txInfo = formatTxType(tx.type, tx.amount);
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${txInfo.color}`}>
                                                        {txInfo.icon} {txInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        {tx.user_id?.substring(0, 12)}...
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.amount >= 0 ? '+' : ''}{tx.amount?.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 max-w-[200px]">
                                                    <span className="text-slate-600 truncate block" title={tx.description}>
                                                        {tx.description || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs text-slate-400">
                                                        {tx.created_at
                                                            ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: th })
                                                            : '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
