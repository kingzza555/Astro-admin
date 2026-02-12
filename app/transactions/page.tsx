"use client";
import React, { useEffect, useState } from 'react';
import { History, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

// Format transaction type to readable text
const formatTransactionType = (type: string): string => {
    const typeMap: Record<string, string> = {
        'purchase_deep_dive': 'ซื้อ Deep Dive',
        'purchase_micro_timing': 'ซื้อ Micro Timing',
        'purchase_celestial_bond': 'ซื้อ พันธนาการดวงดารา',
        'celestial_bond': 'พันธนาการดวงดารา',
        'purchase_ai_wallpaper': 'ซื้อ AI Wallpaper',
        'ai_wallpaper': 'AI Wallpaper',
        'subscription': 'สมาชิกพรีเมียม',
        'topup': 'เติมเหรียญ',
        'admin_topup': 'Admin เติมให้',
        'spend': 'ใช้เหรียญ',
        'reward': 'รางวัล',
    };
    return typeMap[type] || type.replace(/_/g, ' ');
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/transactions?limit=50');
            setTransactions(res.data || []);
        } catch (error) {
            console.error(error);
            // Fallback
            setTransactions([
                { id: '1', created_at: new Date().toISOString(), type: 'purchase_deep_dive', amount: -69, description: 'Deep Dive: Career / Weekly', user_id: 'user_123' },
                { id: '2', created_at: new Date(Date.now() - 86400000).toISOString(), type: 'topup', amount: 100, description: 'Admin Topup', user_id: 'user_123' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Transaction Logs</h1>
                    <p className="text-slate-500">Recent 50 transactions</p>
                </div>
                <button
                    onClick={fetchTransactions}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-600"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

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
                        {transactions.map((tx) => {
                            const isExpense = tx.amount < 0 || tx.type.includes('purchase') || tx.type.includes('spend');
                            return (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-6 text-slate-500 font-mono text-xs">
                                        {new Date(tx.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${tx.type.includes('celestial_bond')
                                            ? 'bg-pink-50 text-pink-700 border-pink-100'
                                            : tx.type.includes('wallpaper') || tx.type.includes('ai_wallpaper')
                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : tx.type.includes('subscription')
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : isExpense
                                                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                            {formatTransactionType(tx.type)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-700">
                                        {tx.description || '-'}
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-xs truncate max-w-[100px]" title={tx.user_id}>
                                        {tx.user_id}
                                    </td>
                                    <td className="p-4 text-right font-medium">
                                        <div className={`flex items-center justify-end gap-1 ${isExpense ? 'text-red-600' : 'text-emerald-600'
                                            }`}>
                                            {isExpense ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {loading && (
                    <div className="p-8 text-center text-slate-500">Loading logs...</div>
                )}
            </div>
        </div>
    );
}
