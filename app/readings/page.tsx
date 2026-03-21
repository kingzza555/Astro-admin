"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Activity, Sparkles, BookOpen, Calendar, RefreshCw, Search, Eye, X, User, Clock, Coins, TrendingUp, Hash, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function ReadingsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [filterUser, setFilterUser] = useState('');
    const [filterTopic, setFilterTopic] = useState('');
    const [selectedReading, setSelectedReading] = useState<any>(null);
    const LIMIT = 30;
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['readingStats'],
        queryFn: async () => {
            const res = await api.get('/readings/stats');
            return res.data;
        }
    });

    const {
        data: historyPages,
        isLoading: historyLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchHistory
    } = useInfiniteQuery({
        queryKey: ['readingHistory', filterUser, filterTopic],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({ limit: String(LIMIT), offset: String(pageParam) });
            if (filterUser) params.set('user_id', filterUser);
            if (filterTopic) params.set('topic', filterTopic);
            const res = await api.get(`/readings/history?${params}`);
            return res.data;
        },
        getNextPageParam: (lastPage: any) => {
            const p = lastPage?.pagination;
            if (!p || !p.has_more) return undefined;
            return p.offset + p.limit;
        },
        initialPageParam: 0
    });

    const readings = historyPages?.pages?.flatMap((p: any) => p.data || []) || [];
    const totalCount = historyPages?.pages?.[0]?.pagination?.total || 0;

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

    const handleRefresh = () => { refetchStats(); refetchHistory(); };

    const topicColors: Record<string, string> = {
        'tarot': 'bg-amber-100 text-amber-700',
        'wallpaper': 'bg-pink-100 text-pink-700',
        'celestial_bond': 'bg-blue-100 text-blue-700',
        'chat_followup': 'bg-teal-100 text-teal-700',
        'general': 'bg-slate-100 text-slate-700',
        // Deep dive topics (saved as actual topic name)
        'finance': 'bg-emerald-100 text-emerald-700',
        'love': 'bg-rose-100 text-rose-700',
        'career': 'bg-indigo-100 text-indigo-700',
        'health': 'bg-green-100 text-green-700',
        'education': 'bg-cyan-100 text-cyan-700',
        'micro_timing': 'bg-violet-100 text-violet-700',
    };

    const topicLabels: Record<string, string> = {
        'tarot': 'Tarot 3 Card',
        'tarot_celtic_cross': 'Celtic Cross',
        'wallpaper': 'Wallpaper',
        'celestial_bond': 'Celestial Bond',
        'chat_followup': 'Chat Followup',
        'finance': 'Deep Dive: การเงิน',
        'love': 'Deep Dive: ความรัก',
        'career': 'Deep Dive: การงาน',
        'health': 'Deep Dive: สุขภาพ',
        'education': 'Deep Dive: การศึกษา',
        'micro_timing': 'ฤกษ์ยามจิ๋ว',
        'general': 'General',
    };

    // Dynamic topic options from backend
    const distinctTopics: string[] = stats?.distinct_topics || [];

    const alltime = stats?.alltime || {};
    const today = stats?.today || {};
    const week = stats?.week || {};

    return (
        <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Readings Analytics</h1>
                    <p className="text-slate-500 mt-2">Overview and detailed reading history viewer.</p>
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
                    {totalCount > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">{totalCount}</span>}
                </button>
            </div>

            {/* ====== TAB: OVERVIEW ====== */}
            {activeTab === 'overview' && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-indigo-500">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">All-Time Readings</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{alltime.total || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-amber-400">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Coins Earned</p>
                            <p className="text-3xl font-bold text-amber-600 mt-2">{(alltime.total_coins || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-blue-400">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">This Week</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{week.total || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-green-400">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{today.total || 0}</p>
                            <p className="text-xs text-slate-400 mt-1">Forecasts: {today.daily_forecast || 0} | Readings: {today.readings || 0}</p>
                        </div>
                    </div>

                    {/* Topic Breakdown (All-Time) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-500" /> Topic Breakdown (All-Time)
                        </h2>
                        <div className="space-y-3">
                            {Object.entries(alltime.topics || {}).sort(([, a]: any, [, b]: any) => b - a).map(([topic, count]: any) => {
                                const max = Math.max(...Object.values(alltime.topics || {}) as number[], 1);
                                const percent = (count / max) * 100;
                                return (
                                    <div key={topic} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-700 font-medium">{topicLabels[topic] || topic.replace(/_/g, ' ')}</span>
                                            <span className="text-slate-500 font-mono text-xs">{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(alltime.topics || {}).length === 0 && (
                                <p className="text-slate-400 text-center py-6">No reading data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Today Breakdown */}
                    {Object.keys(today.topics || {}).length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-blue-500" /> Today&apos;s Readings
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(today.topics).sort(([, a]: any, [, b]: any) => b - a).map(([topic, count]: any) => (
                                    <div key={topic} className={`px-4 py-2 rounded-lg text-sm font-medium ${topicColors[topic] || 'bg-slate-100 text-slate-700'}`}>
                                        {topicLabels[topic] || topic.replace(/_/g, ' ')}: <span className="font-bold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ====== TAB: READING HISTORY (Infinite Scroll) ====== */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by User ID</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="User UUID..." value={filterUser}
                                    onChange={e => setFilterUser(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="min-w-[200px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Topic</label>
                            <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                <option value="">All Topics ({totalCount})</option>
                                {distinctTopics.map(t => (
                                    <option key={t} value={t}>{topicLabels[t] || t.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        {(filterUser || filterTopic) && (
                            <button onClick={() => { setFilterUser(''); setFilterTopic(''); }}
                                className="px-3 py-2 text-sm text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg transition-colors">
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
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
                                            <Loader2 className="mx-auto h-5 w-5 animate-spin mb-2" /> Loading...
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
                                                    {topicLabels[r.topic] || r.topic?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 text-xs">{r.subtype?.replace(/_/g, ' ') || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold text-amber-600">{r.coins_spent || 0} <Coins size={10} className="inline" /></span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString('th-TH')}</td>
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

                        {/* Infinite scroll trigger */}
                        <div ref={loadMoreRef} className="px-4 py-3 border-t border-slate-100">
                            {isFetchingNextPage ? (
                                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-2">
                                    <Loader2 size={16} className="animate-spin" /> Loading more...
                                </div>
                            ) : hasNextPage ? (
                                <p className="text-center text-xs text-slate-400 py-2">Scroll down to load more</p>
                            ) : readings.length > 0 ? (
                                <p className="text-center text-xs text-slate-400 py-2">
                                    Showing all {readings.length} of {totalCount} readings
                                </p>
                            ) : null}
                        </div>
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
                                    <p className="text-sm font-medium text-slate-700 mt-1">{topicLabels[selectedReading.topic] || selectedReading.topic?.replace(/_/g, ' ')}</p>
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
