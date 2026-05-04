"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SimulationParams, DailyData, useSimulation } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { StoryChart } from "./charts/StoryChart";
import { Play, Pause, RotateCcw, AlertTriangle, ZoomIn, ZoomOut, TrendingUp, ShieldAlert } from "lucide-react";

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
  const [isZoomed, setIsZoomed] = useState(false);

  const [showTradShort, setShowTradShort] = useState(true);
  const [showTradLong, setShowTradLong] = useState(false);
  const [showInnShort, setShowInnShort] = useState(true);
  const [showInnLong, setShowInnLong] = useState(false);

  const storyParams = useMemo(() => ({ ...params, initialVix: 18 }), [params]);
  const shortParams = useMemo(() => ({ ...storyParams, leverage: -1.0 }), [storyParams]);
  const longParams = useMemo(() => ({ ...storyParams, leverage: 1.0 }), [storyParams]);

  const { data: shortData, stats: shortStats } = useSimulation(shortParams, shocks);
  const { data: longData, stats: longStats } = useSimulation(longParams, shocks);

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
            <h3 className="text-xl font-bold text-slate-100">全天候雙引擎模擬</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              點擊啟動按鈕，我們將帶您遍覽 VIX 商品在平穩期與災難期的真實表現。
            </p>
            <button onClick={handleNextPhase} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all">
              開始展演
            </button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">階段一：平靜期耗損</h3>
              <p className="text-slate-300 text-xs leading-relaxed italic">
                黑天鵝發生前（Day 0 - {params.blackSwanDay}）之績效統計：
              </p>
            </div>

            <div className="space-y-4">
              {/* 反向對比數據 */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                   <ShieldAlert size={14} className="text-purple-400" />
                   <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">反向策略 (-1x) 保費代價</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <p className="text-lg font-mono font-bold text-white">{shortStats?.preSwanTradWinRatio.toFixed(1)}%</p>
                      <p className="text-[9px] text-slate-500 uppercase">傳統贏過創新天數</p>
                   </div>
                   <div>
                      <p className="text-lg font-mono font-bold text-white">-{shortStats?.preSwanTradOutperformanceAvg.toFixed(1)}%</p>
                      <p className="text-[9px] text-slate-500 uppercase">平均保費成本</p>
                   </div>
                </div>
              </div>

              {/* 正向對比數據 */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                   <TrendingUp size={14} className="text-emerald-400" />
                   <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">正向策略 (+1x) 補血收益</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <p className="text-lg font-mono font-bold text-white">{longStats?.preSwanInnWinRatio.toFixed(1)}%</p>
                      <p className="text-[9px] text-slate-500 uppercase">創新贏過傳統天數</p>
                   </div>
                   <div>
                      <p className="text-lg font-mono font-bold text-white">+{longStats?.preSwanInnOutperformanceAvg.toFixed(1)}%</p>
                      <p className="text-[9px] text-slate-500 uppercase">平均領先幅度</p>
                   </div>
                </div>
              </div>
            </div>

            {!isPlaying && currentDay === targetDay && (
              <button onClick={handleNextPhase} className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-red-600/20">
                <AlertTriangle size={18} className="inline mr-2" /> 觸發黑天鵝
              </button>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-red-500">階段二：暴漲與生存</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              VIX 暴漲！傳統反向產品在此刻會因跌幅超過 100% 而清算歸零。<br/><br/>
              但透過 **槓桿連動對沖**，創新策略成功存活。
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
              全天候雙引擎系統大幅提升了 ETN 的存續價值，真正實現了「平時補血、災難避險」。
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
      {/* 控制列 */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] p-3 px-5 rounded-xl mb-4 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 border-r border-white/10 pr-6">
            <label className="flex items-center gap-2 text-[11px] text-rose-400/60 cursor-pointer">
              <input type="checkbox" checked={showTradShort} onChange={e=>setShowTradShort(e.target.checked)} className="accent-rose-500" />
              傳統反向
            </label>
            <label className="flex items-center gap-2 text-[11px] text-purple-400 cursor-pointer">
              <input type="checkbox" checked={showInnShort} onChange={e=>setShowInnShort(e.target.checked)} className="accent-purple-500" />
              創新反向
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[11px] text-red-500 cursor-pointer">
              <input type="checkbox" checked={showTradLong} onChange={e=>setShowTradLong(e.target.checked)} className="accent-red-500" />
              傳統正向
            </label>
            <label className="flex items-center gap-2 text-[11px] text-emerald-400 cursor-pointer">
              <input type="checkbox" checked={showInnLong} onChange={e=>setShowInnLong(e.target.checked)} className="accent-emerald-500" />
              創新正向
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsZoomed(!isZoomed)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isZoomed ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
            {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />} Zoom
          </button>
          <div className="text-[10px] text-slate-600 font-mono">DAY: {currentDay}</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
        <div className="col-span-1">
          <GlassCard className="h-full flex flex-col justify-start p-6 border-l-4 border-l-purple-500 overflow-y-auto custom-scrollbar">
            {renderNarrative()}
            <div className="mt-8 pt-6 border-t border-white/5 shrink-0">
              {isPlaying && (
                <button onClick={togglePause} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 uppercase tracking-widest hover:text-white transition-colors">
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
              isZoomed={isZoomed}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
