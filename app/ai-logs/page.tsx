"use client";

import { useState, useEffect } from "react";
import { RefreshCw, FileText } from "lucide-react";
import api from "@/lib/api";

interface LogEntry {
  raw: string;
  timestamp: string;
  feature: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_thb: number;
  cost_usd: number;
}

export default function AiLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawLogs, setRawLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch the last 200 lines of logs
      const response = await api.get("/logs/ai-cost?lines=200");
      
      if (response.data && response.data.logs) {
        setRawLogs(response.data.logs);
        parseLogs(response.data.logs);
      }
    } catch (err: any) {
      console.error("Failed to fetch AI logs:", err);
      setError("ไม่สามารถดึงข้อมูล Log ได้: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const parseLogs = (lines: string[]) => {
    const parsedLogs: LogEntry[] = [];
    
    // Process from newest to oldest
    [...lines].reverse().forEach(line => {
      // Example line format:
      // 2026-03-12 23:25:10,123 - [feature_name] Model: model-name | Tokens: X In, Y Out (Total Z) | Cost: 0.00000 THB (0.00000 USD)
      try {
        if (!line.includes(" - [")) return;
        
        const [timeStr, logStr] = line.split(" - ", 2);
        
        // Extract feature name
        const featureMatch = logStr.match(/\[(.*?)\]/);
        const feature = featureMatch ? featureMatch[1] : "Unknown";
        
        // Extract model
        const modelMatch = logStr.match(/Model: (.*?) \|/);
        const model = modelMatch ? modelMatch[1].trim() : "Unknown";
        
        // Extract tokens
        const tokensMatch = logStr.match(/Tokens: (\d+) In, (\d+) Out \(Total (\d+)\)/);
        const tokens_in = tokensMatch ? parseInt(tokensMatch[1]) : 0;
        const tokens_out = tokensMatch ? parseInt(tokensMatch[2]) : 0;
        const total_tokens = tokensMatch ? parseInt(tokensMatch[3]) : 0;
        
        // Extract cost
        const costMatch = logStr.match(/Cost: ([\d.]+) THB \(([\d.]+) USD\)/);
        const cost_thb = costMatch ? parseFloat(costMatch[1]) : 0;
        const cost_usd = costMatch ? parseFloat(costMatch[2]) : 0;
        
        parsedLogs.push({
          raw: line,
          timestamp: timeStr,
          feature,
          model,
          tokens_in,
          tokens_out,
          total_tokens,
          cost_thb,
          cost_usd
        });
      } catch (e) {
        // If parsing fails, just skip this line for structured view
      }
    });
    
    setLogs(parsedLogs);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalCost = logs.reduce((sum, log) => sum + log.cost_thb, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Cost Logs</h1>
          <p className="text-gray-500">ตรวจสอบค่าใช้จ่าย API การสร้าง AI</p>
        </div>
        <button 
          onClick={fetchLogs} 
          disabled={loading} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรชข้อมูล
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">ค่าใช้จ่ายรวม (จาก Log ล่าสุด)</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCost.toFixed(4)} ฿</div>
          <p className="text-xs text-gray-500 mt-1">จาก {logs.length} รายการล่าสุด</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">ใช้งานบ่อยสุด</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 truncate">
            {logs.length > 0 ? (
              Object.entries(logs.reduce((acc, log) => {
                acc[log.feature] = (acc[log.feature] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0][0]
            ) : "-"}
          </div>
          <p className="text-xs text-gray-500 mt-1">ฟีเจอร์ที่มีการเรียกใช้มากที่สุด</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">โมเดลที่ใช้เยอะสุด</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 truncate">
            {logs.length > 0 ? (
              Object.entries(logs.reduce((acc, log) => {
                acc[log.model] = (acc[log.model] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0][0]
            ) : "-"}
          </div>
          <p className="text-xs text-gray-500 mt-1">Model ที่ใช้เยอะที่สุด</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            ประวัติการเรียกใช้งาน (AI Costs)
          </h3>
          <p className="text-sm text-gray-500 mt-1">แสดงรายการเรียกใช้ AI และราคาประเมินจากการคำนวณ Token (เรียงจากล่าสุด)</p>
        </div>
        
        <div className="p-0 overflow-x-auto">
          {loading && logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              ยังไม่มีข้อมูล Log หรือไฟล์ logs/ai_cost.log ยังไม่ถูกสร้าง
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">วัน/เวลา</th>
                  <th className="px-6 py-3 font-medium">ฟีเจอร์</th>
                  <th className="px-6 py-3 font-medium">โมเดล</th>
                  <th className="px-6 py-3 font-medium text-right">Tokens (In/Out)</th>
                  <th className="px-6 py-3 font-medium text-right">ต้นทุน (THB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.feature}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{log.model}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-600">{log.tokens_in}</span> / <span className="text-purple-600">{log.tokens_out}</span>
                      <div className="text-gray-400 mt-1 text-xs">รวม {log.total_tokens}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {log.cost_thb.toFixed(5)} ฿
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Raw logs for debugging */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Raw Logs (ดูข้อมูลดิบ)</h3>
        </div>
        <div className="p-6">
          <div className="bg-gray-900 text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
            {rawLogs.length === 0 ? "No raw logs available." : rawLogs.join('\n')}
          </div>
        </div>
      </div>
    </div>
  );
}
