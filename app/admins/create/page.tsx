'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Shield, Save, ArrowLeft, Loader2, Check } from 'lucide-react';
import Link from 'next/link';

const AVIAILABLE_PERMISSIONS = [
    { id: 'manage_users', label: 'Manage Users', desc: 'View, Ban, Edit Users' },
    { id: 'manage_coins', label: 'Manage Coins', desc: 'Add/Deduct Coins' },
    { id: 'approve_premium', label: 'Approve Premium', desc: 'Approve/Reject Premium Requests' },
    { id: 'broadcast_messages', label: 'Broadcast', desc: 'Send Push Notifications' },
    { id: 'view_analytics', label: 'View Analytics', desc: 'View Dashboard & Stats' },
    { id: 'manage_admins', label: 'Manage Admins', desc: 'Create/Delete Admin Users' },
];

export default function CreateAdminPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'admin', // admin, super_admin
        permissions: [] as string[]
    });

    const handlePermissionToggle = (permId: string) => {
        setFormData(prev => {
            const perms = prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: perms };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Super Admin gets all permissions implicitly, but we can send them empty or full.
            // Backend ignores permissions for super_admin role usually, but let's be safe.
            const payload = { ...formData };
            if (payload.role === 'super_admin') {
                payload.permissions = []; // Or all? Backend checks role first.
            }

            await api.post('/create', payload);
            router.push('/admins');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create admin');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admins" className="p-2 rounded-full hover:bg-gray-800 text-gray-400">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="h-6 w-6 text-purple-400" />
                    Create New Admin
                </h1>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="admin_user"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name (Optional)</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="admin">Admin (Standard)</option>
                                <option value="super_admin">Super Admin (Full Access)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Super Admin bypasses all permission checks.</p>
                        </div>
                    </div>

                    {/* Permissions */}
                    {formData.role !== 'super_admin' && (
                        <div>
                            <h3 className="text-lg font-medium text-white mb-4">Permissions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {AVIAILABLE_PERMISSIONS.map(perm => (
                                    <button
                                        key={perm.id}
                                        type="button"
                                        onClick={() => handlePermissionToggle(perm.id)}
                                        className={`flex items-start p-4 rounded-lg border text-left transition-all ${formData.permissions.includes(perm.id)
                                                ? 'bg-purple-900/30 border-purple-500 md:ring-1 md:ring-purple-500'
                                                : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                                            }`}
                                    >
                                        <div className={`mt-0.5 mr-3 w-5 h-5 rounded border flex items-center justify-center ${formData.permissions.includes(perm.id)
                                                ? 'bg-purple-600 border-purple-600'
                                                : 'border-gray-500'
                                            }`}>
                                            {formData.permissions.includes(perm.id) && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{perm.label}</div>
                                            <div className="text-xs text-gray-400">{perm.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-700">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 transition"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                            Create Admin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
