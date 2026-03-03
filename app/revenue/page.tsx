"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function RevenuePage() {
    const [period, setPeriod] = useState('30d');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['revenue', period],
        queryFn: async () => {
            const res = await api.get(`/stats/revenue?period=${period}`);
            return res.data;
        }
    });

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Revenue Dashboard</h1>
                    <p className="text-slate-500 mt-1">Track coin flow and spending patterns</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}
                        className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <option value="today">Today</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                    <button onClick={() => refetch()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-100 rounded-lg"><ArrowDownRight size={20} className="text-red-600" /></div>
                                <span className="text-sm text-slate-500">Coins Spent</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900">{(data.total_coins_spent || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg"><ArrowUpRight size={20} className="text-green-600" /></div>
                                <span className="text-sm text-slate-500">Coins Added</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900">{(data.total_coins_topup || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-100 rounded-lg"><TrendingUp size={20} className="text-indigo-600" /></div>
                                <span className="text-sm text-slate-500">Total Transactions</span>
                            </div>
                            <p className="text-3xl font-bold text-slate-900">{(data.total_transactions || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Spending by Type */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Spending by Type</h2>
                        <div className="space-y-3">
                            {Object.entries(data.spend_by_type || {}).map(([type, amount]: any) => (
                                <div key={type} className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-600 capitalize">{type.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-semibold text-slate-900">{amount.toLocaleString()} coins</span>
                                </div>
                            ))}
                            {Object.keys(data.spend_by_type || {}).length === 0 && (
                                <p className="text-sm text-slate-400 py-4 text-center">No spending data for this period</p>
                            )}
                        </div>
                    </div>

                    {/* Daily Revenue */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Daily Coin Spending</h2>
                        <div className="space-y-2">
                            {Object.entries(data.daily_revenue || {}).sort().reverse().map(([day, amount]: any) => (
                                <div key={day} className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-600">{day}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-slate-100 rounded-full h-2">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min((amount / Math.max(...Object.values(data.daily_revenue) as number[])) * 100, 100)}%` }}></div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-900 w-20 text-right">{amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
