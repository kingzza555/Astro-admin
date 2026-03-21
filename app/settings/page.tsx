"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Lock, Key, Save, Loader2, RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

const DEFAULT_CONFIGS = [
    { key: 'wallpaper_cost', description: 'Coin cost for AI Wallpaper generation', defaultValue: '119' },
    { key: 'deep_dive_cost', description: 'Coin cost for Deep Dive reading', defaultValue: '3' },
    { key: 'micro_timing_cost', description: 'Coin cost for Micro Timing reading', defaultValue: '3' },
    { key: 'celestial_bond_cost', description: 'Coin cost for Celestial Bond reading', defaultValue: '3' },
    { key: 'new_user_bonus_coins', description: 'Free coins given to new users on signup', defaultValue: '10' },
    { key: 'maintenance_mode', description: 'Enable maintenance mode (true/false)', defaultValue: 'false' },
];

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const user = authService.getUser();

    // --- Change Password State ---
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // --- App Config State ---
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // --- Fetch App Config ---
    const { data: configData, isLoading: configLoading } = useQuery({
        queryKey: ['app-config'],
        queryFn: async () => {
            const res = await api.get('/settings/app-config');
            return res.data;
        }
    });

    // --- Change Password Mutation ---
    const changePasswordMutation = useMutation({
        mutationFn: async (payload: { current_password: string; new_password: string }) => {
            const res = await api.post('/settings/change-password', payload);
            return res.data;
        },
        onSuccess: () => {
            setPwMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail || 'Failed to change password';
            setPwMessage({ type: 'error', text: detail });
        }
    });

    // --- Update Config Mutation ---
    const updateConfigMutation = useMutation({
        mutationFn: async (payload: { key: string; value: string; description?: string }) => {
            const res = await api.put('/settings/app-config', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['app-config'] });
            setEditingKey(null);
            setEditValue('');
            setConfigMessage({ type: 'success', text: 'Config updated successfully!' });
            setTimeout(() => setConfigMessage(null), 3000);
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail || 'Failed to update config';
            setConfigMessage({ type: 'error', text: detail });
        }
    });

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPwMessage(null);

        if (newPassword.length < 8) {
            setPwMessage({ type: 'error', text: 'New password must be at least 8 characters' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwMessage({ type: 'error', text: 'New password and confirmation do not match' });
            return;
        }
        if (currentPassword === newPassword) {
            setPwMessage({ type: 'error', text: 'New password must be different from current password' });
            return;
        }

        changePasswordMutation.mutate({
            current_password: currentPassword,
            new_password: newPassword
        });
    };

    const handleSaveConfig = (key: string, description?: string) => {
        if (!editValue.trim()) return;
        updateConfigMutation.mutate({ key, value: editValue.trim(), description });
    };

    const getConfigValue = (key: string, defaultValue: string): string => {
        if (configData?.config?.[key]) {
            return configData.config[key].value;
        }
        return defaultValue;
    };

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header */}
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Settings size={28} />
                    Settings
                </h1>
                <p className="text-slate-500 mt-1">Admin profile and app configuration</p>
            </div>

            {/* Admin Profile Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-indigo-500" />
                    Admin Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Username</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{user?.username || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Role</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Permissions</p>
                        <p className="text-sm text-slate-600 mt-1">
                            {user?.role === 'super_admin' ? 'All permissions' : (user?.permissions?.join(', ') || 'Default')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <Lock size={20} className="text-amber-500" />
                    Change Password
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                    For security, you must enter your current password to set a new one. Minimum 8 characters.
                </p>

                {pwMessage && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                        pwMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {pwMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        {pwMessage.text}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPw ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                                placeholder="Enter current password"
                            />
                            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPw ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                                placeholder="Minimum 8 characters"
                            />
                            <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Re-enter new password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {changePasswordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                        Change Password
                    </button>
                </form>
            </div>

            {/* App Configuration */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    <Settings size={20} className="text-indigo-500" />
                    App Configuration
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                    Manage coin costs and feature flags. Changes are logged in Audit Logs.
                </p>

                {configMessage && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                        configMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {configMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        {configMessage.text}
                    </div>
                )}

                {configLoading ? (
                    <div className="flex justify-center py-8">
                        <RefreshCw className="animate-spin text-slate-300" size={24} />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {DEFAULT_CONFIGS.map((cfg) => {
                            const currentValue = getConfigValue(cfg.key, cfg.defaultValue);
                            const isEditing = editingKey === cfg.key;

                            return (
                                <div key={cfg.key} className="py-4 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 font-mono">{cfg.key}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-32 px-2 py-1 border border-indigo-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveConfig(cfg.key, cfg.description);
                                                        if (e.key === 'Escape') { setEditingKey(null); setEditValue(''); }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleSaveConfig(cfg.key, cfg.description)}
                                                    disabled={updateConfigMutation.isPending}
                                                    className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    {updateConfigMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => { setEditingKey(null); setEditValue(''); }}
                                                    className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"
                                                >
                                                    ✕
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className={`px-3 py-1 rounded-md text-sm font-mono ${
                                                    configData?.config?.[cfg.key]
                                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                                                }`}>
                                                    {currentValue}
                                                    {!configData?.config?.[cfg.key] && <span className="text-xs ml-1 text-slate-400">(default)</span>}
                                                </span>
                                                <button
                                                    onClick={() => { setEditingKey(cfg.key); setEditValue(currentValue); }}
                                                    className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"
                                                >
                                                    Edit
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-amber-800">Security Notice</h3>
                        <ul className="text-xs text-amber-700 mt-1 space-y-1">
                            <li>- All config changes are recorded in Audit Logs with your username and IP address</li>
                            <li>- Password changes require your current password for verification</li>
                            <li>- Sessions expire after 24 hours — you will need to re-login</li>
                            <li>- Do not share your admin credentials with anyone</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
