"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Calendar, Clock, Trash2, History, Megaphone, Timer, RefreshCw, AlertCircle, CheckCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
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

interface BroadcastResult {
    success?: boolean;
    sent?: number;
    total_tokens?: number;
    errors?: string[];
    error?: string;
    reason?: string;
}

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<'broadcast' | 'scheduled'>('broadcast');

    // Broadcast form
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);

    // Schedule form
    const [schedTitle, setSchedTitle] = useState('');
    const [schedBody, setSchedBody] = useState('');
    const [schedDate, setSchedDate] = useState('');
    const [schedTime, setSchedTime] = useState('07:00');
    const [schedulingNotif, setSchedulingNotif] = useState(false);
    const [schedResult, setSchedResult] = useState<{ success?: boolean; error?: string } | null>(null);

    // History
    const [broadcastHistory, setBroadcastHistory] = useState<BroadcastItem[]>([]);
    const [scheduledList, setScheduledList] = useState<ScheduledItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Confirm modal
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

    // Templates
    const TEMPLATES = [
        { title: '🌟 ดวงดีวันนี้!', body: 'วันนี้ดวงดาวเรียงตัวเป็นมงคล ลองดูดวงรายวันของคุณได้เลย ✨' },
        { title: '💫 อัปเดตใหม่!', body: 'เราเพิ่มฟีเจอร์ใหม่ให้คุณแล้ว! เข้ามาดูได้เลยนะ' },
        { title: '🎁 โบนัสพิเศษ', body: 'รับ Coin ฟรีวันนี้! เข้ามารับก่อนหมดเวลานะ 🪙' },
    ];

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

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSendBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
        setConfirmMessage(`ส่ง Push Notification ถึงทุกคน?\n\nTitle: ${broadcastTitle}\nBody: ${broadcastBody}`);
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
                fetchData();
            } catch (err: any) {
                setBroadcastResult({ error: err?.response?.data?.detail || err.message });
            } finally {
                setSendingBroadcast(false);
                setShowConfirm(false);
            }
        });
        setShowConfirm(true);
    };

    const handleSchedule = async () => {
        if (!schedTitle.trim() || !schedBody.trim() || !schedDate) return;
        setSchedulingNotif(true);
        setSchedResult(null);
        try {
            const scheduledAt = new Date(`${schedDate}T${schedTime}:00+07:00`).toISOString();
            await api.post('/notifications/schedule', {
                title: schedTitle,
                body: schedBody,
                scheduled_at: scheduledAt,
                notification_type: 'scheduled',
                data: { type: 'scheduled' }
            });
            setSchedResult({ success: true });
            setSchedTitle('');
            setSchedBody('');
            setSchedDate('');
            fetchData();
        } catch (err: any) {
            setSchedResult({ error: err?.response?.data?.detail || err.message });
        } finally {
            setSchedulingNotif(false);
        }
    };

    const handleDeleteScheduled = async (id: string) => {
        if (!confirm('ลบการแจ้งเตือนที่กำหนดไว้?')) return;
        try {
            await api.delete(`/notifications/scheduled/${id}`);
            fetchData();
        } catch (err) {
            alert('ไม่สามารถลบได้');
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="text-indigo-600" size={24} />
                        Push Notifications
                    </h1>
                    <p className="text-slate-500 mt-1">ส่งหรือกำหนดเวลา Push Notification ให้ผู้ใช้ทุกคน</p>
                </div>
                <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 w-fit">
                <button
                    onClick={() => setActiveTab('broadcast')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'broadcast' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Megaphone size={16} /> ส่งทันที
                </button>
                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'scheduled' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Timer size={16} /> ตั้งเวลา
                    {scheduledList.filter(s => s.status === 'pending').length > 0 && (
                        <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5">
                            {scheduledList.filter(s => s.status === 'pending').length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'broadcast' ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Compose */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Megaphone size={18} className="text-indigo-500" /> Compose Broadcast
                            </h2>

                            {/* Templates */}
                            <div>
                                <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Quick Templates</p>
                                <div className="flex flex-wrap gap-2">
                                    {TEMPLATES.map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setBroadcastTitle(t.title); setBroadcastBody(t.body); }}
                                            className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                        >
                                            {t.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title *</label>
                                <input
                                    type="text"
                                    placeholder="หัวข้อ notification..."
                                    value={broadcastTitle}
                                    onChange={e => setBroadcastTitle(e.target.value)}
                                    maxLength={100}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">{broadcastTitle.length}/100</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Message *</label>
                                <textarea
                                    placeholder="ข้อความ notification..."
                                    value={broadcastBody}
                                    onChange={e => setBroadcastBody(e.target.value)}
                                    rows={4}
                                    maxLength={300}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">{broadcastBody.length}/300</p>
                            </div>

                            <button
                                onClick={handleSendBroadcast}
                                disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sendingBroadcast ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                                ส่งถึงทุกคน
                            </button>

                            {/* Result */}
                            {broadcastResult && (
                                <div className={`rounded-lg p-4 text-sm ${broadcastResult.error ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
                                    {broadcastResult.error ? (
                                        <div className="flex items-start gap-2">
                                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium">ส่งไม่สำเร็จ</p>
                                                <p className="mt-1 text-xs">{broadcastResult.error}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2">
                                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium">ส่งสำเร็จ!</p>
                                                <div className="mt-2 flex gap-4 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} /> ส่งสำเร็จ: <strong>{broadcastResult.sent}</strong>/{broadcastResult.total_tokens} devices
                                                    </span>
                                                    {broadcastResult.sent === 0 && broadcastResult.total_tokens === 0 && (
                                                        <span className="text-amber-600">⚠️ ยังไม่มี device ที่ลง token (ผู้ใช้ต้องเปิดแอปก่อน)</span>
                                                    )}
                                                </div>
                                                {broadcastResult.errors && broadcastResult.errors.length > 0 && (
                                                    <div className="mt-2 text-xs text-red-600">
                                                        <p>Errors: {broadcastResult.errors.slice(0, 3).join(', ')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <History size={16} className="text-slate-400" />
                                <h3 className="font-semibold text-slate-800">ประวัติการส่ง</h3>
                                <span className="ml-auto text-xs text-slate-400">{broadcastHistory.length} รายการ</span>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-6 text-center text-slate-400"><RefreshCw className="animate-spin mx-auto" size={20} /></div>
                                ) : broadcastHistory.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีประวัติการส่ง</div>
                                ) : broadcastHistory.map((item) => (
                                    <div key={item.id} className="px-5 py-3">
                                        <p className="font-medium text-sm text-slate-800 truncate">{item.title}</p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.body}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {new Date(item.created_at).toLocaleString('th-TH')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Schedule Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-500" /> กำหนดเวลาส่ง
                            </h2>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title *</label>
                                <input
                                    type="text"
                                    placeholder="หัวข้อ..."
                                    value={schedTitle}
                                    onChange={e => setSchedTitle(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Message *</label>
                                <textarea
                                    placeholder="ข้อความ..."
                                    value={schedBody}
                                    onChange={e => setSchedBody(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">วันที่ *</label>
                                    <input
                                        type="date"
                                        value={schedDate}
                                        min={today}
                                        onChange={e => setSchedDate(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">เวลา (เวลาไทย)</label>
                                    <input
                                        type="time"
                                        value={schedTime}
                                        onChange={e => setSchedTime(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSchedule}
                                disabled={schedulingNotif || !schedTitle.trim() || !schedBody.trim() || !schedDate}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {schedulingNotif ? <RefreshCw size={16} className="animate-spin" /> : <Clock size={16} />}
                                บันทึกการตั้งเวลา
                            </button>
                            {schedResult && (
                                <div className={`rounded-lg p-3 text-sm ${schedResult.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {schedResult.error ? `❌ ${schedResult.error}` : '✅ บันทึกสำเร็จ! จะส่งตามเวลาที่กำหนด'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Scheduled List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                <h3 className="font-semibold text-slate-800">รายการที่กำหนดไว้</h3>
                                <span className="ml-auto text-xs text-slate-400">{scheduledList.length}</span>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-6 text-center"><RefreshCw className="animate-spin mx-auto text-slate-300" size={20} /></div>
                                ) : scheduledList.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีการตั้งเวลา</div>
                                ) : scheduledList.map((item) => (
                                    <div key={item.id} className="px-5 py-3 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.status === 'sent' ? 'bg-emerald-100 text-emerald-700'
                                                        : item.status === 'failed' ? 'bg-red-100 text-red-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="font-medium text-sm text-slate-800 truncate mt-1">{item.title}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Clock size={10} />
                                                {new Date(item.scheduled_at).toLocaleString('th-TH')}
                                            </p>
                                        </div>
                                        {item.status === 'pending' && (
                                            <button
                                                onClick={() => handleDeleteScheduled(item.id)}
                                                className="text-slate-300 hover:text-red-500 p-1 flex-shrink-0 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 rounded-full">
                                <Megaphone className="text-indigo-600" size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">ยืนยันการส่ง Broadcast</h3>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line mb-5">
                            {confirmMessage}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => confirmAction && confirmAction()}
                                disabled={sendingBroadcast}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {sendingBroadcast ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                ยืนยันส่ง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
