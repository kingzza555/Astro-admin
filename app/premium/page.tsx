"use client";
import React, { useEffect, useState } from 'react';
import { Check, X, Clock, User, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function PremiumRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/premium/requests');
            setRequests(res.data || []);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string, plan: string) => {
        if (!confirm('ยืนยันการอนุมัติ Premium?')) return;

        try {
            setProcessingId(userId);
            await api.post('/premium/approve', { user_id: userId, plan });
            // Remove from list
            setRequests(prev => prev.filter(r => r.user_id !== userId));
            alert('อนุมัติเรียบร้อย');
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการอนุมัติ');
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (userId: string) => {
        if (!confirm('ยืนยันการปฏิเสธคำขอ?')) return;

        try {
            setProcessingId(userId);
            await api.post('/premium/reject', { user_id: userId, reason: 'Admin Rejected' });
            // Remove from list
            setRequests(prev => prev.filter(r => r.user_id !== userId));
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการปฏิเสธ');
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="text-indigo-600" />
                        Premium Requests
                    </h1>
                    <p className="text-slate-500 mt-1">จัดการคำขออัปเกรดสถานะสมาชิก</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading && requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-2" />
                        <p>Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-20" />
                        <p className="text-lg font-medium text-slate-600">No Pending Requests</p>
                        <p className="text-sm">เมื่อมีผู้ใช้งานขออัปเกรด รายการจะมาปรากฏที่นี่</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        <div className="bg-slate-50/50 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-4">User Info</div>
                            <div className="col-span-2">Plan</div>
                            <div className="col-span-3">Requested At</div>
                            <div className="col-span-3 text-right">Actions</div>
                        </div>

                        {requests.map((req) => (
                            <div key={req.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors group">
                                {/* User Info */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {req.name?.[0] || req.email?.[0] || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{req.name || 'Unknown User'}</p>
                                        <p className="text-xs text-slate-500 truncate">{req.email}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{req.user_id}</p>
                                    </div>
                                </div>

                                {/* Plan */}
                                <div className="col-span-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                        {req.plan || 'Monthly'}
                                    </span>
                                </div>

                                {/* Time */}
                                <div className="col-span-3 text-sm text-slate-500 flex items-center gap-2">
                                    <Clock size={14} />
                                    {req.requested_at ? formatDistanceToNow(new Date(req.requested_at), { addSuffix: true }) : '-'}
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 flex justify-end gap-2 opacity-100">
                                    <button
                                        onClick={() => handleReject(req.user_id)}
                                        disabled={!!processingId}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all disabled:opacity-50"
                                    >
                                        <X size={14} />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(req.user_id, req.plan)}
                                        disabled={!!processingId}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
                                    >
                                        {processingId === req.user_id ? (
                                            <RefreshCw size={14} className="animate-spin" />
                                        ) : (
                                            <Check size={14} />
                                        )}
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
