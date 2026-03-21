"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function ModerationPage() {
    const [offset, setOffset] = useState(0);
    const LIMIT = 30;

    const { data: logs, isLoading, refetch } = useQuery({
        queryKey: ['chat-logs', offset],
        queryFn: async () => {
            const res = await api.get(`/moderation/chats?limit=${LIMIT}&offset=${offset}`);
            return res.data;
        }
    });

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Content Moderation</h1>
                    <p className="text-slate-500 mt-1">Review follow-up chat messages from users</p>
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
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">User ID</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Topic</th>
                            <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-10 text-slate-400">
                                <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
                                Loading chat logs...
                            </td></tr>
                        ) : (logs || []).length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-16 text-slate-400">
                                <ShieldAlert className="mx-auto h-10 w-10 mb-3 text-slate-300" />
                                <p className="text-base font-medium text-slate-600">No Chat Messages Yet</p>
                                <p className="text-sm mt-1 max-w-sm mx-auto">เมื่อ user ส่งข้อความ follow-up chat ในแอพ ข้อความจะปรากฏที่นี่เพื่อตรวจสอบเนื้อหา</p>
                            </td></tr>
                        ) : (logs || []).map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString('th-TH')}
                                </td>
                                <td className="px-6 py-3 text-xs font-mono text-slate-600">{log.user_id?.slice(0, 12)}...</td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">{log.topic}</span>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-800 max-w-md">{log.question}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center">
                <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Previous</button>
                <span className="text-sm text-slate-500">Showing {offset + 1} - {offset + (logs?.length || 0)}</span>
                <button onClick={() => setOffset(offset + LIMIT)} disabled={(logs?.length || 0) < LIMIT}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
        </div>
    );
}
