"use client";
import React, { useEffect, useState } from 'react';
import { Users, Coins, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, UserPlus, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    total_users: 0,
    total_premium: 0,
    todays_readings: 0,
    total_coins: 0
  });
  const [usageStats, setUsageStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [activities, setActivities] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 10;

  useEffect(() => {
    fetchData();
  }, [timeRange]); // Refetch when timeRange changes

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, actRes, usageRes] = await Promise.all([
        api.get('/stats'),
        api.get(`/activities?limit=${LIMIT}&offset=0`),
        api.get(`/stats/usage?time_range=${timeRange}`)
      ]);
      setStats(statsRes.data);
      setActivities(actRes.data || []);
      setUsageStats(usageRes.data);
      setOffset(0);
      setHasMore((actRes.data || []).length === LIMIT);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    // Load more when near bottom (within 20px)
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      loadMoreActivities();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-2">
      <div className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Today's system activity and health.</p>
        </div>
        <button
          onClick={fetchData}
          className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Minimal Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          trend="+12%"
        />
        <StatCard
          title="Prem. Members"
          value={stats.total_premium}
          trend="+5%"
        />
        <StatCard
          title="Readings Today"
          value={stats.todays_readings}
          trend="+24%"
        />
        <StatCard
          title="Coins Flow"
          value={stats.total_coins.toLocaleString()}
          valueClassName="text-slate-900"
        />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-slate-900 mb-4 px-1">Activity Log</h2>

          {activities.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-100 p-8 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
              <Activity size={32} className="mb-3 opacity-20" />
              <p className="text-sm">No recent anomalies detected.</p>
            </div>
          ) : (
            <div
              className="bg-white rounded-lg border border-slate-100 overflow-hidden max-h-[500px] overflow-y-auto scroll-smooth"
              onScroll={handleScroll}
            >
              <div className="divide-y divide-slate-50">
                {activities.map((act, i) => (
                  <div key={i} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors">
                    <AvatarIcon type={act.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{act.message}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {act.timestamp ? formatDistanceToNow(new Date(act.timestamp), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}

                {loadingMore && (
                  <div className="p-4 flex justify-center text-slate-400">
                    <RefreshCw size={16} className="animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* AI Usage Card */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-slate-900">AI Logic Cost</h2>
                <Link href="/usage" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View Details</Link>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-xs border-none bg-slate-100 rounded px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="bg-white rounded-lg border border-slate-100 p-5">
              {!usageStats ? (
                <div className="flex justify-center p-4"><RefreshCw className="animate-spin text-slate-300" /></div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="flex justify-between items-baseline border-b border-slate-50 pb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Est. Cost</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">${usageStats.total_estimated_cost_usd}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Calls</p>
                      <p className="text-lg font-semibold text-slate-700 mt-1">{usageStats.total_calls}</p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    {Object.entries(usageStats.models || {}).map(([modelName, data]: any) => (
                      <div key={modelName} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${modelName.includes('pro') ? 'bg-purple-500' : 'bg-blue-400'}`}></div>
                          <span className="text-slate-600 font-medium truncate max-w-[120px]" title={modelName}>
                            {modelName.replace('models/', '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400 text-xs">{data.count} calls</span>
                          <span className="text-slate-700 font-semibold min-w-[50px] text-right">
                            ${parseFloat(data.estimated_cost).toFixed(3)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {Object.keys(usageStats.models || {}).length === 0 && (
                      <p className="text-center text-slate-400 text-xs italic py-2">No usage data for this period</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-900 mb-4 px-1">System Status</h2>
            <div className="bg-white rounded-lg border border-slate-100 divide-y divide-slate-50">
              <StatusItem label="Database" status="operational" />
              <StatusItem label="Gemini AI" status="operational" />
              <StatusItem label="Payments" status="operational" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Minimal Components ---

const AvatarIcon = ({ type }: { type: string }) => {
  let icon = <Activity size={16} />;
  let bg = "bg-slate-100 text-slate-500";

  if (type === 'new_user') {
    icon = <UserPlus size={16} />;
    bg = "bg-emerald-50 text-emerald-600";
  } else if (type === 'transaction') {
    icon = <Coins size={16} />;
    bg = "bg-amber-50 text-amber-600";
  } else if (type === 'reading') {
    icon = <Sparkles size={16} />;
    bg = "bg-indigo-50 text-indigo-600";
  }

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
      {icon}
    </div>
  );
};

const StatCard = ({ title, value, trend, isNegative, valueClassName }: any) => (
  <div className="bg-white p-6 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
    <div className="mt-2 flex items-baseline gap-3">
      <h3 className={`text-2xl font-semibold text-slate-900 ${valueClassName}`}>{value}</h3>
      {trend && (
        <span className={`text-xs font-medium flex items-center ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
          {isNegative ? <ArrowDownRight size={12} strokeWidth={2.5} /> : <ArrowUpRight size={12} strokeWidth={2.5} />}
          {trend}
        </span>
      )}
    </div>
  </div>
);

const StatusItem = ({ label, status }: any) => (
  <div className="flex justify-between items-center p-4">
    <span className="text-sm text-slate-600 font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'operational' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' :
        'bg-rose-500'
        }`} />
      <span className="text-xs text-slate-400 capitalize">{status}</span>
    </div>
  </div>
);
