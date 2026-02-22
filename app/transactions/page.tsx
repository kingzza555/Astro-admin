"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { History, ArrowUpRight, ArrowDownRight, RefreshCw, Search, Filter, X } from 'lucide-react';
import api from '@/lib/api';

const formatTransactionType = (type: string): string => {
    const typeMap: Record<string, string> = {
        'purchase_deep_dive': 'ซื้อ Deep Dive',
        'purchase_micro_timing': 'ซื้อ Micro Timing',
        'purchase_celestial_bond': 'ซื้อ พันธนาการดวงดารา',
        'celestial_bond': 'พันธนาการดวงดารา',
        'purchase_ai_wallpaper': 'ซื้อ AI Wallpaper',
        'ai_wallpaper': 'AI Wallpaper',
        'ai_wallpaper_manual': 'AI Wallpaper (Manual)',
        'subscription': 'สมาชิกพรีเมียม',
        'topup': 'เติมเหรียญ',
        'admin_topup': 'Admin เติมให้',
        'admin_adjust_add': 'Admin เพิ่ม',
        'admin_adjust_deduct': 'Admin หัก',
        'premium_approved': 'Premium Approved',
        'spend': 'ใช้เหรียญ',
        'reward': 'รางวัล',
    };
    return typeMap[type] || type.replace(/_/g, ' ');
};

const TX_TYPES = [
    { value: '', label: 'ทุกประเภท' },
    { value: 'admin_adjust_add', label: 'Admin เพิ่ม' },
    { value: 'admin_adjust_deduct', label: 'Admin หัก' },
    { value: 'purchase_deep_dive', label: 'ซื้อ Deep Dive' },
    { value: 'purchase_celestial_bond', label: 'ซื้อ Celestial Bond' },
    { value: 'purchase_ai_wallpaper', label: 'ซื้อ AI Wallpaper' },
    { value: 'subscription', label: 'Premium Request' },
    { value: 'topup', label: 'เติมเหรียญ' },
];

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [amountFilter, setAmountFilter] = useState<'all' | 'positive' | 'negative'>('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/transactions?limit=100');
            setTransactions(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Search filter (user_id or description)
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q ||
                tx.user_id?.toLowerCase().includes(q) ||
                tx.description?.toLowerCase().includes(q) ||
                tx.type?.toLowerCase().includes(q);

            // Type filter
            const matchesType = !typeFilter || tx.type === typeFilter;

            // Amount filter
            const matchesAmount =
                amountFilter === 'all' ||
                (amountFilter === 'positive' && tx.amount > 0) ||
                (amountFilter === 'negative' && tx.amount < 0);

            return matchesSearch && matchesType && matchesAmount;
        });
    }, [transactions, searchQuery, typeFilter, amountFilter]);

    const totalIn = filteredTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalOut = filteredTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    const hasFilters = !!searchQuery || !!typeFilter || amountFilter !== 'all';
    const clearFilters = () => {
        setSearchQuery('');
        setTypeFilter('');
        setAmountFilter('all');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Transaction Logs</h1>
                    <p className="text-slate-500">
                        {loading ? 'Loading...' : `แสดง ${filteredTransactions.length} / ${transactions.length} รายการ`}
                    </p>
                </div>
                <button
                    onClick={fetchTransactions}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-600"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{filteredTransactions.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center">
                    <p className="text-xs text-emerald-600 uppercase font-semibold">Coins In</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">+{totalIn.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-100 text-center">
                    <p className="text-xs text-red-500 uppercase font-semibold">Coins Out</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">-{totalOut.toLocaleString()}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="ค้นหา User ID, คำอธิบาย..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                {/* Amount Filter */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
                    {(['all', 'positive', 'negative'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setAmountFilter(f)}
                            className={`px-3 py-2 ${amountFilter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            {f === 'all' ? 'ทั้งหมด' : f === 'positive' ? '+ รับ' : '- จ่าย'}
                        </button>
                    ))}
                </div>

                {/* Clear filters */}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 px-2 py-1 rounded"
                    >
                        <X size={14} />
                        ล้าง
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 pl-6">Date/Time</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredTransactions.map((tx) => {
                            const isExpense = tx.amount < 0 || tx.type?.includes('purchase') || tx.type?.includes('spend');
                            return (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-6 text-slate-500 font-mono text-xs">
                                        {new Date(tx.created_at).toLocaleString('th-TH')}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${tx.type?.includes('celestial_bond') ? 'bg-pink-50 text-pink-700 border-pink-100'
                                                : tx.type?.includes('wallpaper') ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                    : tx.type?.includes('subscription') || tx.type?.includes('premium') ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                        : tx.type?.includes('admin') ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                            : isExpense ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                            {formatTransactionType(tx.type)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-700">{tx.description || '-'}</td>
                                    <td className="p-4 text-slate-500 font-mono text-xs truncate max-w-[100px]" title={tx.user_id}>
                                        {tx.user_id?.substring(0, 12)}...
                                    </td>
                                    <td className="p-4 text-right font-medium">
                                        <div className={`flex items-center justify-end gap-1 ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {isExpense ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {loading && <div className="p-8 text-center text-slate-500">Loading logs...</div>}
                {!loading && filteredTransactions.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        {hasFilters ? 'ไม่พบรายการที่ตรงกับเงื่อนไข — ลองล้าง Filter' : 'ยังไม่มีรายการ'}
                    </div>
                )}
            </div>
        </div>
    );
}
