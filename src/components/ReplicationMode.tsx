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

// 完全使用本頁自己的 local state，與全局 params 無關
export function ReplicationMode() {
  // ── 本頁專屬參數滑桿 ──
  const [baseVix, setBaseVix]       = useState(15);
  const [strikePct, setStrikePct]   = useState(150);
  const [premium, setPremium]       = useState(2);
  const [multiplier, setMultiplier] = useState(0.8);
  const leverage = -1.0; // 固定為 -1x 放空

  // ── 線條顯示勾選 ──
  const [showTrad,     setShowTrad]     = useState(true);
  const [showCall,     setShowCall]     = useState(true);
  const [showCombined, setShowCombined] = useState(true);

  // ── 計算 Payoff 資料（只依賴本頁四個 state）──
  const payoffData = useMemo(() => {
    const data = [];
    for (let x = 5; x <= 100; x += 1) {
      const vixReturn    = (x - baseVix) / baseVix;
      const tradReturn   = vixReturn * leverage * 100;                           // 傳統放空損益
      const strikePrice  = baseVix * (strikePct / 100);
      const callIntrinsic= Math.max(0, (x - strikePrice) / baseVix) * multiplier * 100;
      const isolatedCall = callIntrinsic - premium;                              // 選擇權損益
      const innReturn    = tradReturn + isolatedCall;                            // 組合損益
      data.push({
        vixPrice:     x,
        tradReturn:   Number(tradReturn.toFixed(2)),
        isolatedCall: Number(isolatedCall.toFixed(2)),
        innReturn:    Number(innReturn.toFixed(2)),
      });
    }
    return data;
  }, [baseVix, strikePct, premium, multiplier]);

  // ── 共用的 slider 樣式 helper ──
  const SliderRow = ({
    label, value, unit, color,
    min, max, step,
    onChange,
    hint,
  }: {
    label: string; value: number; unit: string; color: string;
    min: number; max: number; step: number;
    onChange: (v: number) => void;
    hint?: string;
  }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-semibold ${color}`}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800"
        style={{ accentColor: color.replace("text-", "") }}
      />
      {hint && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );

  return (
    <div className="flex flex-row gap-6 h-full min-h-0">

      {/* ─── 左側面板 ─── */}
      <div className="flex flex-col gap-4 w-80 flex-shrink-0 h-full min-h-0 overflow-y-auto custom-scrollbar pr-1">

        {/* 商品解構說明 */}
        <GlassCard className="border-l-4 border-l-indigo-500">
          <h3 className="text-xl font-light text-indigo-300 mb-3">
            商品解構與複製 (Replication)
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed font-light mb-4">
            要創造出「反向 VIX ETN」，可以直接使用模組化合約來「組裝」：<br /><br />
            <span className="text-red-400 font-medium">● 傳統 ETN</span> = 現金部位 + <strong className="text-red-300">放空 VIX 期貨</strong><br />
            <span className="text-teal-400 font-medium">● 創新 ETN</span> = 現金部位 + 放空 VIX 期貨 + <strong className="text-teal-300">買入極度價外買權 (Deep OTM Call)</strong>
          </p>
          <div className="p-3 bg-black/40 rounded border border-indigo-500/20 text-xs text-slate-400">
            <strong>核心概念：</strong> 選擇權就像「巨災保險」。平時繳保費使利潤微幅下滑；當 VIX 暴漲突破履約價時，無限獲利完美抵銷期貨的無限虧損。
          </div>
        </GlassCard>

        {/* 參數滑桿 */}
        <GlassCard className="border-l-4 border-l-purple-500">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            參數調整
          </h4>
          <div className="space-y-5">
            <SliderRow
              label="基準 VIX (Initial VIX)"
              value={baseVix} unit="" color="text-blue-300"
              min={10} max={50} step={1}
              onChange={setBaseVix}
              hint="圖表的 VIX 起始基準點"
            />
            <SliderRow
              label="啟動保護門檻 (Strike)"
              value={strikePct} unit="%" color="text-indigo-300"
              min={110} max={300} step={10}
              onChange={setStrikePct}
              hint={`VIX 超過 ${(baseVix * strikePct / 100).toFixed(1)} 時開始理賠`}
            />
            <SliderRow
              label="保險費成本 (Premium)"
              value={premium} unit="%" color="text-purple-300"
              min={0} max={20} step={0.5}
              onChange={setPremium}
              hint="平時每期支付的固定成本"
            />
            <SliderRow
              label="Gamma 賠付乘數"
              value={multiplier} unit="x" color="text-teal-300"
              min={0.5} max={2.0} step={0.1}
              onChange={setMultiplier}
              hint="選擇權觸發後的理賠放大倍數"
            />
          </div>
        </GlassCard>

        {/* 線條勾選 */}
        <GlassCard className="border-l-4 border-l-slate-500">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            圖表線條顯示
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox" checked={showTrad}
                onChange={e => setShowTrad(e.target.checked)}
                className="w-4 h-4 rounded accent-red-500 cursor-pointer"
              />
              <span className="flex items-center gap-2 text-sm">
                <span className="inline-block w-6 border-t-2 border-dashed border-red-400" />
                <span className="text-red-300 group-hover:text-red-200 transition-colors">
                  基礎放空部位（傳統 ETN）
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox" checked={showCall}
                onChange={e => setShowCall(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
              />
              <span className="flex items-center gap-2 text-sm">
                <span className="inline-block w-6 border-t-2 border-dashed border-violet-400" />
                <span className="text-violet-300 group-hover:text-violet-200 transition-colors">
                  買入選擇權（保險部位）
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox" checked={showCombined}
                onChange={e => setShowCombined(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span className="flex items-center gap-2 text-sm">
                <span className="inline-block w-6 border-t-4 border-emerald-400" />
                <span className="text-emerald-300 group-hover:text-emerald-200 transition-colors">
                  組合總損益（創新避險 ETN）
                </span>
              </span>
            </label>
          </div>
        </GlassCard>

      </div>

      {/* ─── 右側：到期損益圖 ─── */}
      <GlassCard className="flex-1 min-h-0 flex flex-col">
        <h4 className="text-lg font-light text-slate-200 mb-1 flex-shrink-0">
          到期損益圖 (Payoff Diagram)
        </h4>
        <p className="text-xs text-slate-500 mb-4 flex-shrink-0">
          基準 VIX = <span className="text-blue-300 font-mono">{baseVix}</span>
          ｜履約價 = <span className="text-indigo-300 font-mono">{(baseVix * strikePct / 100).toFixed(1)}</span>
          ｜保費 = <span className="text-purple-300 font-mono">-{premium}%</span>
          ｜Gamma = <span className="text-teal-300 font-mono">{multiplier}x</span>
        </p>

        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payoffData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="vixPrice"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  stroke="#64748b"
                  tick={{ fill: '#64748b' }}
                  label={{ value: '結算時的 VIX 指數', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b' }}
                  label={{ value: '總損益 (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  labelFormatter={(label) => `VIX 結算價: ${label}`}
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />

                {/* 0% 盈虧線 */}
                <ReferenceLine y={0} stroke="#475569" strokeWidth={2} opacity={0.5} />
                {/* 起始 VIX 參考線 */}
                <ReferenceLine
                  x={baseVix}
                  stroke="#3b82f6" strokeDasharray="3 3"
                  label={{ value: '起始 VIX', position: 'top', fill: '#3b82f6', fontSize: 12 }}
                />
                {/* 履約價參考線 */}
                <ReferenceLine
                  x={baseVix * (strikePct / 100)}
                  stroke="#a855f7" strokeDasharray="3 3"
                  label={{ value: '履約價 (Strike)', position: 'top', fill: '#a855f7', fontSize: 12 }}
                />

                {showTrad && (
                  <Line
                    type="monotone" dataKey="tradReturn"
                    name="1. 基礎放空部位 (傳統 ETN)"
                    stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5"
                  />
                )}
                {showCall && (
                  <Line
                    type="monotone" dataKey="isolatedCall"
                    name="2. 買入選擇權 (保險部位)"
                    stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="5 5"
                  />
                )}
                {showCombined && (
                  <Line
                    type="monotone" dataKey="innReturn"
                    name="3. 組合總損益 (創新避險 ETN)"
                    stroke="#10b981" strokeWidth={4} dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlassCard>

    </div>
  );
}
