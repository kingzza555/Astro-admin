import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    UserPlus,
    Coins,
    Sparkles,
    Search,
    CheckCircle2,
    AlertCircle,
    Clock
} from 'lucide-react';

interface ActivityItem {
    type: string;
    message: string;
    timestamp: string;
    meta?: any;
}

interface ActivityTableProps {
    activities: ActivityItem[];
    loading: boolean;
    onLoadMore: () => void;
    hasMore: boolean;
    loadingMore: boolean;
}

export default function ActivityTable({
    activities,
    loading,
    onLoadMore,
    hasMore,
    loadingMore
}: ActivityTableProps) {

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_user': return <UserPlus size={16} className="text-emerald-500" />;
            case 'transaction': return <Coins size={16} className="text-amber-500" />;
            case 'reading': return <Sparkles size={16} className="text-indigo-500" />;
            default: return <Activity size={16} className="text-slate-400" />;
        }
    };

    const getStatusBadge = (type: string, meta: any) => {
        // Determine status based on type/meta
        if (type === 'new_user') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={10} /> Active
                </span>
            );
        }
        if (type === 'transaction') {
            if (meta?.amount > 0) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={10} /> Completed
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    <CheckCircle2 size={10} /> Spent
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                <Clock size={10} /> Logged
            </span>
        );
    };

    const parseDetails = (act: ActivityItem) => {
        // Extract meaningful details from message or meta
        if (act.type === 'transaction') {
            const amount = act.meta?.amount || 0;
            const absAmount = Math.abs(amount);
            return amount > 0
                ? `Admin added ${absAmount} coins`
                : `User spent ${absAmount} coins`;
        }
        if (act.type === 'new_user') {
            return `Email: ${act.meta?.email || 'N/A'}`;
        }
        if (act.type === 'reading') {
            return `Topic: ${act.meta?.topic || 'General'}`;
        }
        return act.message;
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 30) {
            onLoadMore();
        }
    };

    if (loading && activities.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                <Activity className="animate-spin mx-auto mb-2 text-indigo-500" size={24} />
                Loading activities...
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="p-12 text-center border rounded-xl bg-slate-50 border-dashed border-slate-200">
                <Search className="mx-auto mb-3 text-slate-300" size={32} />
                <p className="text-slate-500 font-medium">No activities found</p>
                <p className="text-slate-400 text-sm mt-1">Recent system events will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-600" />
                    Latest Activities
                </h3>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                    Live Feed
                </span>
            </div>

            <div
                className="overflow-x-auto max-h-[600px] overflow-y-auto scroll-smooth"
                onScroll={handleScroll}
            >
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 w-[140px]">Time</th>
                            <th className="px-6 py-3 w-[200px]">User</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3 w-[120px]">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activities.map((act, i) => {
                            // Username extraction hack (since mapping is done in page.tsx currently)
                            // Ideally we pass structured data, but for now we parse message or use meta
                            const userMatch = act.type === 'new_user'
                                ? act.message.replace('New user joined: ', '')
                                : act.meta?.user_name || 'Unknown User';

                            return (
                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                                        {act.timestamp ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">
                                                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                            {userMatch}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                                {getIcon(act.type)}
                                            </div>
                                            <span className="capitalize text-slate-700 font-medium">
                                                {act.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-600">
                                        {parseDetails(act)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {getStatusBadge(act.type, act.meta)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {loadingMore && (
                    <div className="py-4 text-center text-slate-400 text-sm border-t border-slate-100">
                        Loading more...
                    </div>
                )}
            </div>
        </div>
    );
}
