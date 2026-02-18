'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, User, Shield, CheckCircle, XCircle, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { authService } from '../../lib/auth';

interface AdminUser {
    id: string;
    username: string;
    role: string;
    is_active: boolean;
    last_login: string | null;
    permissions: string[];
}

export default function AdminsPage() {
    const queryClient = useQueryClient();
    const currentUser = authService.getUser();

    // Fetch Admins
    const { data: admins, isLoading, error } = useQuery<AdminUser[]>({
        queryKey: ['admins'],
        queryFn: async () => {
            const res = await api.get('/list');
            return res.data;
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
        },
        onError: (err: any) => {
            alert(err.response?.data?.detail || "Failed to delete admin");
        }
    });

    const handleDelete = (id: string, username: string) => {
        if (confirm(`Are you sure you want to delete admin "${username}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) return (
        <div className="flex h-[50vh] items-center justify-center text-white">
            <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="h-6 w-6 text-purple-400" />
                    Admin Management
                </h1>
                <Link
                    href="/admins/create"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    <Plus className="h-4 w-4" />
                    Add New Admin
                </Link>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Permissions</th>
                            <th className="px-6 py-4">Last Login</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {admins?.map((admin) => (
                            <tr key={admin.id} className="hover:bg-gray-700/30 transition">
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    {admin.username}
                                    {currentUser?.username === admin.username && (
                                        <span className="ml-2 text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700">
                                            You
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${admin.role === 'super_admin'
                                            ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                                            : 'bg-blue-900/50 text-blue-400 border border-blue-700'
                                        }`}>
                                        {admin.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {admin.role === 'super_admin' ? (
                                            <span className="text-xs text-gray-500 italic">All Permissions</span>
                                        ) : (admin.permissions || []).length > 0 ? (
                                            (admin.permissions || []).slice(0, 3).map(p => (
                                                <span key={p} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                                                    {p.split('_')[1] || p}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-600">-</span>
                                        )}
                                        {(admin.permissions || []).length > 3 && (
                                            <span className="text-xs text-gray-500">+{admin.permissions.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {currentUser?.username !== admin.username && (
                                        <button
                                            onClick={() => handleDelete(admin.id, admin.username)}
                                            className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-900/20"
                                            title="Delete Admin"
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending && deleteMutation.variables === admin.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!admins || admins.length === 0) && !isLoading && !error && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No admin users found.
                                </td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertTriangle className="h-6 w-6" />
                                        <span>Failed to load admins.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
