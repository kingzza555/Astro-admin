"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ScrollText, RefreshCw, Filter, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AuditLogsPage() {
    const LIMIT = 30;
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        data: pages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['audit-logs'],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/audit-logs?limit=${LIMIT}&offset=${pageParam}`);
            return { data: res.data, offset: pageParam };
        },
        getNextPageParam: (lastPage: any) => {
            if (!lastPage?.data || lastPage.data.length < LIMIT) return undefined;
            return lastPage.offset + LIMIT;
        },
        initialPageParam: 0
    });

    const logs = pages?.pages?.flatMap((p: any) => p.data || []) || [];

    // Infinite scroll observer
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }, { threshold: 0.1 });
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        'update_app_config': 'bg-indigo-100 text-indigo-700',
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
                            <tr><td colSpan={6} className="text-center py-10 text-slate-400">
                                <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
                                Loading audit logs...
                            </td></tr>
                        ) : (logs || []).length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                                <ScrollText className="mx-auto h-10 w-10 mb-3 text-slate-300" />
                                <p className="text-base font-medium text-slate-600">No Audit Logs Yet</p>
                                <p className="text-sm mt-1 max-w-sm mx-auto">เมื่อ admin ทำการ ban user, เพิ่มเหรียญ, export ข้อมูล หรือแก้ไข config ระบบจะบันทึก log ที่นี่</p>
                            </td></tr>
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

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="py-4">
                {isFetchingNextPage ? (
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-2">
                        <Loader2 size={16} className="animate-spin" /> Loading more...
                    </div>
                ) : hasNextPage ? (
                    <p className="text-center text-xs text-slate-400 py-2">Scroll down to load more</p>
                ) : logs.length > 0 ? (
                    <p className="text-center text-xs text-slate-400 py-2">
                        Showing all {logs.length} audit logs
                    </p>
                ) : null}
            </div>
        </div>
    );
}
