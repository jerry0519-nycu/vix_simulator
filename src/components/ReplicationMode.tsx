"use client";

import React, { useState, useMemo } from "react";
import { GlassCard } from "./ui/GlassCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export function ReplicationMode() {
  const [baseVix, setBaseVix] = useState(15);

  // ── 計算做空 (Short) 的 Payoff ──
  const shortData = useMemo(() => {
    const data = [];
    const leverage = -1.0;
    const strike = baseVix * 1.5; // 150% 啟動保護
    const premium = 5; // 較高的保費讓圖表明顯
    for (let x = 5; x <= 60; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      const trad = vixReturn * leverage * 100;
      const protection = Math.max(0, (x - strike) / baseVix) * 1.0 * 100;
      const inn = trad + protection - premium;
      data.push({ vix: x, trad: Number(trad.toFixed(1)), inn: Number(inn.toFixed(1)), opt: Number((protection-premium).toFixed(1)) });
    }
    return data;
  }, [baseVix]);

  // ── 計算做多 (Long) 的 Payoff ──
  const longData = useMemo(() => {
    const data = [];
    const leverage = 1.0;
    const strike = baseVix * 1.3; // 130% 封頂
    const income = 10; // 較高的收租讓圖表明顯
    for (let x = 5; x <= 60; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      const trad = vixReturn * leverage * 100;
      const cappedVixReturn = Math.min(vixReturn, (strike - baseVix) / baseVix);
      const inn = (cappedVixReturn * leverage * 100) + income;
      data.push({ vix: x, trad: Number(trad.toFixed(1)), inn: Number(inn.toFixed(1)), opt: Number((inn - trad).toFixed(1)) });
    }
    return data;
  }, [baseVix]);

  const ChartBox = ({ title, data, color, type }: any) => (
    <GlassCard className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <h4 className={`text-lg font-semibold ${color}`}>{title}</h4>
        <p className="text-xs text-slate-500">
          {type === 'short' ? '買入 Call：犧牲小利換取黑天鵝時的無限保護' : '賣出 Call：犧牲大漲潛力換取平時的收租補貼'}
        </p>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="vix" type="number" domain={[5, 60]} stroke="#475569" fontSize={10} />
            <YAxis stroke="#475569" fontSize={10} />
            <Tooltip contentStyle={{backgroundColor:'#0f172a', border:'none', borderRadius:'8px'}} />
            <ReferenceLine y={0} stroke="#64748b" />
            <ReferenceLine x={baseVix} stroke="#3b82f6" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="trad" name="傳統型" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="inn" name="創新型" stroke={type === 'short' ? '#a855f7' : '#10b981'} strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 頂部說明 */}
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <GlassCard className="col-span-1 border-l-4 border-blue-500">
          <h3 className="text-sm font-bold text-slate-300 uppercase mb-2">全天候雙引擎定義</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            系統根據<span className="text-white font-mono">槓桿方向</span>自動切換組裝邏輯。左圖展示空頭避險，右圖展示多頭補血。
          </p>
        </GlassCard>
        <GlassCard className="col-span-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 block">基準 VIX 設定</span>
              <input type="range" min={10} max={30} value={baseVix} onChange={e=>setBaseVix(Number(e.target.value))} className="w-48 h-1.5 bg-slate-800 rounded-lg appearance-none accent-blue-500" />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 border-t-2 border-dashed border-red-400"></span> 傳統部位
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 bg-purple-500 rounded-sm"></span> 創新型 (做空)
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> 創新型 (做多)
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 雙圖並列區 */}
      <div className="flex-1 flex gap-6 min-h-0 mb-8">
        <ChartBox title="模組 A：階梯式尾部防禦 (Short VIX)" data={shortData} color="text-purple-400" type="short" />
        <ChartBox title="模組 B：掩護性買權補血 (Long VIX)" data={longData} color="text-emerald-400" type="long" />
      </div>
    </div>
  );
}
