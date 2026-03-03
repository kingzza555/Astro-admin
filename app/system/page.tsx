"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeartPulse, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function SystemHealthPage() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => { const res = await api.get('/system/health'); return res.data; },
        refetchInterval: 30000 // Auto-refresh every 30s
    });

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'ok' || status === 'operational') return <CheckCircle size={18} className="text-green-500" />;
        if (status === 'error') return <XCircle size={18} className="text-red-500" />;
        return <Clock size={18} className="text-amber-500" />;
    };

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">System Health</h1>
                    <p className="text-slate-500 mt-1">Real-time server and database monitoring (auto-refresh 30s)</p>
                </div>
                <button onClick={() => refetch()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
            ) : data ? (
                <div className="space-y-6">
                    {/* Overall Status */}
                    <div className={`bg-white rounded-xl border-2 p-6 ${data.status === 'operational' ? 'border-green-200' : 'border-red-200'}`}>
                        <div className="flex items-center gap-3">
                            <StatusIcon status={data.status} />
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 capitalize">{data.status}</h2>
                                <p className="text-sm text-slate-500">API Latency: {data.api_latency_ms}ms</p>
                            </div>
                        </div>
                    </div>

                    {/* Service Checks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(data.checks || {}).map(([service, info]: any) => (
                            <div key={service} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-700 capitalize">{service}</h3>
                                    <StatusIcon status={info.status} />
                                </div>
                                <div className="space-y-1">
                                    {info.user_count !== undefined && (
                                        <p className="text-xs text-slate-500">Total Users: <span className="font-semibold text-slate-800">{info.user_count?.toLocaleString()}</span></p>
                                    )}
                                    {info.count !== undefined && (
                                        <p className="text-xs text-slate-500">Records: <span className="font-semibold text-slate-800">{info.count?.toLocaleString()}</span></p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Server Info */}
                    {data.server && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Server Info</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">Python:</span> <span className="font-medium text-slate-800">{data.server.python_version}</span></div>
                                <div><span className="text-slate-500">Platform:</span> <span className="font-medium text-slate-800">{data.server.platform}</span></div>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
