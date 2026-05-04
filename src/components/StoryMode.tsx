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
  const [showTrad, setShowTrad] = useState(true); // 傳統對照組
  const [showInn, setShowInn] = useState(true);   // 創新反向 (-1x)
  const [showAlt, setShowAlt] = useState(false);  // 創新正向 (+1x)

  // 調整展演專用的 VIX 走勢（稍微提高回歸拉力，讓走勢在黑天鵝前更平穩，利於展示收租效果）
  const storyParams = useMemo(() => ({
    ...params,
    initialVix: 18, // 稍微調高起點，讓下跌空間更大
  }), [params]);

  const altParams = useMemo(() => ({
    ...storyParams,
    leverage: 1.0, // 固定為正向對照
  }), [storyParams]);

  const shortParams = useMemo(() => ({
    ...storyParams,
    leverage: -1.0, // 固定為反向對照
  }), [storyParams]);

  // 重新生成兩套數據，確保對照公平
  const { data: shortData } = useSimulation(shortParams, shocks);
  const { data: longData } = useSimulation(altParams, shocks);

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
          const step = phase === 2 ? 1 : Math.max(1, Math.floor(params.tradingDays / 100));
          return Math.min(prev + step, targetDay);
        });
      }, 35);
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

  const togglePause = () => setIsPaused(!isPaused);

  // 合併數據：確保傳統線會根據勾選的創新線自動顯示對應槓桿的傳統線
  const slicedData = useMemo(() => {
    const slice: any[] = [];
    for (let i = 0; i <= currentDay; i++) {
      const s = shortData[i];
      const l = longData[i];
      if (!s || !l) continue;

      slice.push({
        day: s.day,
        vix: s.vix,
        // 創新線
        innNav: s.innNav,    // 創新 -1x
        altInnNav: l.innNav, // 創新 +1x
        // 傳統線 (動態對接)
        // 如果同時勾選，傳統線顯示目前主槓桿方向。如果只勾正向，顯示正向傳統。
        tradNav: showAlt && !showInn ? l.tradNav : s.tradNav,
        altTradNav: l.tradNav // 備用
      });
    }
    return slice;
  }, [shortData, longData, currentDay, showInn, showAlt]);

  const renderNarrative = () => {
    switch (phase) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">模擬情境啟動</h3>
            <p className="text-slate-400 font-light text-sm leading-relaxed">
              觀察不同策略在極端市場下的存續表現。注意「補血引擎」如何在平時對抗正價差耗損。
            </p>
            <button onClick={handleNextPhase} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2">
              <Play size={20} /> 開始展演
            </button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-blue-400">階段一：平靜期的差異</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-emerald-400">創新正向 (+1x)</span> 藉由收租有效抵銷了部分正價差（紅線），使其淨值高於傳統型。<br/>
              <span className="text-purple-400">創新反向 (-1x)</span> 則因支付保費，增長略慢於傳統反向。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <button onClick={handleNextPhase} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                <AlertTriangle size={20} /> 觸發黑天鵝
              </button>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-red-500">階段二：暴漲與保護</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              VIX 暴漲！傳統反向瞬間清算。<br/>
              <span className="text-purple-400 font-bold">創新反向：</span> 階梯賠付啟動，成功存活。<br/>
              <span className="text-emerald-400 font-bold">創新正向：</span> 雖然封頂，但仍保有可觀獲利。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <button onClick={handleNextPhase} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                查看長期結果
              </button>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-teal-400">階段三：最終評價</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              全天候雙引擎系統大幅提升了 ETN 的「抗風險能力」與「長期存續價值」。
            </p>
            <button onClick={handleReset} className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold flex items-center justify-center gap-2">
              <RotateCcw size={20} /> 重新開始
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden max-h-[calc(100vh-180px)]">
      {/* 頂部控制列 */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] p-2 px-4 rounded-xl mb-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={showTrad} onChange={e=>setShowTrad(e.target.checked)} className="accent-red-500" />
              傳統型 (Benchmark)
            </label>
            <label className="flex items-center gap-2 text-xs text-purple-400 cursor-pointer">
              <input type="checkbox" checked={showInn} onChange={e=>setShowInn(e.target.checked)} className="accent-purple-500" />
              創新反向 (-1x)
            </label>
            <label className="flex items-center gap-2 text-xs text-emerald-400 cursor-pointer">
              <input type="checkbox" checked={showAlt} onChange={e=>setShowAlt(e.target.checked)} className="accent-emerald-500" />
              創新正向 (+1x)
            </label>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono flex gap-4 uppercase tracking-widest">
           <span>Initial VIX: 18</span>
           <span>Contango: {params.baseContango}%</span>
           <span className="text-purple-400">Day: {currentDay}</span>
        </div>
      </div>

      {/* 主內容區：自適應高度 */}
      <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
        <div className="col-span-1 flex flex-col">
          <GlassCard className="flex-1 flex flex-col justify-center p-6 border-l-4 border-l-purple-500">
            {renderNarrative()}
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${(currentDay / params.tradingDays) * 100}%` }}></div>
              </div>
              {isPlaying && (
                <button onClick={togglePause} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 uppercase tracking-widest">
                  {isPaused ? "繼續播放" : "暫停播放"}
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-3">
          <GlassCard className="h-full p-4 relative overflow-hidden">
            <StoryChart
              data={slicedData}
              maxDays={params.tradingDays}
              showTrad={showTrad}
              showInn={showInn}
              showAlt={showAlt}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
