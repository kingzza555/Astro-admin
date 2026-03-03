"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Users, Crown, Activity, UserX, UserPlus, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function SegmentationPage() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['segments'],
        queryFn: async () => { const res = await api.get('/users/segments'); return res.data; }
    });

    const segments = [
        { label: 'Total Users', key: 'total_users', icon: Users, color: 'bg-indigo-100 text-indigo-600' },
        { label: 'Premium Users', key: 'premium_users', icon: Crown, color: 'bg-amber-100 text-amber-600' },
        { label: 'Free Users', key: 'free_users', icon: Users, color: 'bg-slate-100 text-slate-600' },
        { label: 'Active (7d)', key: 'active_users_7d', icon: Activity, color: 'bg-green-100 text-green-600' },
        { label: 'New (30d)', key: 'new_users_30d', icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
        { label: 'Churned', key: 'churned_users', icon: UserX, color: 'bg-red-100 text-red-600' },
        { label: 'Banned', key: 'banned_users', icon: UserX, color: 'bg-orange-100 text-orange-600' },
    ];

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Segmentation</h1>
                    <p className="text-slate-500 mt-1">Breakdown of user groups by activity and status</p>
                </div>
                <button onClick={() => refetch()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
            ) : data ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {segments.map(seg => {
                            const Icon = seg.icon;
                            const value = data[seg.key] || 0;
                            const percent = data.total_users ? Math.round((value / data.total_users) * 100) : 0;
                            return (
                                <div key={seg.key} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-lg ${seg.color}`}><Icon size={20} /></div>
                                        <span className="text-sm text-slate-500">{seg.label}</span>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
                                    {seg.key !== 'total_users' && (
                                        <p className="text-xs text-slate-400 mt-1">{percent}% of total</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Visual Breakdown Bar */}
                    {data.total_users > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">User Distribution</h3>
                            <div className="flex h-8 rounded-full overflow-hidden">
                                <div className="bg-amber-400" style={{ width: `${(data.premium_users / data.total_users) * 100}%` }}
                                    title={`Premium: ${data.premium_users}`}></div>
                                <div className="bg-green-400" style={{ width: `${(data.active_users_7d / data.total_users) * 100}%` }}
                                    title={`Active: ${data.active_users_7d}`}></div>
                                <div className="bg-slate-300" style={{ width: `${(data.churned_users / data.total_users) * 100}%` }}
                                    title={`Churned: ${data.churned_users}`}></div>
                                <div className="bg-red-400" style={{ width: `${(data.banned_users / data.total_users) * 100}%` }}
                                    title={`Banned: ${data.banned_users}`}></div>
                            </div>
                            <div className="flex gap-4 mt-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Premium</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span>Active</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span>Inactive</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>Banned</span>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
