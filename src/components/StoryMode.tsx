"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SimulationParams, DailyData, useSimulation } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { StoryChart } from "./charts/StoryChart";
import { Play, Pause, ChevronRight, RotateCcw, AlertTriangle, Settings2, ShieldCheck, Zap } from "lucide-react";

type StoryModeProps = {
  data: DailyData[]; // 這是從外層傳入的傳統數據 (leverage 取決於 params)
  params: SimulationParams;
  shocks: number[];
};

export function StoryMode({ data, params, shocks }: StoryModeProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  // 控制哪些線條要顯示
  const [showTrad, setShowTrad] = useState(true);
  const [showInnNeg1, setShowInnNeg1] = useState(true); // 預設勾選 -1x
  const [showInnPos1, setShowInnPos1] = useState(false);

  // 1. 強制生成 -1x 創新的數據
  const paramsNeg1 = useMemo(() => ({ ...params, leverage: -1.0 }), [params]);
  const { data: dataNeg1 } = useSimulation(paramsNeg1, shocks);

  // 2. 強制生成 +1x 創新的數據
  const paramsPos1 = useMemo(() => ({ ...params, leverage: 1.0 }), [params]);
  const { data: dataPos1 } = useSimulation(paramsPos1, shocks);

  // 決定當前階段的終點天數
  const targetDay = useMemo(() => {
    if (phase === 0) return 0;
    if (phase === 1) return params.blackSwanDay - 1;
    if (phase === 2) return params.blackSwanDay;
    return params.tradingDays;
  }, [phase, params.blackSwanDay, params.tradingDays]);

  // 動畫計時器
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

  // 合併並裁切數據給圖表
  const chartData = useMemo(() => {
    const slice = [];
    for (let i = 0; i <= currentDay; i++) {
      slice.push({
        day: data[i]?.day,
        vix: data[i]?.vix,
        tradNav: data[i]?.tradNav, // 傳統線
        innNeg1: dataNeg1[i]?.innNav, // -1x 創新線
        innPos1: dataPos1[i]?.innNav, // +1x 創新線
      });
    }
    return slice;
  }, [data, dataNeg1, dataPos1, currentDay]);

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

  return (
    <div className="flex flex-col space-y-4 h-full max-h-[calc(100vh-220px)]">
      {/* 頂部三路控制面板 */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-white/10 pr-4">數據對照選擇</span>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={showTrad} onChange={e=>setShowTrad(e.target.checked)} className="w-4 h-4 accent-red-500" />
            <span className="text-sm text-slate-300 group-hover:text-red-400 transition-colors">傳統 ETN ({params.leverage}x)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={showInnNeg1} onChange={e=>setShowInnNeg1(e.target.checked)} className="w-4 h-4 accent-purple-500" />
            <span className="text-sm text-slate-300 group-hover:text-purple-400 transition-colors flex items-center gap-1">
               <ShieldCheck size={14} className="text-purple-400"/> 創新避險型 (-1x)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={showInnPos1} onChange={e=>setShowInnPos1(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
            <span className="text-sm text-slate-300 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
               <Zap size={14} className="text-emerald-400"/> 創新補血型 (+1x)
            </span>
          </label>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
           <span>DAY: {currentDay}</span>
           <span className="px-2 py-0.5 bg-white/5 rounded">PHASE {phase}</span>
        </div>
      </div>

      {/* 主展演區域 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 左側：敘述文字 (寬度縮小，高度固定) */}
        <div className="w-[320px] flex flex-col gap-4">
          <GlassCard className="flex-1 border-l-4 border-l-purple-500 flex flex-col justify-between overflow-y-auto custom-scrollbar p-5">
            <div className="space-y-4">
               {phase === 0 && (
                 <div className="animate-in fade-in">
                    <h3 className="text-lg font-bold text-white mb-2">多維度對照展演</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      本動畫將同時展示「傳統」與「全天候雙引擎」在不同槓桿方向下的表現。
                      您可以隨時切換上方勾選項來對比不同策略的生存曲線。
                    </p>
                    <button onClick={handleNextPhase} className="mt-6 w-full py-3 bg-indigo-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all">
                      <Play size={18} /> 開始演示
                    </button>
                 </div>
               )}
               {phase === 1 && (
                 <div className="animate-in fade-in">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">階段一：平靜期的差異</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      注意 <span className="text-emerald-400">創新補血型(+1x)</span> 如何透過收租跑贏傳統。
                      而 <span className="text-purple-400">創新避險型(-1x)</span> 則在為未來買保險而稍落後。
                    </p>
                    {!isPlaying && currentDay === targetDay && (
                      <button onClick={handleNextPhase} className="mt-6 w-full py-3 bg-red-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:bg-red-500 transition-all">
                        <AlertTriangle size={18} /> 爆發黑天鵝
                      </button>
                    )}
                 </div>
               )}
               {phase === 2 && (
                 <div className="animate-in fade-in">
                    <h3 className="text-lg font-bold text-red-500 mb-2">階段二：極端衝擊</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      VIX 暴漲！傳統型與做多型劇烈波動。
                      觀察 <span className="text-purple-400">創新避險型</span> 如何在歸零邊緣被 Gamma 賠付拉回，保全本金。
                    </p>
                    {!isPlaying && currentDay === targetDay && (
                      <button onClick={handleNextPhase} className="mt-6 w-full py-3 bg-teal-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:bg-teal-500 transition-all">
                        <ChevronRight size={18} /> 觀察長期結果
                      </button>
                    )}
                 </div>
               )}
               {phase === 3 && (
                 <div className="animate-in fade-in">
                    <h3 className="text-lg font-bold text-teal-400 mb-2">階段三：結語</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      長期來看，具備動態引擎的商品能適應更多樣的市場環境，無論是防止爆倉還是緩解耗損。
                    </p>
                    <button onClick={handleReset} className="mt-6 w-full py-3 bg-slate-700 rounded-xl text-white font-bold flex items-center justify-center gap-2">
                      <RotateCcw size={18} /> 重新開始
                    </button>
                 </div>
               )}
            </div>

            <div className="mt-6">
               <div className="flex justify-between items-center text-[10px] text-slate-600 mb-2 uppercase tracking-tighter">
                  <span>Progress</span>
                  <span>{Math.round((currentDay/params.tradingDays)*100)}%</span>
               </div>
               <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-100" style={{ width: `${(currentDay/params.tradingDays)*100}%` }} />
               </div>
               {isPlaying && (
                 <button onClick={() => setIsPaused(!isPaused)} className="mt-3 w-full py-1.5 rounded bg-white/5 text-[11px] text-slate-400 border border-white/10 hover:bg-white/10 transition-all">
                   {isPaused ? "RESUME" : "PAUSE"}
                 </button>
               )}
            </div>
          </GlassCard>
        </div>

        {/* 右側：圖表區域 (寬度最大化) */}
        <div className="flex-1 h-full min-h-0">
          <GlassCard className="h-full p-4 relative flex flex-col">
            <div className="absolute top-4 right-6 flex gap-4 z-10">
               {showTrad && <div className="flex items-center gap-2 text-[10px] text-red-400 font-bold"><span className="w-4 h-0.5 bg-red-400 border-t border-dashed"></span> TRADITIONAL</div>}
               {showInnNeg1 && <div className="flex items-center gap-2 text-[10px] text-purple-400 font-bold"><span className="w-4 h-1 bg-purple-400"></span> INN -1x (SHIELD)</div>}
               {showInnPos1 && <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold"><span className="w-4 h-1 bg-emerald-400"></span> INN +1x (BOOST)</div>}
            </div>
            <div className="flex-1 mt-4">
               <StoryChart 
                 data={chartData as any} 
                 maxDays={params.tradingDays}
                 showTrad={showTrad}
                 showInnNeg1={showInnNeg1}
                 showInnPos1={showInnPos1}
               />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
