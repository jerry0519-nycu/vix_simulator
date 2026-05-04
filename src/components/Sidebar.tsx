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
    if (key === 'rollYield') return val.toFixed(2);
    if (key === 'dailyVol' || key === 'leverage') return val.toFixed(1);
    return Math.round(val).toString();
  };

  const sliders = [
    { label: "模擬天數", key: "tradingDays", min: 100, max: 500, step: 1, unit: "天" },
    { label: "VIX 初始價格", key: "initialVix", min: 10, max: 50, step: 1, unit: "" },
    { label: "每日市場波動率", key: "dailyVol", min: 1, max: 10, step: 0.1, unit: "%" },
    { label: "每日轉倉收益率", key: "rollYield", min: -0.5, max: 0.5, step: 0.01, unit: "%" },
    { label: "槓桿倍數", key: "leverage", min: -5.0, max: 5.0, step: 0.5, unit: "x" },
    { label: "黑天鵝爆發天數", key: "blackSwanDay", min: 1, max: params.tradingDays, step: 1, unit: "天" },
    { label: "黑天鵝暴漲幅度", key: "blackSwanSpike", min: 50, max: 150, step: 1, unit: "%" },
    { label: "權利金提撥比例", key: "premiumCost", min: 5, max: 30, step: 1, unit: "%" },
  ];

  return (
    <aside className="w-80 glass-panel p-6 overflow-y-auto h-full flex flex-col flex-shrink-0">
      <h2 className="text-xl font-light tracking-wide mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-purple-400">
        參數控制面板
      </h2>
      <div className="space-y-6 flex-1">
        {sliders.map((s) => (
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
