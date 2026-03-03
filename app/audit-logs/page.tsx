"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, RefreshCw, Filter } from 'lucide-react';
import api from '@/lib/api';

export default function AuditLogsPage() {
    const [offset, setOffset] = useState(0);
    const LIMIT = 30;

    const { data: logs, isLoading, refetch } = useQuery({
        queryKey: ['audit-logs', offset],
        queryFn: async () => {
            const res = await api.get(`/audit-logs?limit=${LIMIT}&offset=${offset}`);
            return res.data;
        }
    });

    const actionColors: Record<string, string> = {
        'banned_user': 'bg-red-100 text-red-700',
        'suspended_user': 'bg-orange-100 text-orange-700',
        'unban_user': 'bg-green-100 text-green-700',
        'add_coins': 'bg-emerald-100 text-emerald-700',
        'bulk_add_coins': 'bg-emerald-100 text-emerald-700',
        'create_promo': 'bg-purple-100 text-purple-700',
        'deactivate_promo': 'bg-slate-100 text-slate-700',
        'cancel_premium': 'bg-amber-100 text-amber-700',
        'export_users': 'bg-blue-100 text-blue-700',
        'export_transactions': 'bg-blue-100 text-blue-700',
        'export_readings': 'bg-blue-100 text-blue-700',
    };

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
                    <p className="text-slate-500 mt-1">Track every admin action for transparency</p>
                </div>
                <button onClick={() => refetch()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Time</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Admin</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Action</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Target</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Details</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
                        ) : (logs || []).length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400">No audit logs yet</td></tr>
                        ) : (logs || []).map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString('th-TH')}
                                </td>
                                <td className="px-6 py-3 text-sm font-medium text-slate-800">{log.admin_username}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">
                                    {log.target_type && <span className="text-xs text-slate-400 mr-1">[{log.target_type}]</span>}
                                    <span className="font-mono text-xs">{log.target_id || '—'}</span>
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                                    {JSON.stringify(log.details || {})}
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-400 font-mono">{log.ip_address || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
                <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    Previous
                </button>
                <span className="text-sm text-slate-500">Showing {offset + 1} - {offset + (logs?.length || 0)}</span>
                <button onClick={() => setOffset(offset + LIMIT)} disabled={(logs?.length || 0) < LIMIT}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    Next
                </button>
            </div>
        </div>
    );
}
