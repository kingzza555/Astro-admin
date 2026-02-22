"use client";
import React, { useState, useMemo } from 'react';
import { Search, Filter, MoreVertical, Coins, Crown, Edit, RefreshCw, UserCheck, UserX, ArrowUpDown } from 'lucide-react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

type SortKey = 'display_name' | 'coins_balance' | 'created_at';

export default function UsersPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'premium' | 'free'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [sortAsc, setSortAsc] = useState(false);

    const { data: users = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users?limit=100');
            return res.data || [];
        }
    });

    const filteredUsers = useMemo(() => {
        let list = users.filter((u: any) => {
            const q = search.toLowerCase();
            const matchesSearch = !q ||
                u.email?.toLowerCase().includes(q) ||
                u.display_name?.toLowerCase().includes(q) ||
                u.id?.toLowerCase().includes(q);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'premium' && u.is_premium) ||
                (statusFilter === 'free' && !u.is_premium);

            return matchesSearch && matchesStatus;
        });

        // Sort
        list = [...list].sort((a: any, b: any) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            if (typeof av === 'number') return sortAsc ? av - bv : bv - av;
            return sortAsc
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
        return list;
    }, [users, search, statusFilter, sortKey, sortAsc]);

    const premiumCount = users.filter((u: any) => u.is_premium).length;

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(a => !a);
        else { setSortKey(key); setSortAsc(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500">
                        {users.length} users total · {premiumCount} Premium · {users.length - premiumCount} Free
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-600"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg"><UserCheck size={20} className="text-indigo-600" /></div>
                    <div><p className="text-xs text-slate-400">All Users</p><p className="text-xl font-bold text-slate-900">{users.length}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-100 flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg"><Crown size={20} className="text-amber-600" /></div>
                    <div><p className="text-xs text-slate-400">Premium</p><p className="text-xl font-bold text-amber-600">{premiumCount}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg"><UserX size={20} className="text-slate-500" /></div>
                    <div><p className="text-xs text-slate-400">Free Plan</p><p className="text-xl font-bold text-slate-700">{users.length - premiumCount}</p></div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="ค้นหาด้วย email, ชื่อ, หรือ ID..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
                    {(['all', 'premium', 'free'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-3 py-2 ${statusFilter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            {f === 'all' ? 'ทั้งหมด' : f === 'premium' ? '👑 Premium' : 'Free'}
                        </button>
                    ))}
                </div>

                {filteredUsers.length < users.length && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        แสดง {filteredUsers.length} จาก {users.length}
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 pl-6">User</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">
                                <button onClick={() => toggleSort('coins_balance')} className="flex items-center gap-1 hover:text-indigo-600">
                                    Coins <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th className="p-4">
                                <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-indigo-600">
                                    Joined <ArrowUpDown size={12} />
                                </button>
                            </th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredUsers.map((user: any) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {user.display_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{user.display_name || 'Unknown'}</div>
                                            <div className="text-slate-400 text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.is_premium ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                            <Crown size={11} /> Premium
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                            Free Plan
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 font-medium text-slate-700">
                                        <Coins size={14} className="text-amber-500" />
                                        {user.coins_balance?.toLocaleString() || 0}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-500 text-xs">
                                    {new Date(user.created_at || Date.now()).toLocaleDateString('th-TH')}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <a
                                            href={`/coins?user=${user.id}`}
                                            className="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"
                                            title="จัดการ Coin"
                                        >
                                            <Coins size={16} />
                                        </a>
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors" title="More">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-8 text-center text-slate-500">Loading users...</div>}
                {!loading && filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-400">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</div>
                )}
            </div>
        </div>
    );
}
