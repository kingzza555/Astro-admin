"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Calendar, Clock, Trash2, History, Plus, Megaphone, Timer } from 'lucide-react';
import api from '@/lib/api';

interface BroadcastItem {
    id: string;
    title: string;
    body: string;
    type: string;
    created_at: string;
}

interface ScheduledItem {
    id: string;
    title: string;
    body: string;
    type: string;
    scheduled_at: string;
    status: string;
    sent_at?: string;
}

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<'broadcast' | 'scheduled'>('broadcast');

    // Broadcast form
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<any>(null);

    // Schedule form
    const [schedTitle, setSchedTitle] = useState('');
    const [schedBody, setSchedBody] = useState('');
    const [schedDate, setSchedDate] = useState('');
    const [schedTime, setSchedTime] = useState('07:00');
    const [schedulingNotif, setSchedulingNotif] = useState(false);

    // History
    const [broadcastHistory, setBroadcastHistory] = useState<BroadcastItem[]>([]);
    const [scheduledList, setScheduledList] = useState<ScheduledItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Confirmation dialog
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [historyRes, scheduledRes] = await Promise.all([
                api.get('/broadcast/history?limit=30'),
                api.get('/notifications/scheduled?limit=30')
            ]);
            setBroadcastHistory(historyRes.data || []);
            setScheduledList(scheduledRes.data || []);
        } catch (err) {
            console.error('Failed to fetch notification data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSendBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastBody.trim()) return;

        setShowConfirm(true);
        setConfirmMessage(`ส่ง Push Notification ถึง ทุกคน?\n\nTitle: ${broadcastTitle}\nBody: ${broadcastBody}`);
        setConfirmAction(() => async () => {
            setSendingBroadcast(true);
            setBroadcastResult(null);
            try {
                const res = await api.post('/broadcast', {
                    title: broadcastTitle,
                    body: broadcastBody,
                    data: { type: 'broadcast', screen: 'notifications' }
                });
                setBroadcastResult(res.data);
                setBroadcastTitle('');
                setBroadcastBody('');
                fetchData(); // Refresh history
            } catch (err: any) {
                setBroadcastResult({ error: err.message });
            } finally {
                setSendingBroadcast(false);
                setShowConfirm(false);
            }
        });
    };

    const handleSchedule = async () => {
        if (!schedTitle.trim() || !schedBody.trim() || !schedDate) return;

        setSchedulingNotif(true);
        try {
            const scheduledAt = new Date(`${schedDate}T${schedTime}:00+07:00`).toISOString();
            await api.post('/notifications/schedule', {
                title: schedTitle,
                body: schedBody,
                scheduled_at: scheduledAt,
                notification_type: 'scheduled',
                data: { type: 'scheduled', screen: 'notifications' }
            });
            setSchedTitle('');
            setSchedBody('');
            setSchedDate('');
            setSchedTime('07:00');
            fetchData();
        } catch (err) {
            console.error('Failed to schedule:', err);
        } finally {
            setSchedulingNotif(false);
        }
    };

    const handleDeleteScheduled = async (id: string) => {
        try {
            await api.delete(`/notifications/scheduled/${id}`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'รอส่ง' },
            sent: { bg: 'bg-green-50', text: 'text-green-700', label: 'ส่งแล้ว' },
            failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'ล้มเหลว' },
        };
        const s = map[status] || map.pending;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                {s.label}
            </span>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Bell size={24} className="text-blue-600" />
                        Notifications
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">จัดการ Push Notification & ตั้งเวลาแจ้งเตือน</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setActiveTab('broadcast')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'broadcast'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Megaphone size={16} />
                    Broadcast ทันที
                </button>
                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'scheduled'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Timer size={16} />
                    ตั้งเวลาส่ง
                </button>
            </div>

            {/* === BROADCAST TAB === */}
            {activeTab === 'broadcast' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
                            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Send size={16} className="text-blue-500" />
                                ส่ง Broadcast
                            </h2>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="เช่น 🌟 ดวงวันนี้มาแล้ว!"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Body</label>
                                <textarea
                                    value={broadcastBody}
                                    onChange={(e) => setBroadcastBody(e.target.value)}
                                    placeholder="ข้อความที่ต้องการส่ง..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                />
                            </div>

                            {/* Preview */}
                            {broadcastTitle && (
                                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                                    <p className="text-xs font-medium text-slate-400">Preview</p>
                                    <p className="text-sm font-semibold text-slate-900">{broadcastTitle}</p>
                                    <p className="text-xs text-slate-600">{broadcastBody}</p>
                                </div>
                            )}

                            <button
                                onClick={handleSendBroadcast}
                                disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sendingBroadcast ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                                ส่งถึงทุกคน
                            </button>

                            {broadcastResult && (
                                <div className={`rounded-lg p-3 text-xs ${broadcastResult.error
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-green-50 text-green-600'
                                    }`}>
                                    {broadcastResult.error
                                        ? `❌ Error: ${broadcastResult.error}`
                                        : `✅ ส่งสำเร็จ! (${broadcastResult.sent || 0} devices)`
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History */}
                    <div className="lg:col-span-3">
                        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <History size={16} className="text-slate-400" />
                            Broadcast History
                        </h2>
                        <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                            {loading ? (
                                <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
                            ) : broadcastHistory.length === 0 ? (
                                <div className="p-8 text-center text-sm text-slate-400">ยังไม่มีประวัติ Broadcast</div>
                            ) : (
                                broadcastHistory.map((item) => (
                                    <div key={item.id} className="px-4 py-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.body}</p>
                                            </div>
                                            <span className="text-xs text-slate-400 ml-3 whitespace-nowrap">
                                                {formatDate(item.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* === SCHEDULED TAB === */}
            {activeTab === 'scheduled' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
                            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Calendar size={16} className="text-amber-500" />
                                ตั้งเวลาส่ง Notification
                            </h2>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={schedTitle}
                                    onChange={(e) => setSchedTitle(e.target.value)}
                                    placeholder="เช่น 🌟 ดวงรายสัปดาห์มาแล้ว!"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Body</label>
                                <textarea
                                    value={schedBody}
                                    onChange={(e) => setSchedBody(e.target.value)}
                                    placeholder="ข้อความที่ต้องการส่ง..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">วันที่</label>
                                    <input
                                        type="date"
                                        value={schedDate}
                                        onChange={(e) => setSchedDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">เวลา</label>
                                    <input
                                        type="time"
                                        value={schedTime}
                                        onChange={(e) => setSchedTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSchedule}
                                disabled={schedulingNotif || !schedTitle.trim() || !schedBody.trim() || !schedDate}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {schedulingNotif ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Clock size={14} />
                                )}
                                ตั้งเวลาส่ง
                            </button>
                        </div>
                    </div>

                    {/* Scheduled List */}
                    <div className="lg:col-span-3">
                        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Timer size={16} className="text-slate-400" />
                            รายการที่ตั้งเวลาไว้
                        </h2>
                        <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                            {loading ? (
                                <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
                            ) : scheduledList.length === 0 ? (
                                <div className="p-8 text-center text-sm text-slate-400">ยังไม่มีรายการที่ตั้งเวลา</div>
                            ) : (
                                scheduledList.map((item) => (
                                    <div key={item.id} className="px-4 py-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.body}</p>
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    ส่งเมื่อ: {formatDate(item.scheduled_at)}
                                                </p>
                                            </div>
                                            {item.status === 'pending' && (
                                                <button
                                                    onClick={() => handleDeleteScheduled(item.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors ml-3 p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">ยืนยันการส่ง</h3>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{confirmMessage}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => confirmAction?.()}
                                disabled={sendingBroadcast}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {sendingBroadcast ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'ยืนยัน'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
