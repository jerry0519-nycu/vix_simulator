"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SimulationParams, DailyData, useSimulation } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { StoryChart } from "./charts/StoryChart";
import { Play, Pause, ChevronRight, RotateCcw, AlertTriangle, Settings2, ChevronDown, ChevronUp } from "lucide-react";

type StoryModeProps = {
  data: DailyData[];
  params: SimulationParams;
  shocks: number[];
};

export type ExtendedDailyData = DailyData & {
  altTradNav?: number;
  altInnNav?: number;
};

export function StoryMode({ data, params, shocks }: StoryModeProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [showMath, setShowMath] = useState(false);

  // 控制哪些線條顯示
  const [showTrad, setShowTrad] = useState(false); // 預設不勾選
  const [showInn, setShowInn] = useState(true);   // 預設勾選 (創新 -1x)
  const [showAlt, setShowAlt] = useState(false);  // 預設不勾選 (創新 +1x)

  // 對照組參數：預設為與主參數相反的槓桿
  const altParams = useMemo(() => ({
    ...params,
    leverage: params.leverage < 0 ? 1.0 : -1.0, // 如果主選單是 -1, 這裡就是 +1
  }), [params]);

  const { data: rawAltData } = useSimulation(altParams, shocks);

  const isShort = params.leverage < 0;

  const targetDay = useMemo(() => {
    if (phase === 0) return 0;
    if (phase === 1) return params.blackSwanDay - 1;
    if (phase === 2) return params.blackSwanDay;
    return params.tradingDays;
  }, [phase, params.blackSwanDay, params.tradingDays]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isPaused) {
      interval = setInterval(() => {
        setCurrentDay((prev) => {
          if (prev >= targetDay) {
            setIsPlaying(false);
            return prev;
          }
          const step = phase === 2 ? 1 : Math.max(1, Math.floor(params.tradingDays / 80));
          return Math.min(prev + step, targetDay);
        });
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, targetDay, phase, params.tradingDays]);

  const handleNextPhase = () => {
    setPhase((p) => Math.min(p + 1, 3) as any);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handleReset = () => {
    setPhase(0);
    setCurrentDay(0);
    setIsPlaying(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const slicedData = useMemo(() => {
    const slice: ExtendedDailyData[] = [];
    for (let i = 0; i <= currentDay; i++) {
      const baseObj = data[i];
      if (!baseObj) continue;
      const merged: ExtendedDailyData = { ...baseObj };
      if (rawAltData[i]) {
        merged.altInnNav = rawAltData[i].innNav;
      }
      slice.push(merged);
    }
    return slice;
  }, [data, rawAltData, currentDay]);

  const renderNarrative = () => {
    switch (phase) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">模擬情境啟動</h3>
            <p className="text-slate-400 font-light text-sm leading-relaxed">
              點擊下方按鈕開始模擬這段金融旅程。我們將同步觀察不同策略在極端市場下的存續表現。
            </p>
            <button onClick={handleNextPhase} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2">
              <Play size={20} /> 展開展演
            </button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-blue-400">階段一：平靜期的耗損</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              觀察 <span className="text-teal-400">創新 -1x</span> 提撥保費後的緩步成長，以及 <span className="text-emerald-400">創新 +1x</span> 靠著收租補貼減緩正價差的慢性自殺。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <button onClick={handleNextPhase} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                <AlertTriangle size={20} /> 發生黑天鵝
              </button>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-red-500">階段二：極端暴漲與生存</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              VIX 暴漲！傳統型瞬間清算。<br/>
              <span className="text-teal-400 font-bold">創新 -1x：</span> 保護傘啟動，阻止歸零。<br/>
              <span className="text-emerald-400 font-bold">創新 +1x：</span> 獲利亮眼，但受限於 30% 封頂。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <button onClick={handleNextPhase} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                下一步
              </button>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-teal-400">階段三：模擬總結</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              在雙引擎系統下，無論槓桿方向如何，創新型產品都展現了更強的長期存續能力與風險調整後報酬。
            </p>
            <button onClick={handleReset} className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold flex items-center justify-center gap-2">
              <RotateCcw size={20} /> 重頭開始
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 緊湊型參數摘要 */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] p-2 px-4 rounded-xl mb-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={showTrad} onChange={e=>setShowTrad(e.target.checked)} className="accent-red-500" />
              傳統型 (Benchmark)
            </label>
            <label className="flex items-center gap-2 text-xs text-teal-400 cursor-pointer">
              <input type="checkbox" checked={showInn} onChange={e=>setShowInn(e.target.checked)} className="accent-teal-500" />
              創新反向 (-1x)
            </label>
            <label className="flex items-center gap-2 text-xs text-emerald-400 cursor-pointer">
              <input type="checkbox" checked={showAlt} onChange={e=>setShowAlt(e.target.checked)} className="accent-emerald-500" />
              創新正向 (+1x)
            </label>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="text-[10px] text-slate-500 font-mono flex gap-3">
            <span>START VIX: {params.initialVix}</span>
            <span>CONTANGO: {params.baseContango}%</span>
            <span>DAY: {currentDay} / {params.tradingDays}</span>
          </div>
        </div>
        <button onClick={() => setShowMath(!showMath)} className="text-[10px] text-purple-400 flex items-center gap-1 uppercase tracking-widest">
          {showMath ? "Hide Logic" : "Show Logic"} <Settings2 size={12} />
        </button>
      </div>

      {showMath && (
        <div className="mb-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-[11px] text-slate-300 animate-in fade-in slide-in-from-top-1">
          <strong>槓桿連動定價邏輯：</strong> 保費與賠付比率均依據 |Leverage| 進行等比例縮放。-2.0x 槓桿將獲得 2.0x 的 Gamma 保護。
        </div>
      )}

      {/* 主展演區：拉長高度 */}
      <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
        <div className="col-span-1 flex flex-col gap-4">
          <GlassCard className="flex-1 flex flex-col justify-center p-6 border-l-4 border-l-purple-500">
            {renderNarrative()}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${(currentDay / params.tradingDays) * 100}%` }}></div>
              </div>
              {isPlaying && (
                <button onClick={togglePause} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                  {isPaused ? "RESUME" : "PAUSE"}
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-3">
          <GlassCard className="h-full p-4 relative overflow-hidden">
            <StoryChart
              data={slicedData as any}
              maxDays={params.tradingDays}
              showTrad={showTrad}
              showInn={showInn}
              showAlt={showAlt}
              isZoomed={false}
              zoomMin={''}
              zoomMax={''}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
