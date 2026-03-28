"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ArrowLeft, Zap, FileText, DollarSign, Activity, Clock, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

interface PoolKeyStatus {
    key_index: number;
    cooldown_seconds_remaining: number;
    active: boolean;
    in_flight_requests: number;
    last_used_at_unix?: number | null;
}

interface QueueClassStatus {
    queue_class: string;
    label: string;
    queued: number;
    running: number;
}

interface AIPoolStatus {
    pool_name: string;
    configured_keys: number;
    active_key_index?: number | null;
    last_selected_key_index?: number | null;
    has_client: boolean;
    in_flight_requests_total: number;
    cooldown_keys: number;
    keys: PoolKeyStatus[];
    queue_classes: QueueClassStatus[];
    queue_totals: {
        queued: number;
        running: number;
    };
    pressure_level: 'healthy' | 'warm' | 'tight';
    pressure_reason: string;
}

interface AIPoolStatusResponse {
    pools: Record<string, AIPoolStatus>;
    queues: Record<string, QueueClassStatus>;
}

const PRESSURE_STYLES = {
    healthy: {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        accent: 'border-emerald-200',
        ring: 'ring-emerald-100',
        dot: 'bg-emerald-500',
    },
    warm: {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        accent: 'border-amber-200',
        ring: 'ring-amber-100',
        dot: 'bg-amber-500',
    },
    tight: {
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        accent: 'border-rose-200',
        ring: 'ring-rose-100',
        dot: 'bg-rose-500',
    },
} as const;

function formatPoolTitle(poolName: string) {
    return poolName === 'text_pool' ? 'Text Pool' : 'Media Pool';
}

function formatLastUsed(lastUsedAtUnix?: number | null) {
    if (!lastUsedAtUnix) return 'ยังไม่มีข้อมูล';
    return formatDistanceToNow(new Date(lastUsedAtUnix * 1000), { addSuffix: true });
}

