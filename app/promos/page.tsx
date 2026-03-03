"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Plus, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import api from '@/lib/api';

export default function PromosPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [copied, setCopied] = useState('');
    const [form, setForm] = useState({ code: '', type: 'coins', value: 50, max_uses: 100, expires_at: '' });

    const { data: promos, isLoading } = useQuery({
        queryKey: ['promos'],
        queryFn: async () => { const res = await api.get('/promos'); return res.data; }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/promos', form);
            return res.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promos'] }); setShowCreate(false); setForm({ code: '', type: 'coins', value: 50, max_uses: 100, expires_at: '' }); }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => { await api.delete(`/promos/${id}`); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promos'] }); }
    });

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(''), 2000);
    };

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Promo Codes</h1>
                    <p className="text-slate-500 mt-1">Create and manage promotional codes</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
                    <Plus size={16} /> Create Code
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="font-semibold text-slate-800">New Promo Code</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase font-mono" />
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                            <option value="coins">Coins</option>
                            <option value="premium_trial">Premium Trial (days)</option>
                        </select>
                        <input type="number" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) })}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                        <input type="number" placeholder="Max Uses" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) })}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                        <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <button onClick={() => createMutation.mutate()} disabled={!form.code || createMutation.isPending}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                        {createMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                </div>
            )}

            {/* Promo List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Code</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Type</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Value</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Usage</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Status</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Expires</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
                        ) : (promos || []).length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-400">No promo codes yet</td></tr>
                        ) : (promos || []).map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-indigo-600">{p.code}</span>
                                        <button onClick={() => copyCode(p.code)} className="text-slate-300 hover:text-slate-500">
                                            {copied === p.code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600 capitalize">{p.type.replace('_', ' ')}</td>
                                <td className="px-6 py-3 text-sm font-medium text-slate-800">
                                    {p.value} {p.type === 'coins' ? 'coins' : 'days'}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">{p.current_uses}/{p.max_uses}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {p.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-500">
                                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-3">
                                    {p.is_active && (
                                        <button onClick={() => { if (confirm('Deactivate this promo?')) deleteMutation.mutate(p.id); }}
                                            className="text-red-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
