'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Box, Save, Loader2, Link as LinkIcon } from 'lucide-react';

interface AssetLinks {
    finance: string;
    love: string;
    goals: string;
    micro_timing: string;
    wallpaper: string;
}

export default function AssetsPage() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<AssetLinks>({
        finance: '',
        love: '',
        goals: '',
        micro_timing: '',
        wallpaper: ''
    });

    // Fetch Assets
    const { data: assets, isLoading } = useQuery<{ success: boolean; assets: AssetLinks }>({
        queryKey: ['settings_assets'],
        queryFn: async () => {
            const res = await api.get('/settings/assets');
            return res.data;
        }
    });

    useEffect(() => {
        if (assets?.assets) {
            setFormData(assets.assets);
        }
    }, [assets]);

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async (newAssets: AssetLinks) => {
            const res = await api.put('/settings/assets', newAssets);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings_assets'] });
            alert("✅ Assets updated successfully!");
        },
        onError: (err: any) => {
            alert("❌ Error: " + (err.response?.data?.detail || "Failed to update assets"));
        }
    });

    const handleChange = (key: keyof AssetLinks, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isLoading) return (
        <div className="flex h-[50vh] items-center justify-center text-white">
            <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Box className="h-6 w-6 text-purple-400" />
                        3D Assets Management
                    </h1>
                    <p className="text-gray-400 mt-1">Manage Cloudinary GLB links for the App's 3D Deep Dive feature.</p>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Finance */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">💰 การเงิน & ความมั่งคั่ง (Finance)</label>
                        <p className="text-xs text-gray-500 italic">Example: res.cloudinary.com/.../elephant.glb</p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                required
                                value={formData.finance}
                                onChange={(e) => handleChange('finance', e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Love */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">❤️ ความรัก & เนื้อคู่ (Love)</label>
                        <p className="text-xs text-gray-500 italic">Example: res.cloudinary.com/.../penguin.glb</p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                required
                                value={formData.love}
                                onChange={(e) => handleChange('love', e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Goals */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">🎯 การงาน & เป้าหมาย (Goals)</label>
                        <p className="text-xs text-gray-500 italic">Example: res.cloudinary.com/.../lion.glb</p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                required
                                value={formData.goals}
                                onChange={(e) => handleChange('goals', e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* AI Wallpaper */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">🔮 AI Wallpaper</label>
                        <p className="text-xs text-gray-500 italic">Example: res.cloudinary.com/.../cow.glb</p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                required
                                value={formData.wallpaper}
                                onChange={(e) => handleChange('wallpaper', e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Micro Timing */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">⏱️ ฤกษ์ยามจิ๋ว (Micro Timing)</label>
                        <p className="text-xs text-gray-500 italic">Example: res.cloudinary.com/.../rabbit.glb</p>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                required
                                value={formData.micro_timing}
                                onChange={(e) => handleChange('micro_timing', e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            Save Changes
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
