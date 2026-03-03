"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function WallpapersPage() {
    const { data: wallpapers, isLoading, refetch } = useQuery({
        queryKey: ['wallpapers'],
        queryFn: async () => { const res = await api.get('/wallpapers?limit=50'); return res.data; }
    });

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Wallpaper Gallery</h1>
                    <p className="text-slate-500 mt-1">View all AI-generated wallpapers by users</p>
                </div>
                <button onClick={() => refetch()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
            ) : (wallpapers || []).length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
                    <p>No wallpapers generated yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(wallpapers || []).map((w: any) => {
                        const analysis = w.full_analysis || {};
                        const imageUrl = analysis.image_url || analysis.imageUrl;
                        return (
                            <div key={w.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Wallpaper" className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                        <ImageIcon size={32} className="text-indigo-300" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <p className="text-xs text-slate-400">{new Date(w.created_at).toLocaleString('th-TH')}</p>
                                    <p className="text-xs font-mono text-slate-500 mt-1">User: {w.user_id?.slice(0, 12)}...</p>
                                    {analysis.prompt && (
                                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{analysis.prompt}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
