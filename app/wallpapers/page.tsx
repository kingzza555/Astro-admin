"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, RefreshCw, Trash2, Search, Users, BarChart3, X, Eye, Filter, Loader2 } from 'lucide-react';
import api from '@/lib/api';

const CATEGORIES = [
    { value: 'all', label: 'ทั้งหมด', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'love', label: 'ความรัก', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    { value: 'wealth', label: 'การเงิน', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'career', label: 'การงาน', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'health', label: 'สุขภาพ', color: 'bg-green-50 text-green-700 border-green-200' },
];

const CATEGORY_BADGE: Record<string, string> = {
    love: 'bg-pink-100 text-pink-700',
    wealth: 'bg-amber-100 text-amber-700',
    career: 'bg-blue-100 text-blue-700',
    health: 'bg-green-100 text-green-700',
};

const CATEGORY_LABEL: Record<string, string> = {
    love: 'ความรัก',
    wealth: 'การเงิน',
    career: 'การงาน',
    health: 'สุขภาพ',
};

export default function WallpapersPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'gallery' | 'stats'>('gallery');
    const [filterUser, setFilterUser] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const LIMIT = 24;
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        data: galleryPages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['wallpapers', filterUser, category, searchQuery],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({ limit: String(LIMIT), offset: String(pageParam) });
            if (filterUser) params.set('user_id', filterUser);
            if (category !== 'all') params.set('category', category);
            if (searchQuery.trim()) params.set('search', searchQuery.trim());
            const res = await api.get(`/wallpapers/search?${params}`);
            return res.data;
        },
        getNextPageParam: (lastPage: any) => {
            const p = lastPage?.pagination;
            if (!p || !p.has_more) return undefined;
            return p.offset + p.limit;
        },
        initialPageParam: 0
    });

    const { data: stats } = useQuery({
        queryKey: ['wallpaperStats'],
        queryFn: async () => { const res = await api.get('/wallpapers/stats'); return res.data; }
    });

    const wallpapers = galleryPages?.pages?.flatMap((p: any) => p.data || []) || [];
    const totalCount = galleryPages?.pages?.[0]?.pagination?.total || 0;

    // Infinite scroll observer
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }, { threshold: 0.1 });
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => { await api.delete(`/wallpapers/${id}`); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wallpapers'] }); queryClient.invalidateQueries({ queryKey: ['wallpaperStats'] }); }
    });

    const handleDelete = (id: string) => {
        if (!confirm('ลบ wallpaper นี้? การกระทำนี้ย้อนกลับไม่ได้')) return;
        deleteMutation.mutate(id);
    };

    const clearFilters = () => {
        setFilterUser('');
        setSearchQuery('');
        setCategory('all');
    };

    const hasActiveFilters = filterUser || searchQuery || category !== 'all';

    const getCategoryFromSubtype = (subtype: string): string => {
        if (!subtype) return '';
        return subtype.replace('manual_', '');
    };

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Wallpaper Management</h1>
                    <p className="text-slate-500 mt-1">ดู, ค้นหา, และจัดการ AI Wallpaper ทั้งหมด</p>
                </div>
                <div className="flex items-center gap-3">
                    {stats && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-100 rounded-lg">
                            <ImageIcon size={14} className="text-pink-500" />
                            <span className="text-sm font-semibold text-pink-700">{stats.total_wallpapers}</span>
                            <span className="text-xs text-pink-500">total</span>
                        </div>
                    )}
                    <button onClick={() => refetch()} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-50">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 w-fit">
                <button onClick={() => setActiveTab('gallery')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'gallery' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <ImageIcon size={16} /> Gallery
                </button>
                <button onClick={() => setActiveTab('stats')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <BarChart3 size={16} /> Stats
                </button>
            </div>

            {/* ====== TAB: GALLERY ====== */}
            {activeTab === 'gallery' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Search by Name / Email</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" placeholder="ชื่อผู้ใช้ หรือ email..." value={searchQuery}
                                        onChange={e => { setSearchQuery(e.target.value); setFilterUser(''); }}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>
                            <div className="min-w-[200px]">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Filter by User ID</label>
                                <input type="text" placeholder="User UUID..." value={filterUser}
                                    onChange={e => { setFilterUser(e.target.value); setSearchQuery(''); }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono" />
                            </div>
                            {hasActiveFilters && (
                                <button onClick={clearFilters}
                                    className="px-3 py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
                                    <X size={14} /> Clear
                                </button>
                            )}
                        </div>

                        {/* Category Chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter size={14} className="text-slate-400" />
                            {CATEGORIES.map(cat => (
                                <button key={cat.value}
                                    onClick={() => { setCategory(cat.value); }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                        category === cat.value ? cat.color + ' ring-2 ring-offset-1 ring-pink-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}>
                                    {cat.label}
                                </button>
                            ))}
                            <span className="text-xs text-slate-400 ml-2">{totalCount} wallpapers found</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-slate-300" size={32} /></div>
                    ) : wallpapers.length === 0 ? (
                        <div className="text-center py-20">
                            <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-base font-medium text-slate-600">No Wallpapers Found</p>
                            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                                {hasActiveFilters ? 'ลองเปลี่ยน filter หรือกด Clear เพื่อดูทั้งหมด' : 'เมื่อ user สร้าง AI Wallpaper ในแอพ ภาพจะแสดงที่นี่เพื่อดูและตรวจสอบ'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {wallpapers.map((w: any) => {
                                const analysis = w.full_analysis || {};
                                const imageUrl = analysis.image_url || analysis.imageUrl;
                                const cat = getCategoryFromSubtype(w.subtype);
                                const badgeClass = CATEGORY_BADGE[cat] || 'bg-slate-100 text-slate-600';
                                const catLabel = CATEGORY_LABEL[cat] || cat;
                                return (
                                    <div key={w.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group relative">
                                        {imageUrl ? (
                                            <div className="relative cursor-pointer" onClick={() => setSelectedImage(imageUrl)}>
                                                <img src={imageUrl} alt="Wallpaper" className="w-full h-44 object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <Eye size={24} className="text-white drop-shadow-lg" />
                                                </div>
                                                {catLabel && (
                                                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeClass}`}>
                                                        {w.subtype?.startsWith('manual_') ? 'Manual · ' : ''}{catLabel}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full h-44 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center relative">
                                                <ImageIcon size={28} className="text-pink-200" />
                                                {catLabel && (
                                                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeClass}`}>
                                                        {catLabel}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <div className="flex items-center justify-between">
                                                <button onClick={() => { setFilterUser(w.user_id); setSearchQuery(''); }}
                                                    className="text-xs text-indigo-600 hover:underline truncate max-w-[160px]" title={`${w.user_name}\n${w.user_email || w.user_id}`}>
                                                    {w.user_name || w.user_id?.slice(0, 10)}
                                                </button>
                                                <button onClick={() => handleDelete(w.id)} disabled={deleteMutation.isPending}
                                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded" title="ลบ wallpaper">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            {w.user_email && (
                                                <p className="text-[10px] text-slate-400 truncate">{w.user_email}</p>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(w.created_at).toLocaleString('th-TH')}</p>
                                            {analysis.prompt && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{analysis.prompt}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Infinite scroll trigger */}
                    <div ref={loadMoreRef} className="py-4">
                        {isFetchingNextPage ? (
                            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-2">
                                <Loader2 size={16} className="animate-spin" /> Loading more...
                            </div>
                        ) : hasNextPage ? (
                            <p className="text-center text-xs text-slate-400 py-2">Scroll down to load more</p>
                        ) : wallpapers.length > 0 ? (
                            <p className="text-center text-xs text-slate-400 py-2">
                                Showing all {wallpapers.length} of {totalCount} wallpapers
                            </p>
                        ) : null}
                    </div>
                </div>
            )}

            {/* ====== TAB: STATS ====== */}
            {activeTab === 'stats' && stats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-pink-100 rounded-xl"><ImageIcon size={20} className="text-pink-600" /></div>
                            <div>
                                <p className="text-sm text-slate-500">Total Wallpapers</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total_wallpapers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-indigo-100 rounded-xl"><Users size={20} className="text-indigo-600" /></div>
                            <div>
                                <p className="text-sm text-slate-500">Unique Users</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.unique_users}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-amber-100 rounded-xl"><BarChart3 size={20} className="text-amber-600" /></div>
                            <div>
                                <p className="text-sm text-slate-500">Avg per User</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.unique_users > 0 ? (stats.total_wallpapers / stats.unique_users).toFixed(1) : 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Users size={18} className="text-indigo-500" /> Top Wallpaper Creators
                        </h2>
                        {(stats.top_users || []).length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
                        ) : (
                            <div className="space-y-3">
                                {stats.top_users.map((u: any, i: number) => {
                                    const max = stats.top_users[0]?.count || 1;
                                    const percent = (u.count / max) * 100;
                                    return (
                                        <div key={u.user_id} className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-400 w-6 text-right">#{i + 1}</span>
                                            <button onClick={() => { setFilterUser(u.user_id); setActiveTab('gallery'); }}
                                                className="text-sm text-indigo-600 hover:underline min-w-[120px] truncate text-left" title={u.user_id}>
                                                {u.user_name}
                                            </button>
                                            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="h-full bg-pink-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 min-w-[40px] text-right">{u.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ====== LIGHTBOX ====== */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
                        <X size={24} />
                    </button>
                    <img src={selectedImage} alt="Wallpaper Full" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
