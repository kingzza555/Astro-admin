"use client";
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Sparkles, BookOpen, Calendar, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import ActivityTable from '@/components/ActivityTable';

export default function ReadingsPage() {
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['readingStats'],
        queryFn: async () => {
            const res = await api.get('/readings/stats');
            return res.data;
        }
    });

    const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
        queryKey: ['readingRecentActivities'],
        queryFn: async () => {
            const res = await api.get('/activities?limit=20&offset=0');
            return (res.data || []).filter((a: any) => a.type === 'reading');
        }
    });

    const isLoading = statsLoading || activitiesLoading;
    const recentReadings = activities || [];

    if (isLoading && !stats) {
        return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-slate-300" /></div>;
    }

    const handleRefresh = () => {
        refetchStats();
        refetchActivities();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Readings Analytics</h1>
                    <p className="text-slate-500 mt-2">Daily overview of user readings and topic popularity.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Readings Today"
                    value={stats?.total_readings || 0}
                    icon={<Activity size={24} />}
                    className="border-l-4 border-l-indigo-500"
                />
                <StatCard
                    title="Daily Forecasts"
                    value={stats?.breakdown?.daily_forecast || 0}
                    icon={<Calendar size={24} />}
                    className="border-l-4 border-l-blue-400"
                />
                <StatCard
                    title="Deep Dives"
                    value={stats?.breakdown?.deep_dive || 0}
                    icon={<Sparkles size={24} />}
                    className="border-l-4 border-l-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Topic Breakdown Chart */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-500" />
                        Topic Popularity
                    </h2>

                    <div className="space-y-4">
                        {Object.entries(stats?.topics || {}).sort(([, a]: any, [, b]: any) => b - a).map(([topic, count]: any) => {
                            const max = Math.max(...Object.values(stats?.topics || {}) as number[], 1);
                            const percent = (count / max) * 100;

                            return (
                                <div key={topic} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 font-medium capitalize">{topic.replace('_', ' ')}</span>
                                        <span className="text-slate-500">{count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(stats?.topics || {}).length === 0 && (
                            <p className="text-slate-400 text-center py-4">No data available today</p>
                        )}
                    </div>
                </div>

                {/* Right: Recent Readings Table */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 px-1">Recent Readings</h2>
                    <ActivityTable
                        activities={recentReadings}
                        loading={false}
                        hasMore={false}
                        loadingMore={false}
                        onLoadMore={() => { }}
                    />
                </div>
            </div>
        </div>
    );
}
