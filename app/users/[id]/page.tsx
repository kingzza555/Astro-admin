"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Crown, Coins, ShieldBan, Calendar, Heart, RefreshCw, Plus, Minus, Bell, Send, Ban, ShieldCheck, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.id as string;
    const queryClient = useQueryClient();

    const [showCoinModal, setShowCoinModal] = useState<'add' | 'deduct' | null>(null);
    const [coinAmount, setCoinAmount] = useState('');
    const [coinReason, setCoinReason] = useState('');
    const [showBanModal, setShowBanModal] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [banType, setBanType] = useState('temporary');
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifBody, setNotifBody] = useState('');
    const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['user-detail', userId],
        queryFn: async () => {
            const res = await api.get(`/users/${userId}/detail`);
            return res.data;
        }
    });

    const coinMutation = useMutation({
        mutationFn: async ({ action, amount, reason }: { action: 'add' | 'deduct'; amount: number; reason: string }) => {
            const res = await api.post(`/coins/${action}`, { user_id: userId, amount, reason });
            return res.data;
        },
        onSuccess: (_, vars) => {
            setActionResult({ type: 'success', message: `${vars.action === 'add' ? 'เพิ่ม' : 'หัก'} ${vars.amount} coins สำเร็จ` });
            setShowCoinModal(null); setCoinAmount(''); setCoinReason('');
            queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
        },
        onError: (err: any) => {
            setActionResult({ type: 'error', message: err?.response?.data?.detail || 'เกิดข้อผิดพลาด' });
        }
    });

    const banMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/users/ban', { user_id: userId, reason: banReason, ban_type: banType });
            return res.data;
        },
        onSuccess: () => {
            setActionResult({ type: 'success', message: 'แบน user สำเร็จ' });
            setShowBanModal(false); setBanReason('');
            queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
        },
        onError: (err: any) => {
            setActionResult({ type: 'error', message: err?.response?.data?.detail || 'เกิดข้อผิดพลาด' });
        }
    });

    const unbanMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/users/${userId}/unban`);
            return res.data;
        },
        onSuccess: () => {
            setActionResult({ type: 'success', message: 'ปลดแบน user สำเร็จ' });
            queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
        },
        onError: (err: any) => {
            setActionResult({ type: 'error', message: err?.response?.data?.detail || 'เกิดข้อผิดพลาด' });
        }
    });

    const notifMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/notifications/send-to-user', { user_id: userId, title: notifTitle, body: notifBody });
            return res.data;
        },
        onSuccess: () => {
            setActionResult({ type: 'success', message: 'ส่ง notification สำเร็จ' });
            setShowNotifModal(false); setNotifTitle(''); setNotifBody('');
        },
        onError: (err: any) => {
            setActionResult({ type: 'error', message: err?.response?.data?.detail || 'เกิดข้อผิดพลาด' });
        }
    });

    if (isLoading) return (
        <div className="flex justify-center items-center h-96"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
    );

    if (!data) return (
        <div className="text-center py-20 text-slate-400">User not found</div>
    );

    const { user, recent_readings, recent_transactions, ban_history, relationships, stats } = data;
    const isBanned = (ban_history || []).some((b: any) => b.is_active);

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Action Result Banner */}
            {actionResult && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${actionResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {actionResult.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span className="text-sm font-medium flex-1">{actionResult.message}</span>
                    <button onClick={() => setActionResult(null)} className="p-1 hover:bg-white/50 rounded"><X size={14} /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <Link href="/users" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} /></Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{user.display_name || 'Unknown User'}</h1>
                    <p className="text-slate-500">{user.email || 'No email'}</p>
                    <div className="mt-2 space-y-1 text-xs text-slate-400 font-mono">
                        <p>UUID: {user.id}</p>
                        <p>Firebase UID: {user.firebase_uid || '—'}</p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {user.is_premium && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-700 font-medium">
                            <Crown size={14} /> Premium
                        </span>
                    )}
                    {isBanned && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 font-medium">
                            <ShieldBan size={14} /> Banned
                        </span>
                    )}
                    <button onClick={() => refetch()} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowCoinModal('add')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <Plus size={14} /> Add Coins
                </button>
                <button onClick={() => setShowCoinModal('deduct')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <Minus size={14} /> Deduct Coins
                </button>
                {isBanned ? (
                    <button onClick={() => { if (confirm('ปลดแบน user นี้?')) unbanMutation.mutate(); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                        <ShieldCheck size={14} /> Unban User
                    </button>
                ) : (
                    <button onClick={() => setShowBanModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                        <Ban size={14} /> Ban User
                    </button>
                )}
                <button onClick={() => setShowNotifModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <Bell size={14} /> Send Notification
                </button>
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

            {/* ====== COIN MODAL ====== */}
            {showCoinModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCoinModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                {showCoinModal === 'add' ? <Plus size={18} className="text-emerald-500" /> : <Minus size={18} className="text-amber-500" />}
                                {showCoinModal === 'add' ? 'Add Coins' : 'Deduct Coins'}
                            </h3>
                            <button onClick={() => setShowCoinModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                <input type="number" min="1" placeholder="จำนวน coins" value={coinAmount}
                                    onChange={e => setCoinAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                <input type="text" placeholder="เหตุผล..." value={coinReason}
                                    onChange={e => setCoinReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button disabled={!coinAmount || !coinReason || coinMutation.isPending}
                                onClick={() => coinMutation.mutate({ action: showCoinModal, amount: Number(coinAmount), reason: coinReason })}
                                className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${showCoinModal === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                                {coinMutation.isPending ? 'Processing...' : showCoinModal === 'add' ? 'Add Coins' : 'Deduct Coins'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== BAN MODAL ====== */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBanModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="font-semibold text-red-700 flex items-center gap-2"><Ban size={18} /> Ban User</h3>
                            <button onClick={() => setShowBanModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ban Type</label>
                                <select value={banType} onChange={e => setBanType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                                    <option value="temporary">Temporary</option>
                                    <option value="permanent">Permanent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                                <textarea placeholder="เหตุผลในการแบน..." value={banReason}
                                    onChange={e => setBanReason(e.target.value)} rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                            </div>
                            <button disabled={!banReason || banMutation.isPending}
                                onClick={() => banMutation.mutate()}
                                className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50">
                                {banMutation.isPending ? 'Processing...' : 'Confirm Ban'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== NOTIFICATION MODAL ====== */}
            {showNotifModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNotifModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="font-semibold text-indigo-700 flex items-center gap-2"><Send size={18} /> Send Notification</h3>
                            <button onClick={() => setShowNotifModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input type="text" placeholder="หัวข้อ notification" value={notifTitle}
                                    onChange={e => setNotifTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Body</label>
                                <textarea placeholder="เนื้อหา notification..." value={notifBody}
                                    onChange={e => setNotifBody(e.target.value)} rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button disabled={!notifTitle || !notifBody || notifMutation.isPending}
                                onClick={() => notifMutation.mutate()}
                                className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                {notifMutation.isPending ? 'Sending...' : 'Send Notification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
