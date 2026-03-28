"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

const ALL_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const ZODIAC_EMOJI: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
};

const ZODIAC_THAI: Record<string, string> = {
  Aries: "เมษ", Taurus: "พฤษภ", Gemini: "เมถุน", Cancer: "กรกฎ",
  Leo: "สิงห์", Virgo: "กันย์", Libra: "ตุลย์", Scorpio: "พิจิก",
  Sagittarius: "ธนู", Capricorn: "มังกร", Aquarius: "กุมภ์", Pisces: "มีน"
};

interface PoolStatus {
  forecast_date: string;
  total: number;
  target: number;
  by_zodiac: Record<string, number>;
  complete: boolean;
}

interface ForecastPoolJob {
  id: string;
  status: string;
  progress_current?: number;
  progress_target?: number;
  progress_message?: string | null;
  error_message?: string | null;
  request_payload?: {
    forecast_date?: string;
    signs?: string[];
  };
  result_payload?: {
    generated?: { sign: string; variant: number }[];
    failed?: { sign: string; variant: number; error: string }[];
    skipped?: { sign: string; reason: string }[];
    status?: PoolStatus;
  };
}

export default function ForecastPoolPage() {
  const [status, setStatus] = useState<PoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeJob, setActiveJob] = useState<ForecastPoolJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isJobActive = useMemo(() => {
    return activeJob?.status === "queued" || activeJob?.status === "running";
  }, [activeJob]);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/forecast-pool/status");
      setStatus(res.data);
    } catch (err: any) {
      setError("ไม่สามารถดึงข้อมูลสถานะได้: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatestJob = useCallback(async (forecastDate?: string) => {
    try {
      const res = await api.get("/forecast-pool/jobs/latest", {
        params: forecastDate ? { date: forecastDate } : undefined,
      });
      setActiveJob(res.data?.job || null);
    } catch (err: any) {
      console.warn("latest forecast job error", err);
    }
  }, []);

  const fetchJob = useCallback(async (jobId: string) => {
    try {
      const res = await api.get(`/forecast-pool/jobs/${jobId}`);
      setActiveJob(res.data);
      if (res.data?.status === "completed" || res.data?.status === "failed" || res.data?.status === "interrupted") {
        fetchStatus();
      }
    } catch (err: any) {
      setError("ไม่สามารถดึงสถานะ job ได้: " + (err.response?.data?.detail || err.message));
    }
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchLatestJob(status?.forecast_date);
  }, [fetchLatestJob, status?.forecast_date]);

  useEffect(() => {
    if (!activeJob?.id || !isJobActive) return;

    const interval = setInterval(() => {
      fetchJob(activeJob.id);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeJob?.id, isJobActive, fetchJob]);

  const submitGenerateRequest = async (signs?: string[]) => {
    setSubmitting(true);
    setError(null);

    try {
      // ส่ง signs ผ่าน body ให้ตรงกับ backend contract หลัก
      // เพื่อไม่ให้ปุ่ม generate ทีละราศีเผลอ queue ครบทั้ง 12 ราศี
      const res = await api.post("/forecast-pool/generate", signs ? { signs } : null, {
        timeout: 30000,
      });
      if (res.data?.job_id) {
        await fetchJob(res.data.job_id);
      }
    } catch (err: any) {
      const conflictJob = err.response?.status === 409 ? err.response?.data?.detail?.job : null;
      if (conflictJob) {
        setActiveJob(conflictJob);
        setError("มี forecast pool job กำลังทำงานอยู่แล้ว");
      } else {
        setError("Generation failed: " + (err.response?.data?.detail?.message || err.response?.data?.detail || err.message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!confirm("ต้องการสร้างคำทำนายทั้ง 12 ราศีหรือไม่?\nระบบจะรับงานเข้าคิวแล้วสร้างต่อเนื่องในพื้นหลัง (อาจใช้เวลาประมาณ 30-45 นาที)")) {
      return;
    }
    await submitGenerateRequest();
  };

  const handleGenerateSign = async (sign: string) => {
    if (!confirm(`ต้องการสร้างคำทำนายของราศี ${sign} ใช่หรือไม่?\nงานนี้จะถูกรับเข้าคิวและใช้เวลาประมาณ 3-5 นาที`)) {
      return;
    }
    await submitGenerateRequest([sign]);
  };

  const getVariantColor = (count: number) => {
    if (count >= 5) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (count >= 3) return "bg-amber-100 text-amber-800 border-amber-200";
    if (count >= 1) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  const generated = activeJob?.result_payload?.generated || [];
  const skipped = activeJob?.result_payload?.skipped || [];
  const failed = activeJob?.result_payload?.failed || [];
  const progressCurrent = activeJob?.progress_current || 0;
  const progressTarget = activeJob?.progress_target || 0;
  const progressPercent = progressTarget > 0 ? Math.round((progressCurrent / progressTarget) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forecast Pool</h1>
          <p className="text-slate-500 mt-1">จัดการคำทำนายรายวัน (5 variants × 12 ราศี = 60 ชุด/วัน)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStatus}
            disabled={loading || submitting}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={handleGenerateAll}
            disabled={submitting || isJobActive}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
          >
            {submitting ? "Submitting..." : isJobActive ? "Job Running..." : "Generate All 60"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {activeJob && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">สถานะ Job ล่าสุด</h2>
              <p className="text-sm text-slate-500 mt-1">
                {activeJob.request_payload?.forecast_date || status?.forecast_date || "-"}
              </p>
            </div>
            <div className={`text-sm font-medium ${
              activeJob.status === "completed" ? "text-emerald-600" :
              activeJob.status === "failed" || activeJob.status === "interrupted" ? "text-red-600" :
              "text-amber-600"
            }`}>
              {activeJob.status}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                <span>ความคืบหน้า</span>
                <span>{progressCurrent} / {progressTarget || "-"}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-slate-600">
              {activeJob.progress_message || "กำลังรอ worker รับงาน"}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="text-xs text-emerald-700">Generated</div>
                <div className="text-xl font-semibold text-emerald-800 mt-1">{generated.length}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="text-xs text-slate-600">Skipped</div>
                <div className="text-xl font-semibold text-slate-700 mt-1">{skipped.length}</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <div className="text-xs text-red-700">Failed</div>
                <div className="text-xl font-semibold text-red-800 mt-1">{failed.length}</div>
              </div>
            </div>

            {activeJob.error_message && (
              <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">
                {activeJob.error_message}
              </div>
            )}
          </div>
        </div>
      )}

      {status && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-sm text-slate-500">วันที่</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{status.forecast_date}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-sm text-slate-500">สร้างแล้ว</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {status.total} / {status.target}
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({Math.round((status.total / status.target) * 100)}%)
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${status.complete ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(100, (status.total / status.target) * 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-sm text-slate-500">สถานะ</div>
            <div className={`text-xl font-bold mt-1 ${status.complete ? "text-emerald-600" : "text-amber-600"}`}>
              {status.complete ? "พร้อมใช้งาน" : "ยังไม่ครบ"}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">รายละเอียดแต่ละราศี</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
          {ALL_SIGNS.map((sign) => {
            const count = status?.by_zodiac?.[sign] || 0;

            return (
              <div key={sign} className={`rounded-xl border p-4 ${getVariantColor(count)} transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ZODIAC_EMOJI[sign]}</span>
                    <div>
                      <div className="font-semibold text-sm">{sign}</div>
                      <div className="text-xs opacity-70">{ZODIAC_THAI[sign]}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">{count}/5</div>
                </div>

                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((variant) => (
                    <div
                      key={variant}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        variant <= count
                          ? "bg-white/80 text-emerald-700"
                          : "bg-black/5 text-black/20"
                      }`}
                    >
                      {variant}
                    </div>
                  ))}
                </div>

                {count < 5 && (
                  <button
                    onClick={() => handleGenerateSign(sign)}
                    disabled={submitting || isJobActive}
                    className="w-full text-xs py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isJobActive ? "Job Running..." : `Generate ${5 - count} missing`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeJob && (generated.length > 0 || skipped.length > 0 || failed.length > 0) && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">ผลของ Job ล่าสุด</h2>
          </div>
          <div className="p-6 space-y-4">
            {generated.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-emerald-700 mb-2">
                  สร้างสำเร็จ ({generated.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {generated.map((item, index) => (
                    <span key={`${item.sign}-${item.variant}-${index}`} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">
                      {ZODIAC_EMOJI[item.sign]} {item.sign} v{item.variant}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skipped.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  ข้าม ({skipped.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skipped.map((item, index) => (
                    <span key={`${item.sign}-${index}`} className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-xs">
                      {ZODIAC_EMOJI[item.sign]} {item.sign} - {item.reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {failed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-2">
                  ล้มเหลว ({failed.length})
                </h3>
                <div className="space-y-1">
                  {failed.map((item, index) => (
                    <div key={`${item.sign}-${item.variant}-${index}`} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      {ZODIAC_EMOJI[item.sign]} {item.sign} v{item.variant}: {item.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-3">ระบบทำงานอย่างไร</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p><strong>Background Job:</strong> ตอนนี้การ generate จะสร้าง job แล้วให้ worker ประมวลผลต่อในพื้นหลัง หน้าแอดมินจึงไม่ค้างรอ request ยาว</p>
          <p><strong>Priority:</strong> forecast pool ถูกลด priority ไว้เพื่อไม่ให้ไปแย่ง capacity ของ wallpaper ฝั่งผู้ใช้</p>
          <p><strong>Pool System:</strong> เมื่อสร้างครบแล้ว ระบบจะสุ่ม 1 ใน 5 variants ของแต่ละราศีให้ user แทนการ generate รายคน</p>
          <p><strong>Fallback:</strong> ถ้า pool ยังไม่ครบและมี user เข้าใช้งาน ระบบฝั่งแอพยังมี lazy generation path สำรองอยู่</p>
        </div>
      </div>
    </div>
  );
}
