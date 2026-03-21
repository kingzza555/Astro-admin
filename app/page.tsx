"use client";
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Coins,
  RefreshCw,
  Sparkles,
  Activity,
  BarChart3,
  Zap,
  Server
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import ActivityTable from '@/components/ActivityTable';
import StatCard from '@/components/StatCard';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activities, setActivities] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 10;

  // 1. Stats Query
  const { data: statsMap, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await api.get('/stats');
      return res.data;
    }
  });

  // 2. Usage Query
  const { data: usageMap, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ['usage', timeRange],
    queryFn: async () => {
      const res = await api.get(`/stats/usage?time_range=${timeRange}`);
      return res.data;
    }
  });

  // 3. Activities (Hybrid: Initial Load via Query, Load More via State)
  // We use useQuery for the initial fetch to benefit from caching on navigation
  const { data: initialActivities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['activities', 'initial'],
    queryFn: async () => {
      const res = await api.get(`/activities?limit=${LIMIT}&offset=0`);
      return res.data;
    }
  });

  // Sync initial activities to state when loaded (and reset on refresh)
  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities);
      setOffset(0);
      setHasMore(initialActivities.length === LIMIT);
    }
  }, [initialActivities]);

  const stats = statsMap || {
    total_users: 0,
    total_premium: 0,
    todays_readings: 0,
    total_coins: 0
  };

  const usageStats = usageMap;
  const isLoading = statsLoading || usageLoading || activitiesLoading;

  // 4. Chart Data Query
  const { data: chartData, refetch: refetchCharts } = useQuery({
    queryKey: ['chartData'],
    queryFn: async () => {
      const res = await api.get('/stats/charts?days=7');
      return res.data?.data || [];
    }
  });

  // 5. Retention Stats
  const { data: retention } = useQuery({
    queryKey: ['retention'],
    queryFn: async () => {
      const res = await api.get('/stats/retention');
      return res.data;
    }
  });

  const handleRefresh = () => {
    refetchStats();
    refetchUsage();
    refetchActivities();
    refetchCharts();
  };

  const loadMoreActivities = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextOffset = offset + LIMIT;
      const res = await api.get(`/activities?limit=${LIMIT}&offset=${nextOffset}`);

      const newItems = res.data || [];
      if (newItems.length < LIMIT) setHasMore(false);

      setActivities(prev => [...prev, ...newItems]);
      setOffset(nextOffset);
    } catch (error) {
      console.error("Failed to load more", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Calculate percentages/trends (mock logic for demo if API doesn't provide)
  const premiumRate = stats.total_users > 0
    ? Math.round((stats.total_premium / stats.total_users) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-2">Monitor your system performance and user activities.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          icon={<Users size={24} />}
          trend="+12%"
          trendLabel="vs last month"
          className="border-l-4 border-l-indigo-500"
          href="/users"
        />
        <StatCard
          title="Premium Members"
          value={stats.total_premium.toLocaleString()}
          icon={<Sparkles size={24} />}
          trend={`${premiumRate}%`}
          trendLabel="conversion rate"
          className="border-l-4 border-l-amber-500"
          href="/premium"
        />
        <StatCard
          title="Readings Today"
          value={stats.todays_readings.toLocaleString()}
          icon={<Activity size={24} />}
          trend="+24%"
          trendLabel="vs yesterday"
          className="border-l-4 border-l-emerald-500"
          href="/readings"
        />
        <StatCard
          title="Coins Spend Limit"
          value={`฿ ${(stats.total_coins || 0).toLocaleString()}`}
          icon={<Coins size={24} />}
          // Using coin flow as a proxy for revenue (if 1 coin ~ 1 THB/USD logic applies)
          trend="Flow"
          trendLabel="today"
          className="border-l-4 border-l-rose-500"
          href="/coins"
        />
      </div>

      {/* Charts Section */}
      {chartData && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Readings / Users per Day */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" /> Readings & New Users (7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="readingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="readings" name="Readings" stroke="#6366f1" fill="url(#readingsFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="new_users" name="New Users" stroke="#10b981" fill="url(#usersFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Coin Flow */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Coins size={16} className="text-amber-500" /> Coin Flow (7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="coin_topup" name="Topup" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="coin_spend" name="Spend" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Retention Stats */}
      {retention && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users size={16} className="text-emerald-500" /> User Retention
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[{ label: 'Day 1', data: retention.day_1, color: 'emerald' }, { label: 'Day 7', data: retention.day_7, color: 'blue' }, { label: 'Day 30', data: retention.day_30, color: 'purple' }].map(({ label, data, color }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-slate-500 mb-1">{label} Retention</p>
                <p className={`text-3xl font-bold text-${color}-600`}>{data?.rate || 0}%</p>
                <p className="text-[10px] text-slate-400 mt-1">{data?.retained || 0} / {data?.cohort_size || 0} users</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left Column: Activity Log Table (70% width on XL) */}
        <div className="xl:col-span-2 space-y-6">
          <ActivityTable
            activities={activities}
            loading={isLoading && activities.length === 0}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMoreActivities}
          />
        </div>

        {/* Right Column: AI Usage & System Status (30% width on XL) */}
        <div className="space-y-8">

          {/* AI Usage Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Zap size={18} />
                </div>
                <h2 className="font-semibold text-slate-800">AI Consumption</h2>
              </div>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="today">Today</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>

            {!usageStats ? (
              <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-slate-300" /></div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-2">
                  <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Estimated Cost</p>
                  <h3 className="text-4xl font-bold text-slate-900 mt-2">${usageStats.total_estimated_cost_usd}</h3>
                  <p className="text-xs text-slate-400 mt-1">{usageStats.total_calls.toLocaleString()} API calls</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase">Top Models</h4>
                  {Object.entries(usageStats.models || {}).map(([modelName, data]: any) => {
                    const percent = usageStats.total_calls > 0
                      ? Math.round((data.count / usageStats.total_calls) * 100)
                      : 0;

                    return (
                      <div key={modelName} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 font-medium truncate max-w-[150px]" title={modelName}>
                            {modelName.replace('models/', '').replace('gemini-', '')}
                          </span>
                          <span className="text-slate-500">{data.count} calls</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${modelName.includes('pro') ? 'bg-indigo-500' : 'bg-blue-400'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 mt-2">
                  <Link href="/usage" className="block w-full text-center py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                    View Detailed Report
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Server size={18} />
              </div>
              <h2 className="font-semibold text-slate-800">System Status</h2>
            </div>

            <div className="space-y-0 divide-y divide-slate-100">
              <StatusRow label="Database (Supabase)" status="operational" />
              <StatusRow label="AI Engine (Gemini)" status="operational" />
              <StatusRow label="Payment Gateway" status="operational" />
              <StatusRow label="Push Notifications" status="operational" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatusRow = ({ label, status }: { label: string, status: string }) => (
  <div className="flex justify-between items-center py-3">
    <span className="text-sm text-slate-600">{label}</span>
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium capitalize">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      {status}
    </span>
  </div>
);