export default function UsagePage() {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d');
    const [aiPools, setAiPools] = useState<AIPoolStatusResponse | null>(null);
    const [poolLoading, setPoolLoading] = useState(true);
    const [poolError, setPoolError] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const LIMIT = 20;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const offset = (page - 1) * LIMIT;

            const [statsRes, logsRes] = await Promise.all([
                api.get(`/stats/usage?time_range=${timeRange}`),
                api.get(`/stats/usage/logs?limit=${LIMIT}&offset=${offset}`)
            ]);

            setStats(statsRes.data);

            // Handle new logs response format
            if (logsRes.data?.data) {
                setLogs(logsRes.data.data);
                setTotalLogs(logsRes.data.pagination.total);
            } else {
                setLogs(logsRes.data || []); // Fallback
            }
        } catch (error) {
            console.error("Failed to fetch usage data", error);
        } finally {
            setLoading(false);
        }
    }, [LIMIT, page, timeRange]);

    const fetchAIPools = useCallback(async (silent = false) => {
        try {
            if (!silent) setPoolLoading(true);
            const res = await api.get('/ai-pools/status');
            setAiPools(res.data);
            setPoolError(null);
        } catch (error: any) {
            console.error("Failed to fetch AI pool status", error);
            setPoolError(error?.response?.data?.detail || error?.message || 'Failed to fetch AI pool status');
        } finally {
            if (!silent) setPoolLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchAIPools();
        const interval = setInterval(() => {
            fetchAIPools(true);
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchAIPools]);

    const totalPages = Math.ceil(totalLogs / LIMIT);

    const handleRefresh = () => {
        fetchData();
        fetchAIPools();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-2">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">ai-model-use</h1>
                        <p className="text-sm text-slate-500 mt-1">Detailed breakdown of AI model consumption and costs.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="text-sm border border-slate-200 bg-white rounded-md px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                        <option value="today">Today</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={handleRefresh}
                        className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors px-3 py-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200"
                    >
                        <RefreshCw size={14} className={loading || poolLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading && !stats ? (
                <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
            ) : (
                <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <DollarSign size={20} />
                                </div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cost (Est.)</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-bold text-slate-900">฿{stats?.total_estimated_cost_thb?.toFixed(2)}</h2>
                                <span className="text-sm text-slate-400">THB</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">${stats?.total_estimated_cost_usd?.toFixed(4)} USD</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Zap size={20} />
                                </div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Requests</span>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">{stats?.total_calls?.toLocaleString()}</h2>
                            <p className="text-xs text-slate-400 mt-2">Successful API calls</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <Activity size={20} />
                                </div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Models</span>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">{Object.keys(stats?.models || {}).length}</h2>
                            <p className="text-xs text-slate-400 mt-2">Distinct known models</p>
                        </div>
                    </div>

                    {/* Feature Model Mapping Card */}
                    {stats?.feature_map && (
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                                <Sparkles size={18} className="text-slate-400" />
                                Feature Logic Mapping
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {stats.feature_map.map((item: any, i: number) => (
                                    <div key={i} className="bg-white p-4 rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                                        <p className="text-xs text-slate-400 uppercase font-semibold mb-2">{item.feature}</p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {item.models.map((m: string) => (
                                                <span key={m} className={`px-2 py-0.5 rounded text-[10px] font-medium border
                                                    ${m.includes('pro') ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                                        m.includes('lite') ? 'bg-green-50 border-green-100 text-green-700' :
                                                            'bg-blue-50 border-blue-100 text-blue-700'}`}>
                                                    {m.replace('models/', '').replace('gemini-', '')}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 italic">"{item.logic}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Pool Live Status */}
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                                    <Zap size={18} className="text-slate-400" />
                                    AI Pool Live Status
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    ดูว่า pool ไหนเริ่มตึง, key ไหนกำลังทำงาน, และ backlog มาจาก queue หรือ cooldown
                                </p>
                            </div>
                            <div className="text-xs text-slate-400">
                                Auto-refresh every 10 seconds
                            </div>
                        </div>

                        {poolError && (
                            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {poolError}
                            </div>
                        )}

                        {poolLoading && !aiPools ? (
                            <div className="flex justify-center rounded-xl border border-slate-100 bg-white py-12">
                                <RefreshCw className="animate-spin text-slate-300" size={28} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {Object.values(aiPools?.pools || {}).map((pool) => {
                                    const pressureStyle = PRESSURE_STYLES[pool.pressure_level] || PRESSURE_STYLES.healthy;
                                    const workingKeys = pool.keys.filter((key) => key.in_flight_requests > 0);

                                    return (
                                        <div
                                            key={pool.pool_name}
                                            className={`bg-white p-6 rounded-xl border shadow-sm ring-1 ${pressureStyle.accent} ${pressureStyle.ring}`}
                                        >
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${pressureStyle.dot}`} />
                                                        <h4 className="text-base font-semibold text-slate-900">
                                                            {formatPoolTitle(pool.pool_name)}
                                                        </h4>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-2">
                                                        {pool.pressure_reason}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${pressureStyle.badge}`}>
                                                    {pool.pressure_level}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                                <div className="rounded-lg bg-slate-50 px-4 py-3">
                                                    <div className="text-xs text-slate-400 uppercase">Keys</div>
                                                    <div className="text-2xl font-semibold text-slate-900 mt-1">{pool.configured_keys}</div>
                                                </div>
                                                <div className="rounded-lg bg-slate-50 px-4 py-3">
                                                    <div className="text-xs text-slate-400 uppercase">In Flight</div>
                                                    <div className="text-2xl font-semibold text-slate-900 mt-1">{pool.in_flight_requests_total}</div>
                                                </div>
                                                <div className="rounded-lg bg-slate-50 px-4 py-3">
                                                    <div className="text-xs text-slate-400 uppercase">Queued</div>
                                                    <div className="text-2xl font-semibold text-slate-900 mt-1">{pool.queue_totals.queued}</div>
                                                </div>
                                                <div className="rounded-lg bg-slate-50 px-4 py-3">
                                                    <div className="text-xs text-slate-400 uppercase">Cooling Down</div>
                                                    <div className="text-2xl font-semibold text-slate-900 mt-1">{pool.cooldown_keys}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-5">
                                                {pool.queue_classes.map((queue) => (
                                                    <span
                                                        key={`${pool.pool_name}-${queue.queue_class}`}
                                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                                                    >
                                                        <span className="font-medium">{queue.label}</span>
                                                        <span>Q{queue.queued}</span>
                                                        <span>R{queue.running}</span>
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="overflow-hidden rounded-xl border border-slate-100">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-slate-500">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-medium">Key</th>
                                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                                            <th className="px-4 py-3 text-right font-medium">Cooldown</th>
                                                            <th className="px-4 py-3 text-right font-medium">Last Used</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {pool.keys.map((key) => {
                                                            const isWorking = key.in_flight_requests > 0;
                                                            const isCoolingDown = key.cooldown_seconds_remaining > 0;
                                                            const isLastSelected = !isWorking && pool.last_selected_key_index === key.key_index;
                                                            const rowClassName = isWorking
                                                                ? 'bg-emerald-50/60'
                                                                : isCoolingDown
                                                                    ? 'bg-rose-50/50'
                                                                    : isLastSelected
                                                                        ? 'bg-indigo-50/50'
                                                                        : 'bg-white';

                                                            return (
                                                                <tr key={`${pool.pool_name}-key-${key.key_index}`} className={rowClassName}>
                                                                    <td className="px-4 py-3 text-slate-900 font-medium">
                                                                        Key {key.key_index}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        {isWorking ? (
                                                                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                                Working now
                                                                            </span>
                                                                        ) : isCoolingDown ? (
                                                                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                                                                                Cooling down
                                                                            </span>
                                                                        ) : isLastSelected ? (
                                                                            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                                                                Last selected
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                                Idle
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                                        {key.cooldown_seconds_remaining > 0 ? `${key.cooldown_seconds_remaining}s` : '-'}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right text-slate-500">
                                                                        {formatLastUsed(key.last_used_at_unix)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {workingKeys.length === 0 && pool.last_selected_key_index && (
                                                <p className="text-xs text-slate-400 mt-3">
                                                    ไม่มี key ที่กำลังยิง request อยู่ตอนนี้ จึง highlight key ล่าสุดที่ระบบเลือกไว้แทน
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Rate Limits & Per-Model Breakdown */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-slate-400" />
                            Model Consumption & Rate Limits
                        </h3>
                        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Model Name</th>
                                        <th className="px-6 py-4 text-right">Calls</th>
                                        <th className="px-6 py-4 text-right">Avg RPM</th>
                                        <th className="px-6 py-4 text-right">Peak RPM</th>
                                        <th className="px-6 py-4 text-right">Avg TPM</th>
                                        <th className="px-6 py-4 text-right">Peak TPM</th>
                                        <th className="px-6 py-4 text-right">Est. Cost (THB)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(stats?.models || {}).map(([model, data]: any) => (
                                        <tr key={model} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${model.includes('pro') ? 'bg-purple-500' :
                                                        data.count === 0 ? 'bg-slate-300' : 'bg-blue-400'}`}></div>
                                                    <span className={data.count === 0 ? 'text-slate-400' : ''}>
                                                        {model.replace('models/', '')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">{data.count.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{data.rate_limits?.avg_rpm}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${data.count > 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-300'}`}>
                                                    {data.rate_limits?.max_rpm}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">{Math.round(data.rate_limits?.avg_tpm).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${data.count > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-300'}`}>
                                                    {Math.round(data.rate_limits?.max_tpm / 1000)}k
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                ฿{(data.estimated_cost_thb || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Logs Table */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                                <FileText size={18} className="text-slate-400" />
                                Recent Usage Logs
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span>Page {page} of {totalPages || 1}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Topic</th>
                                        <th className="px-6 py-4">Model</th>
                                        <th className="px-6 py-4 text-right">Tokens (In/Out/Think)</th>
                                        <th className="px-6 py-4 text-right">Cost (THB)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map((log: any) => (
                                        <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors ${log.is_image ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} />
                                                    {format(new Date(log.created_at), 'dd MMM HH:mm')}
                                                    <span className="text-xs text-slate-400">({formatDistanceToNow(new Date(log.created_at), { addSuffix: true })})</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${log.is_image ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {log.topic}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 text-xs">
                                                {log.model.replace('models/', '')}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">
                                                {log.is_image ? (
                                                    <span className="text-amber-600">Image</span>
                                                ) : (
                                                    <>
                                                        {log.tokens.input} / {log.tokens.output}
                                                        {log.tokens.thinking > 0 && <span className="text-orange-500"> / {log.tokens.thinking}</span>}
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-900 font-medium">
                                                ฿{log.cost.thb.toFixed(4)}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                No recent logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
