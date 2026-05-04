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
  // ── 本頁專屬參數 ──
  const [baseVix, setBaseVix]       = useState(15);
  const [leverage, setLeverage]     = useState(-1.0); // 可調整槓桿
  
  // 做空專屬參數
  const [strikePctShort, setStrikePctShort] = useState(150);
  const [premiumShort, setPremiumShort]     = useState(2);
  const [multiplier, setMultiplier]         = useState(1.0);

  // 做多專屬參數
  const [strikePctLong, setStrikePctLong]   = useState(130);
  const [premiumLong, setPremiumLong]       = useState(5);

  const isShort = leverage < 0;
  const isLong = leverage > 0;

  // ── 計算 Payoff 資料 ──
  const payoffData = useMemo(() => {
    const data = [];
    for (let x = 5; x <= 60; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      const tradReturn = vixReturn * leverage * 100;
      
      let optionReturn = 0;
      let innReturn = 0;

      if (isShort) {
        // 模組 A：買入 Call (保護)
        const strikePrice = baseVix * (strikePctShort / 100);
        const callIntrinsic = Math.max(0, (x - strikePrice) / baseVix) * multiplier * 100;
        optionReturn = callIntrinsic - premiumShort;
        innReturn = tradReturn + optionReturn;
      } else if (isLong) {
        // 模組 B：賣出 Call (Covered Call)
        const strikePrice = baseVix * (strikePctLong / 100);
        // 賣出權利金收益
        const yieldIncome = premiumLong;
        // 超過履約價的漲幅被讓渡 (封頂)
        const cappedVixReturn = Math.min(vixReturn, (strikePrice - baseVix) / baseVix);
        innReturn = (cappedVixReturn * leverage * 100) + yieldIncome;
        optionReturn = innReturn - tradReturn;
      } else {
        innReturn = tradReturn;
      }

      data.push({
        vixPrice: x,
        tradReturn: Number(tradReturn.toFixed(2)),
        optionReturn: Number(optionReturn.toFixed(2)),
        innReturn: Number(innReturn.toFixed(2)),
      });
    }
    return data;
  }, [baseVix, leverage, strikePctShort, premiumShort, multiplier, strikePctLong, premiumLong]);

  const SliderRow = ({ label, value, unit, color, min, max, step, onChange, hint }: any) => (
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
      {hint && <p className="text-[11px] text-slate-600 leading-tight">{hint}</p>}
    </div>
  );

  return (
    <div className="flex flex-row gap-6 h-full min-h-0">
      {/* 左側面板 */}
      <div className="flex flex-col gap-4 w-80 flex-shrink-0 h-full min-h-0 overflow-y-auto custom-scrollbar pr-1">
        
        {/* 動態解構說明 */}
        <GlassCard className={`border-l-4 ${isShort ? 'border-l-indigo-500' : 'border-l-emerald-500'}`}>
          <h3 className={`text-xl font-light mb-3 ${isShort ? 'text-indigo-300' : 'text-emerald-300'}`}>
            {isShort ? "階梯式尾部防禦解構" : "掩護性買權補血解構"}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed font-light mb-4">
            {isShort ? (
              <>
                針對<span className="text-red-400 font-medium font-mono">做空模式</span>：<br/>
                利用轉倉收益買入 <strong>OTM Call</strong>。當 VIX 暴漲時，選擇權的 Gamma 爆發能完美抵銷期貨空單的無限損失。
              </>
            ) : (
              <>
                針對<span className="text-blue-400 font-medium font-mono">做多模式</span>：<br/>
                <strong>賣出 OTM Call</strong> 收取權利金。這筆額外收入能有效緩解做多 VIX 時極為嚴重的轉倉耗損（正價差）。
              </>
            )}
          </p>
          <div className="p-3 bg-black/40 rounded border border-white/5 text-[12px] text-slate-400">
            {isShort 
              ? "價外買權 = 巨災保險。平時繳費使利潤微降；暴漲時無限獲利抵銷無限虧損。"
              : "賣出買權 = 資產收租。平時收租補貼正價差耗損；大漲時利潤封頂於履約價。"
            }
          </div>
        </GlassCard>

        {/* 核心參數 */}
        <GlassCard className="border-l-4 border-l-blue-500">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">核心策略參數</h4>
          <div className="space-y-5">
            <SliderRow
              label="槓桿倍數 (Leverage)"
              value={leverage} unit="x" color="text-yellow-400"
              min={-2} max={2} step={0.5}
              onChange={setLeverage}
            />
            <SliderRow
              label="基準 VIX"
              value={baseVix} unit="" color="text-blue-300"
              min={10} max={40} step={1}
              onChange={setBaseVix}
            />
          </div>
        </GlassCard>

        {/* 避險引擎參數 */}
        <GlassCard className={`border-l-4 ${isShort ? 'border-l-indigo-500' : 'border-l-emerald-500'}`}>
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            {isShort ? "防禦引擎細節" : "收租引擎細節"}
          </h4>
          <div className="space-y-5">
            {isShort ? (
              <>
                <SliderRow
                  label="保護啟動門檻 (Strike)"
                  value={strikePctShort} unit="%" color="text-indigo-300"
                  min={110} max={250} step={10}
                  onChange={setStrikePctShort}
                  hint={`VIX 超過 ${(baseVix * strikePctShort / 100).toFixed(1)} 時開始理賠`}
                />
                <SliderRow
                  label="保費提撥 (Premium)"
                  value={premiumShort} unit="%" color="text-purple-300"
                  min={1} max={15} step={0.5}
                  onChange={setPremiumShort}
                />
                <SliderRow
                  label="Gamma 賠付倍數"
                  value={multiplier} unit="x" color="text-teal-300"
                  min={0.5} max={2.0} step={0.1}
                  onChange={setMultiplier}
                />
              </>
            ) : (
              <>
                <SliderRow
                  label="利潤封頂門檻 (Strike)"
                  value={strikePctLong} unit="%" color="text-emerald-300"
                  min={110} max={200} step={5}
                  onChange={setStrikePctLong}
                  hint={`VIX 高於 ${(baseVix * strikePctLong / 100).toFixed(1)} 時利潤停止增長`}
                />
                <SliderRow
                  label="權利金收租率 (Yield)"
                  value={premiumLong} unit="%" color="text-teal-300"
                  min={2} max={20} step={1}
                  onChange={setPremiumLong}
                  hint="每月/期預計收取的權利金補助"
                />
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {/* 右側：損益圖 */}
      <GlassCard className="flex-1 min-h-0 flex flex-col">
        <h4 className="text-lg font-light text-slate-200 mb-1">到期損益圖 (Payoff Diagram)</h4>
        <p className="text-xs text-slate-500 mb-4">
          橫軸代表 VIX 結算價格，縱軸代表該策略的總損益百分比。
        </p>

        <div className="flex-1 relative min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={payoffData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="vixPrice" type="number" domain={[5, 60]} stroke="#64748b" tick={{fill:'#64748b'}} />
              <YAxis stroke="#64748b" tick={{fill:'#64748b'}} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: '#334155' }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
              <ReferenceLine x={baseVix} stroke="#3b82f6" strokeDasharray="3 3" label={{value:'起始VIX', fill:'#3b82f6', fontSize:12}} />
              
              <Line type="monotone" dataKey="tradReturn" name="1. 傳統部位" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="optionReturn" name={isShort ? "2. 保險部位 (買入)" : "2. 權利金補貼 (賣出)"} stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="innReturn" name="3. 創新避險 ETN (組合)" stroke="#10b981" strokeWidth={4} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
