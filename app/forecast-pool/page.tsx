"use client";
import React, { useState, useEffect, useCallback } from "react";
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

interface GenerateResult {
  message: string;
  results: {
    generated: { sign: string; variant: number }[];
    failed: { sign: string; variant: number; error: string }[];
    skipped: { sign: string; reason: string }[];
  };
  status: PoolStatus;
}

export default function ForecastPoolPage() {
  const [status, setStatus] = useState<PoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingSign, setGeneratingSign] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleGenerateAll = async () => {
    if (!confirm("ต้องการสร้างคำทำนาย 60 ชุด (12 ราศี × 5 variants) ?\nจะใช้เวลาประมาณ 2-5 นาที")) return;
    
    setGenerating(true);
    setLastResult(null);
    setError(null);
    
    try {
      const res = await api.post("/forecast-pool/generate", null, { timeout: 600000 });
      setLastResult(res.data);
      fetchStatus();
    } catch (err: any) {
      setError("Generation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSign = async (sign: string) => {
    setGeneratingSign(sign);
    setError(null);
    
    try {
      const res = await api.post("/forecast-pool/generate", null, {
        params: { signs: sign },
        timeout: 120000
      });
      setLastResult(res.data);
      fetchStatus();
    } catch (err: any) {
      setError(`Failed for ${sign}: ` + (err.response?.data?.detail || err.message));
    } finally {
      setGeneratingSign(null);
    }
  };

  const getVariantColor = (count: number) => {
    if (count >= 5) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (count >= 3) return "bg-amber-100 text-amber-800 border-amber-200";
    if (count >= 1) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

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
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={handleGenerateAll}
            disabled={generating || generatingSign !== null}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
          >
            {generating ? "Generating..." : "Generate All 60"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Status Summary */}
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
                className={`h-full rounded-full transition-all ${status.complete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, (status.total / status.target) * 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-sm text-slate-500">สถานะ</div>
            <div className={`text-xl font-bold mt-1 ${status.complete ? 'text-emerald-600' : 'text-amber-600'}`}>
              {status.complete ? "✅ พร้อมใช้งาน" : "⚠️ ยังไม่ครบ"}
            </div>
          </div>
        </div>
      )}

      {/* Zodiac Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">รายละเอียดแต่ละราศี</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
          {ALL_SIGNS.map((sign) => {
            const count = status?.by_zodiac?.[sign] || 0;
            const isGenerating = generatingSign === sign;

            return (
              <div
                key={sign}
                className={`rounded-xl border p-4 ${getVariantColor(count)} transition-all`}
              >
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
                
                {/* Variant dots */}
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <div
                      key={v}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        v <= count
                          ? "bg-white/80 text-emerald-700"
                          : "bg-black/5 text-black/20"
                      }`}
                    >
                      {v}
                    </div>
                  ))}
                </div>

                {count < 5 && (
                  <button
                    onClick={() => handleGenerateSign(sign)}
                    disabled={isGenerating || generating}
                    className="w-full text-xs py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isGenerating ? "Generating..." : `Generate ${5 - count} missing`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generation Results */}
      {lastResult && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">ผลการ Generate ล่าสุด</h2>
          </div>
          <div className="p-6 space-y-4">
            {lastResult.results.generated.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-emerald-700 mb-2">
                  ✅ สร้างสำเร็จ ({lastResult.results.generated.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lastResult.results.generated.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">
                      {ZODIAC_EMOJI[item.sign]} {item.sign} v{item.variant}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {lastResult.results.skipped.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  ⏭️ ข้าม ({lastResult.results.skipped.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lastResult.results.skipped.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-xs">
                      {ZODIAC_EMOJI[item.sign]} {item.sign} - {item.reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lastResult.results.failed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-2">
                  ❌ ล้มเหลว ({lastResult.results.failed.length})
                </h3>
                <div className="space-y-1">
                  {lastResult.results.failed.map((item, i) => (
                    <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      {ZODIAC_EMOJI[item.sign]} {item.sign} v{item.variant}: {item.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-3">ระบบทำงานอย่างไร</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p><strong>Pool System:</strong> แทนที่จะสร้างคำทำนายรายคน สร้างแค่ 60 ชุด (5 × 12 ราศี) แล้วสุ่มให้ user</p>
          <p><strong>Lazy Generation:</strong> ถ้ายังไม่มี pool เมื่อ user คนแรกของราศีนั้นเข้ามา ระบบจะสร้าง 5 ชุดอัตโนมัติ</p>
          <p><strong>Admin Generate:</strong> กดปุ่ม &quot;Generate All 60&quot; เพื่อสร้างล่วงหน้า (user คนแรกไม่ต้องรอ)</p>
          <p><strong>Legacy Fallback:</strong> ถ้า pool system มีปัญหา จะ fallback ไปใช้ระบบเดิม (สร้างรายคน) อัตโนมัติ</p>
        </div>
      </div>
    </div>
  );
}
