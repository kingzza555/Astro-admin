"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Calendar, Clock, Trash2, History, Megaphone, Timer, RefreshCw, AlertCircle, CheckCircle, Users, Sparkles, Smartphone, Zap } from 'lucide-react';
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
    notification_type: string;
    scheduled_at: string;
    status: string;
    sent_at?: string;
    data?: any;
}

interface SendResult {
    success?: boolean;
    sent?: number;
    total_tokens?: number;
    errors?: string[];
    error?: string;
    reason?: string;
}

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<'broadcast' | 'teaser' | 'scheduled'>('broadcast');

    // Stats
    const [totalDevices, setTotalDevices] = useState<number | null>(null);

    // Broadcast form
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [broadcastScreen, setBroadcastScreen] = useState('notifications');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<SendResult | null>(null);

    // Premium Teaser
    const [sendingTeaser, setSendingTeaser] = useState(false);
    const [teaserResult, setTeaserResult] = useState<SendResult | null>(null);
    const [teaserSchedDate, setTeaserSchedDate] = useState('');
    const [teaserSchedTime, setTeaserSchedTime] = useState('07:00');
    const [schedulingTeaser, setSchedulingTeaser] = useState(false);
    const [teaserSchedResult, setTeaserSchedResult] = useState<{ success?: boolean; error?: string; scheduled_at?: string } | null>(null);

    // Schedule form
    const [schedTitle, setSchedTitle] = useState('');
    const [schedBody, setSchedBody] = useState('');
    const [schedDate, setSchedDate] = useState('');
    const [schedTime, setSchedTime] = useState('07:00');
    const [schedScreen, setSchedScreen] = useState('notifications');
    const [schedulingNotif, setSchedulingNotif] = useState(false);
    const [schedResult, setSchedResult] = useState<{ success?: boolean; error?: string } | null>(null);

    // History & Scheduled list
    const [broadcastHistory, setBroadcastHistory] = useState<BroadcastItem[]>([]);
    const [scheduledList, setScheduledList] = useState<ScheduledItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Confirm modal
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

    // Templates
    const TEMPLATES = [
        { title: '🌟 ดวงดีวันนี้!', body: 'วันนี้ดวงดาวเรียงตัวเป็นมงคล ลองดูดวงรายวันของคุณได้เลย', screen: 'premium_teaser' },
        { title: '💫 อัปเดตใหม่!', body: 'เราเพิ่มฟีเจอร์ใหม่ให้คุณแล้ว! เข้ามาดูได้เลยนะ', screen: 'notifications' },
        { title: '🎁 โบนัสพิเศษ', body: 'รับ Coin ฟรีวันนี้! เข้ามารับก่อนหมดเวลานะ', screen: 'notifications' },
        { title: '🔮 ความลับจากดวงดาว', body: 'คำทำนายเจาะลึกของคุณพร้อมแล้ว แตะเพื่อเปิดดู', screen: 'premium_teaser' },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [historyRes, scheduledRes, statsRes] = await Promise.all([
                api.get('/broadcast/history?limit=30').catch(() => ({ data: [] })),
                api.get('/notifications/scheduled?limit=30').catch(() => ({ data: [] })),
                api.get('/notifications/push-stats').catch(() => ({ data: { total_devices: 0 } })),
            ]);
            setBroadcastHistory(historyRes.data || []);
            setScheduledList(scheduledRes.data || []);
            setTotalDevices(statsRes.data?.total_devices ?? 0);
        } catch (err) {
            console.error('Failed to fetch notification data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // === BROADCAST ===
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
                    data: { type: 'broadcast', screen: broadcastScreen }
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

    // === PREMIUM TEASER ===
    const handleSendTeaserNow = async () => {
        if (!confirm('ส่ง Premium Teaser Push ถึงทุกคนตอนนี้เลย?')) return;
        setSendingTeaser(true);
        setTeaserResult(null);
        try {
            const res = await api.post('/notifications/premium-teaser');
            setTeaserResult(res.data);
            fetchData();
        } catch (err: any) {
            setTeaserResult({ error: err?.response?.data?.detail || err.message });
        } finally {
            setSendingTeaser(false);
        }
    };

    const handleScheduleTeaser = async () => {
        if (!teaserSchedDate) return;
        setSchedulingTeaser(true);
        setTeaserSchedResult(null);
        try {
            const res = await api.post('/notifications/schedule-premium-teaser', null, {
                params: { time: teaserSchedTime, date: teaserSchedDate }
            });
            setTeaserSchedResult({ success: true, scheduled_at: res.data?.scheduled_at });
            setTeaserSchedDate('');
            fetchData();
        } catch (err: any) {
            setTeaserSchedResult({ error: err?.response?.data?.detail || err.message });
        } finally {
            setSchedulingTeaser(false);
        }
    };

    // === SCHEDULE CUSTOM ===
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
                data: { type: 'scheduled', screen: schedScreen }
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
    const pendingCount = scheduledList.filter(s => s.status === 'pending').length;

    // Reusable result banner
    const ResultBanner = ({ result }: { result: SendResult | null }) => {
        if (!result) return null;
        return (
            <div className={`rounded-lg p-4 text-sm ${result.error ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
                {result.error ? (
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">ส่งไม่สำเร็จ</p>
                            <p className="mt-1 text-xs">{result.error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2">
                        <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">ส่งสำเร็จ!</p>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                    <Users size={12} /> ส่งสำเร็จ: <strong className="text-base">{result.sent}</strong> / {result.total_tokens} devices
                                </span>
                                {result.sent === 0 && result.total_tokens === 0 && (
                                    <span className="text-amber-600">ยังไม่มี device ที่ลง token (ผู้ใช้ต้องเปิดแอปก่อน)</span>
                                )}
                            </div>
                            {result.errors && result.errors.length > 0 && (
                                <div className="mt-2 text-xs text-red-600">
                                    <p>Errors: {result.errors.slice(0, 3).join(', ')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header + Stats */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="text-indigo-600" size={24} />
                        Push Notifications
                    </h1>
                    <p className="text-slate-500 mt-1">ส่ง, ตั้งเวลา, และ Broadcast Push Notification</p>
                </div>
                <div className="flex items-center gap-3">
                    {totalDevices !== null && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <Smartphone size={14} className="text-indigo-500" />
                            <span className="text-sm font-semibold text-indigo-700">{totalDevices}</span>
                            <span className="text-xs text-indigo-500">devices</span>
                        </div>
                    )}
                    <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-50">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 w-fit">
                <button
                    onClick={() => setActiveTab('broadcast')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'broadcast' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Megaphone size={16} /> Broadcast
                </button>
                <button
                    onClick={() => setActiveTab('teaser')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'teaser' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Sparkles size={16} /> Premium Teaser
                </button>
                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'scheduled' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Timer size={16} /> ตั้งเวลา
                    {pendingCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
                    )}
                </button>
            </div>

            {/* ====== TAB: BROADCAST ====== */}
            {activeTab === 'broadcast' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                                        <button key={i} onClick={() => { setBroadcastTitle(t.title); setBroadcastBody(t.body); setBroadcastScreen(t.screen); }}
                                            className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors">
                                            {t.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title *</label>
                                <input type="text" placeholder="หัวข้อ notification..." value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
                                    maxLength={100} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <p className="text-xs text-slate-400 mt-1 text-right">{broadcastTitle.length}/100</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Message *</label>
                                <textarea placeholder="ข้อความ notification..." value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)}
                                    rows={4} maxLength={300} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                                <p className="text-xs text-slate-400 mt-1 text-right">{broadcastBody.length}/300</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">เปิดไปหน้า (Deep Link)</label>
                                <select value={broadcastScreen} onChange={e => setBroadcastScreen(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                    <option value="notifications">Notifications Center</option>
                                    <option value="premium_teaser">Premium Insight Modal (หน้าหลัก)</option>
                                    <option value="profile">Profile</option>
                                    <option value="history">History</option>
                                </select>
                            </div>

                            <button onClick={handleSendBroadcast} disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {sendingBroadcast ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                                ส่งถึงทุกคน ({totalDevices ?? '...'} devices)
                            </button>

                            <ResultBanner result={broadcastResult} />
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
                            <div className="divide-y divide-slate-50 max-h-[550px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-6 text-center text-slate-400"><RefreshCw className="animate-spin mx-auto" size={20} /></div>
                                ) : broadcastHistory.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีประวัติการส่ง</div>
                                ) : broadcastHistory.map((item) => (
                                    <div key={item.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
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
            )}

            {/* ====== TAB: PREMIUM TEASER ====== */}
            {activeTab === 'teaser' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Send Now */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-100 rounded-xl">
                                <Zap size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-800">ส่ง Premium Teaser ตอนนี้</h2>
                                <p className="text-xs text-slate-500 mt-0.5">ส่ง push notification จาก forecast pool ให้ user ทุกคน</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                            <p className="text-sm text-purple-800 font-medium">เมื่อ user กด notification:</p>
                            <ul className="mt-2 text-xs text-purple-700 space-y-1">
                                <li>1. เปิดแอปไปหน้าหลัก (Today Screen)</li>
                                <li>2. แสดง Premium Insight Modal อัตโนมัติ</li>
                                <li>3. User สามารถปลดล็อคด้วย Coins ได้เลย</li>
                            </ul>
                        </div>

                        <button onClick={handleSendTeaserNow} disabled={sendingTeaser}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {sendingTeaser ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            ส่ง Premium Teaser ตอนนี้ ({totalDevices ?? '...'} devices)
                        </button>

                        <ResultBanner result={teaserResult} />
                    </div>

                    {/* Schedule Teaser */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 rounded-xl">
                                <Calendar size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-800">ตั้งเวลาส่ง Premium Teaser</h2>
                                <p className="text-xs text-slate-500 mt-0.5">ตั้งเวลาอัตโนมัติส่งทุกวันตามเวลาที่กำหนด</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">วันที่</label>
                                <input type="date" value={teaserSchedDate} min={today} onChange={e => setTeaserSchedDate(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">เวลา (เวลาไทย)</label>
                                <input type="time" value={teaserSchedTime} onChange={e => setTeaserSchedTime(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                <p className="text-xs text-slate-400 mt-1">แนะนำ: 07:00 (เช้า) หรือ 18:00 (เย็น)</p>
                            </div>
                        </div>

                        <button onClick={handleScheduleTeaser} disabled={schedulingTeaser || !teaserSchedDate}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {schedulingTeaser ? <RefreshCw size={16} className="animate-spin" /> : <Clock size={16} />}
                            บันทึกเวลาส่ง Premium Teaser
                        </button>

                        {teaserSchedResult && (
                            <div className={`rounded-lg p-3 text-sm ${teaserSchedResult.error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {teaserSchedResult.error
                                    ? `${teaserSchedResult.error}`
                                    : `บันทึกสำเร็จ! จะส่ง Premium Teaser เวลา ${teaserSchedResult.scheduled_at}`}
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                            <p className="font-medium text-slate-600 mb-1">ระบบทำงานอย่างไร:</p>
                            <p>Backend มี background worker ทำงานทุก 60 วินาที เช็ค scheduled notifications ที่ถึงเวลา แล้วส่งให้ user ทุกคนอัตโนมัติ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== TAB: SCHEDULED ====== */}
            {activeTab === 'scheduled' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-500" /> กำหนดเวลาส่ง (Custom)
                            </h2>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title *</label>
                                <input type="text" placeholder="หัวข้อ..." value={schedTitle} onChange={e => setSchedTitle(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Message *</label>
                                <textarea placeholder="ข้อความ..." value={schedBody} onChange={e => setSchedBody(e.target.value)} rows={3}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">เปิดไปหน้า (Deep Link)</label>
                                <select value={schedScreen} onChange={e => setSchedScreen(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                    <option value="notifications">Notifications Center</option>
                                    <option value="premium_teaser">Premium Insight Modal (หน้าหลัก)</option>
                                    <option value="profile">Profile</option>
                                    <option value="history">History</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">วันที่ *</label>
                                    <input type="date" value={schedDate} min={today} onChange={e => setSchedDate(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">เวลา (เวลาไทย)</label>
                                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <button onClick={handleSchedule} disabled={schedulingNotif || !schedTitle.trim() || !schedBody.trim() || !schedDate}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {schedulingNotif ? <RefreshCw size={16} className="animate-spin" /> : <Clock size={16} />}
                                บันทึกการตั้งเวลา
                            </button>
                            {schedResult && (
                                <div className={`rounded-lg p-3 text-sm ${schedResult.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {schedResult.error ? schedResult.error : 'บันทึกสำเร็จ! จะส่งตามเวลาที่กำหนด'}
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
                            <div className="divide-y divide-slate-50 max-h-[550px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-6 text-center"><RefreshCw className="animate-spin mx-auto text-slate-300" size={20} /></div>
                                ) : scheduledList.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีการตั้งเวลา</div>
                                ) : scheduledList.map((item) => (
                                    <div key={item.id} className="px-5 py-3 flex items-start justify-between gap-2 hover:bg-slate-50 transition-colors">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                                    item.status === 'sent' ? 'bg-emerald-100 text-emerald-700'
                                                    : item.status === 'failed' ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                {item.notification_type === 'premium_teaser' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">teaser</span>
                                                )}
                                            </div>
                                            <p className="font-medium text-sm text-slate-800 truncate mt-1">{item.title}</p>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">{item.body}</p>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                                                <Clock size={10} />
                                                {new Date(item.scheduled_at).toLocaleString('th-TH')}
                                                {item.sent_at && <span className="ml-2 text-emerald-500">sent: {new Date(item.sent_at).toLocaleString('th-TH')}</span>}
                                            </p>
                                        </div>
                                        {item.status === 'pending' && (
                                            <button onClick={() => handleDeleteScheduled(item.id)}
                                                className="text-slate-300 hover:text-red-500 p-1 flex-shrink-0 transition-colors">
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
                            <button onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
                                ยกเลิก
                            </button>
                            <button onClick={() => confirmAction && confirmAction()} disabled={sendingBroadcast}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
