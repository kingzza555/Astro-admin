"use client";
import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, MoreVertical, Coins, Crown, Edit } from 'lucide-react';
import api from '@/lib/api';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users?limit=50');
            setUsers(res.data || []);
        } catch (error) {
            console.error(error);
            // Fallback Mock
            setUsers([
                { id: '1', email: 'test@gmail.com', display_name: 'Test User', coins_balance: 504, is_premium: false, created_at: '2023-01-01' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500">Manage {users.length} users</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users by email or name..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="px-4 py-2 border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-600">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 pl-6">User</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Coins</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {user.display_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{user.display_name || 'Unknown'}</div>
                                            <div className="text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.is_premium ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                            <Crown size={12} /> Premium
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
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
                                <td className="p-4 text-slate-500">
                                    {new Date(user.created_at || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600" title="Edit / Topup">
                                            <Edit size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {loading && (
                    <div className="p-8 text-center text-slate-500">Loading users...</div>
                )}
                {!loading && filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 m-4 rounded-lg">No users found.</div>
                )}
            </div>
        </div>
    );
}
