"use client";

import React from "react";
import { SimulationParams } from "@/hooks/useSimulation";

type SidebarProps = {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  onRegenerate: () => void;
};

export function Sidebar({ params, setParams, onRegenerate }: SidebarProps) {
  const handleChange = (key: keyof SimulationParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const formatValue = (key: string, val: number) => {
    if (key === 'baseContango') return val.toFixed(2);
    if (key === 'dailyVol' || key === 'leverage') return val.toFixed(1);
    return Math.round(val).toString();
  };

  // 基礎共用滑桿
  const baseSliders = [
    { label: "模擬天數", key: "tradingDays", min: 100, max: 500, step: 1, unit: "天" },
    { label: "VIX 初始價格", key: "initialVix", min: 10, max: 50, step: 1, unit: "" },
    { label: "每日市場波動率", key: "dailyVol", min: 1, max: 10, step: 0.1, unit: "%" },
    { label: "基礎正價差水準", key: "baseContango", min: 0.05, max: 0.30, step: 0.01, unit: "%/天" },
    { label: "槓桿倍數", key: "leverage", min: -2.0, max: 2.0, step: 0.5, unit: "x" },
    { label: "黑天鵝爆發天數", key: "blackSwanDay", min: 1, max: params.tradingDays, step: 1, unit: "天" },
    { label: "黑天鵝暴漲幅度", key: "blackSwanSpike", min: 50, max: 150, step: 1, unit: "%" },
  ];

  // 根據槓桿方向動態切換的滑桿
  const isShort = params.leverage < 0;
  const isLong = params.leverage > 0;

  return (
    <aside className="w-80 glass-panel p-6 overflow-y-auto h-full flex flex-col flex-shrink-0">
      <h2 className="text-xl font-light tracking-wide mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-purple-400">
        參數控制面板
      </h2>
      <div className="space-y-6 flex-1">
        {baseSliders.map((s) => (
          <div key={s.key} className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium text-slate-300">
              <label>{s.label}</label>
              <span className="text-teal-300 font-mono">
                {formatValue(s.key, Number(params[s.key as keyof SimulationParams]))}
                {s.unit}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={params[s.key as keyof SimulationParams]}
              onChange={(e) => handleChange(s.key as keyof SimulationParams, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300 transition-colors"
            />
          </div>
        ))}

        {/* ── 動態避險參數區塊 ── */}
        {(isShort || isLong) && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${isShort ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`}></span>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                {isShort ? '尾部防禦引擎' : '掩護性買權引擎'}
              </span>
            </div>

            {isShort && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium text-slate-300">
                  <label>尾部保費提撥比例</label>
                  <span className="text-red-300 font-mono">{params.tailRiskPremium}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={params.tailRiskPremium}
                  onChange={(e) => handleChange('tailRiskPremium', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400 hover:accent-red-300 transition-colors"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  從轉倉收益中提撥此比例購買極度價外買權，VIX 越高保費越貴。觸發階梯式賠付：30%→0.3x、50%→0.6x、80%→1.0x。
                </p>
              </div>
            )}

            {isLong && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium text-slate-300">
                  <label>掩護性買權收租率</label>
                  <span className="text-emerald-300 font-mono">{params.coveredCallYield}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={params.coveredCallYield}
                  onChange={(e) => handleChange('coveredCallYield', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-colors"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  賣出價外買權收取權利金以補貼正價差耗損。代價：VIX 暴漲超過 30% 時，漲幅封頂於 30%。
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onRegenerate}
        className="mt-8 w-full py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-sm tracking-widest font-semibold hover:bg-purple-500/30 hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
        重新產生隨機走勢
      </button>
    </aside>
  );
}
