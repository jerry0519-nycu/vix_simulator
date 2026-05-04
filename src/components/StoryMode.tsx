"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SimulationParams, DailyData, useSimulation } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { StoryChart } from "./charts/StoryChart";
import { Play, Pause, ChevronRight, RotateCcw, AlertTriangle, Settings2 } from "lucide-react";

type StoryModeProps = {
  data: DailyData[];
  params: SimulationParams;
  shocks: number[];
};

export function StoryMode({ data, params, shocks }: StoryModeProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  // 控制四條線路顯示
  const [showTradShort, setShowTradShort] = useState(true); // 傳統反向
  const [showTradLong, setShowTradLong] = useState(false); // 傳統正向
  const [showInnShort, setShowInnShort] = useState(true);  // 創新反向
  const [showInnLong, setShowInnLong] = useState(false);   // 創新正向

  // 展演專用參數：固定正負 1 倍槓桿
  const storyParams = useMemo(() => ({ ...params, initialVix: 18 }), [params]);
  const shortParams = useMemo(() => ({ ...storyParams, leverage: -1.0 }), [storyParams]);
  const longParams = useMemo(() => ({ ...storyParams, leverage: 1.0 }), [storyParams]);

  const { data: shortData } = useSimulation(shortParams, shocks);
  const { data: longData } = useSimulation(longParams, shocks);

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
          const step = phase === 2 ? 1 : Math.max(1, Math.floor(params.tradingDays / 120));
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

  const togglePause = () => setIsPaused(!isPaused);

  const slicedData = useMemo(() => {
    const slice: any[] = [];
    for (let i = 0; i <= currentDay; i++) {
      const s = shortData[i];
      const l = longData[i];
      if (!s || !l) continue;
      slice.push({
        day: s.day,
        vix: s.vix,
        tradShort: s.tradNav,
        innShort: s.innNav,
        tradLong: l.tradNav,
        innLong: l.innNav,
      });
    }
    return slice;
  }, [shortData, longData, currentDay]);

  const renderNarrative = () => {
    switch (phase) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100">模擬啟動</h3>
            <p className="text-slate-400 text-sm leading-relaxed">準備好對比「傳統 vs 創新」以及「做空 vs 做多」的四象限差異了嗎？</p>
            <button onClick={handleNextPhase} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all">
              開始展演
            </button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-blue-400">階段一：平靜期的差異</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-emerald-400">創新正向</span> 靠收租顯著優於 <span className="text-red-400">傳統正向</span>。<br/>
              <span className="text-purple-400">創新反向</span> 因保費略遜於 <span className="text-rose-400 text-opacity-60">傳統反向</span>。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <button onClick={handleNextPhase} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold">
                <AlertTriangle size={20} className="inline mr-2" /> 觸發黑天鵝
              </button>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-red-500">階段二：暴漲與存續</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              VIX 暴漲！傳統反向歸零。<br/>
              <span className="text-purple-400 font-bold">創新反向</span> 成功存活。<br/>
              <span className="text-emerald-400 font-bold">創新正向</span> 則大幅獲利。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <button onClick={handleNextPhase} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold">
                下一步
              </button>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-teal-400">模擬總結</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              創新引擎為兩類商品都帶來了更好的風險調整後收益。
            </p>
            <button onClick={handleReset} className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold">
              重新開始
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden max-h-[calc(100vh-160px)]">
      {/* 四選一控制列 */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] p-3 px-5 rounded-xl mb-4 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 border-r border-white/10 pr-6">
            <label className="flex items-center gap-2 text-xs text-rose-400/60 cursor-pointer">
              <input type="checkbox" checked={showTradShort} onChange={e=>setShowTradShort(e.target.checked)} className="accent-rose-500" />
              傳統反向 (-1x)
            </label>
            <label className="flex items-center gap-2 text-xs text-purple-400 cursor-pointer">
              <input type="checkbox" checked={showInnShort} onChange={e=>setShowInnShort(e.target.checked)} className="accent-purple-500" />
              創新反向 (-1x)
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-red-500 cursor-pointer">
              <input type="checkbox" checked={showTradLong} onChange={e=>setShowTradLong(e.target.checked)} className="accent-red-500" />
              傳統正向 (+1x)
            </label>
            <label className="flex items-center gap-2 text-xs text-emerald-400 cursor-pointer">
              <input type="checkbox" checked={showInnLong} onChange={e=>setShowInnLong(e.target.checked)} className="accent-emerald-500" />
              創新正向 (+1x)
            </label>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
           Day: {currentDay} / {params.tradingDays}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
        <div className="col-span-1">
          <GlassCard className="h-full flex flex-col justify-center p-6 border-l-4 border-l-purple-500">
            {renderNarrative()}
            <div className="mt-8 pt-6 border-t border-white/5 shrink-0">
              {isPlaying && (
                <button onClick={togglePause} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 uppercase tracking-widest">
                  {isPaused ? "RESUME" : "PAUSE"}
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-3">
          <GlassCard className="h-full p-2 relative overflow-hidden">
            <StoryChart
              data={slicedData}
              maxDays={params.tradingDays}
              showTradShort={showTradShort}
              showTradLong={showTradLong}
              showInnShort={showInnShort}
              showInnLong={showInnLong}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
