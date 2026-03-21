"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Sparkles, BookOpen, Calendar, RefreshCw, Search, Eye, X, ChevronLeft, ChevronRight, User, Clock, Coins } from 'lucide-react';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';

export default function ReadingsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [page, setPage] = useState(0);
    const [filterUser, setFilterUser] = useState('');
    const [filterTopic, setFilterTopic] = useState('');
    const [selectedReading, setSelectedReading] = useState<any>(null);
    const LIMIT = 20;

    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['readingStats'],
        queryFn: async () => {
            const res = await api.get('/readings/stats');
            return res.data;
        }
    });

    const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
        queryKey: ['readingHistory', page, filterUser, filterTopic],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
            if (filterUser) params.set('user_id', filterUser);
            if (filterTopic) params.set('topic', filterTopic);
            const res = await api.get(`/readings/history?${params}`);
            return res.data;
        }
    });

    const readings = historyData?.data || [];
    const pagination = historyData?.pagination || { total: 0 };
    const totalPages = Math.ceil(pagination.total / LIMIT);

    const handleRefresh = () => { refetchStats(); refetchHistory(); };

    const topicColors: Record<string, string> = {
        'deep_dive': 'bg-purple-100 text-purple-700',
        'tarot': 'bg-amber-100 text-amber-700',
        'tarot_celtic_cross': 'bg-orange-100 text-orange-700',
        'wallpaper': 'bg-pink-100 text-pink-700',
        'celestial_bond': 'bg-blue-100 text-blue-700',
        'chat_followup': 'bg-teal-100 text-teal-700',
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Readings Analytics</h1>
                    <p className="text-slate-500 mt-2">Daily overview and detailed reading history viewer.</p>
                </div>
                <button onClick={handleRefresh} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <RefreshCw size={20} className={statsLoading || historyLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 w-fit">
                <button onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Activity size={16} /> Overview
                </button>
                <button onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <BookOpen size={16} /> Reading History
                    {pagination.total > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">{pagination.total}</span>}
                </button>
            </div>

            {/* ====== TAB: OVERVIEW ====== */}
            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Readings Today" value={stats?.total_readings || 0} icon={<Activity size={24} />} className="border-l-4 border-l-indigo-500" />
                        <StatCard title="Daily Forecasts" value={stats?.breakdown?.daily_forecast || 0} icon={<Calendar size={24} />} className="border-l-4 border-l-blue-400" />
                        <StatCard title="Deep Dives" value={stats?.breakdown?.deep_dive || 0} icon={<Sparkles size={24} />} className="border-l-4 border-l-purple-500" />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <BookOpen size={20} className="text-indigo-500" /> Topic Popularity
                        </h2>
                        <div className="space-y-4">
                            {Object.entries(stats?.topics || {}).sort(([, a]: any, [, b]: any) => b - a).map(([topic, count]: any) => {
                                const max = Math.max(...Object.values(stats?.topics || {}) as number[], 1);
                                const percent = (count / max) * 100;
                                return (
                                    <div key={topic} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-700 font-medium capitalize">{topic.replace(/_/g, ' ')}</span>
                                            <span className="text-slate-500">{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(stats?.topics || {}).length === 0 && (
                                <p className="text-slate-400 text-center py-4">No data available today</p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ====== TAB: READING HISTORY ====== */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by User ID</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="User UUID..." value={filterUser}
                                    onChange={e => { setFilterUser(e.target.value); setPage(0); }}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="min-w-[180px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Topic</label>
                            <select value={filterTopic} onChange={e => { setFilterTopic(e.target.value); setPage(0); }}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                <option value="">All Topics</option>
                                <option value="deep_dive">Deep Dive</option>
                                <option value="tarot">Tarot</option>
                                <option value="tarot_celtic_cross">Celtic Cross</option>
                                <option value="wallpaper">Wallpaper</option>
                                <option value="celestial_bond">Celestial Bond</option>
                                <option value="chat_followup">Chat Followup</option>
                            </select>
                        </div>
                        {(filterUser || filterTopic) && (
                            <button onClick={() => { setFilterUser(''); setFilterTopic(''); setPage(0); }}
                                className="px-3 py-2 text-sm text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg">
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">User</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Topic</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Subtype</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Coins</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Time</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600">Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historyLoading ? (
                                        <tr><td colSpan={6} className="text-center py-10 text-slate-400">
                                            <RefreshCw className="mx-auto h-5 w-5 animate-spin mb-2" /> Loading...
                                        </td></tr>
                                    ) : readings.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                                            <BookOpen className="mx-auto h-8 w-8 mb-2 text-slate-300" />
                                            <p className="font-medium text-slate-600">No readings found</p>
                                            <p className="text-xs mt-1">ยังไม่มี reading history หรือ filter ไม่ตรง</p>
                                        </td></tr>
                                    ) : readings.map((r: any) => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <button onClick={() => setFilterUser(r.user_id)} className="text-indigo-600 hover:underline text-xs font-mono truncate max-w-[140px] block" title={r.user_id}>
                                                    {r.user_name || r.user_id?.slice(0, 8)}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${topicColors[r.topic] || 'bg-slate-100 text-slate-700'}`}>
                                                    {r.topic?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs">{r.subtype || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold text-amber-600">{r.coins_spent || 0} <Coins size={10} className="inline" /></span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleString('th-TH')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => setSelectedReading(r)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                                <span className="text-xs text-slate-500">
                                    {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, pagination.total)} of {pagination.total}
                                </span>
                                <div className="flex gap-1">
                                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ====== DETAIL MODAL ====== */}
            {selectedReading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReading(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Eye size={18} className="text-indigo-500" /> Reading Detail
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">ID: {selectedReading.id}</p>
                            </div>
                            <button onClick={() => setSelectedReading(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-[10px] uppercase font-semibold text-slate-400">User</p>
                                    <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-1"><User size={12} /> {selectedReading.user_name}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-[10px] uppercase font-semibold text-slate-400">Topic</p>
                                    <p className="text-sm font-medium text-slate-700 mt-1 capitalize">{selectedReading.topic?.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-[10px] uppercase font-semibold text-slate-400">Coins Spent</p>
                                    <p className="text-sm font-semibold text-amber-600 mt-1 flex items-center gap-1"><Coins size={12} /> {selectedReading.coins_spent || 0}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-[10px] uppercase font-semibold text-slate-400">Time</p>
                                    <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-1"><Clock size={12} /> {new Date(selectedReading.created_at).toLocaleString('th-TH')}</p>
                                </div>
                            </div>
                            {selectedReading.question_context && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">Question / Context</p>
                                    <p className="text-sm bg-indigo-50 rounded-lg p-3 text-indigo-800">{selectedReading.question_context}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">Full Analysis (JSON)</p>
                                <pre className="text-xs bg-slate-900 text-green-400 rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words">
                                    {JSON.stringify(selectedReading.full_analysis, null, 2)}
                                </pre>
                            </div>
                            {selectedReading.metadata && Object.keys(selectedReading.metadata).length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">Metadata</p>
                                    <pre className="text-xs bg-slate-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
                                        {JSON.stringify(selectedReading.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
