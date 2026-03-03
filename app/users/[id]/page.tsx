"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Crown, Coins, ShieldBan, Calendar, Heart, Eye, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.id as string;

    const { data, isLoading } = useQuery({
        queryKey: ['user-detail', userId],
        queryFn: async () => {
            const res = await api.get(`/users/${userId}/detail`);
            return res.data;
        }
    });

    if (isLoading) return (
        <div className="flex justify-center items-center h-96"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
    );

    if (!data) return (
        <div className="text-center py-20 text-slate-400">User not found</div>
    );

    const { user, recent_readings, recent_transactions, ban_history, relationships, stats } = data;

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <Link href="/users" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} /></Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{user.display_name || 'Unknown User'}</h1>
                    <p className="text-slate-500">{user.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {user.is_premium && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700 font-medium">
                            <Crown size={14} /> Premium
                        </span>
                    )}
                    {user.ban_status && user.ban_status !== 'active' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 font-medium">
                            <ShieldBan size={14} /> {user.ban_status}
                        </span>
                    )}
                </div>
            </div>

            {/* User Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">Coin Balance</p>
                    <p className="text-2xl font-bold text-slate-900 flex items-center gap-1"><Coins size={18} className="text-amber-500" /> {user.coins_balance || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">Readings</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total_readings}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">Transactions</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total_transactions}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">Joined</p>
                    <p className="text-lg font-semibold text-slate-900">{new Date(user.created_at).toLocaleDateString('th-TH')}</p>
                </div>
            </div>

            {/* Birth Data */}
            {user.birth_date && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2"><Calendar size={18} /> Birth Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="text-slate-400">Date:</span> <span className="font-medium">{user.birth_date}</span></div>
                        <div><span className="text-slate-400">Time:</span> <span className="font-medium">{user.birth_time || 'N/A'}</span></div>
                        <div><span className="text-slate-400">Timezone:</span> <span className="font-medium">{user.birth_tz || '+07:00'}</span></div>
                        <div><span className="text-slate-400">Location:</span> <span className="font-medium">{user.birth_latitude ? `${user.birth_latitude}, ${user.birth_longitude}` : 'N/A'}</span></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Readings */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Recent Readings</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(recent_readings || []).length === 0 ? (
                            <p className="text-sm text-slate-400">No readings yet</p>
                        ) : recent_readings.map((r: any) => (
                            <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
                                <div>
                                    <span className="font-medium text-slate-700">{r.topic}</span>
                                    {r.subtype && <span className="text-slate-400 ml-2">({r.subtype})</span>}
                                </div>
                                <div className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString('th-TH')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Recent Transactions</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(recent_transactions || []).length === 0 ? (
                            <p className="text-sm text-slate-400">No transactions yet</p>
                        ) : recent_transactions.map((t: any) => (
                            <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
                                <div>
                                    <span className={`font-medium ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {t.amount > 0 ? '+' : ''}{t.amount}
                                    </span>
                                    <span className="text-slate-400 ml-2">{t.description?.slice(0, 40)}</span>
                                </div>
                                <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString('th-TH')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Relationships */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2"><Heart size={18} /> Relationships</h3>
                    <div className="space-y-2">
                        {(relationships || []).length === 0 ? (
                            <p className="text-sm text-slate-400">No relationships</p>
                        ) : relationships.map((rel: any) => (
                            <div key={rel.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
                                <span className="text-slate-700">{rel.name || 'Unknown'}</span>
                                <span className="text-xs text-slate-400">{rel.relationship_type}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ban History */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2"><ShieldBan size={18} /> Ban History</h3>
                    <div className="space-y-2">
                        {(ban_history || []).length === 0 ? (
                            <p className="text-sm text-slate-400">No ban history</p>
                        ) : ban_history.map((b: any) => (
                            <div key={b.id} className="py-2 border-b border-slate-50 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${b.is_active ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {b.ban_type} {b.is_active ? '(active)' : '(lifted)'}
                                    </span>
                                    <span className="text-xs text-slate-400">by {b.banned_by}</span>
                                </div>
                                <p className="text-slate-600 mt-1">{b.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
