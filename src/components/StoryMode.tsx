"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SimulationParams, DailyData, useSimulation } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { StoryChart } from "./charts/StoryChart";
import { Play, Pause, ChevronRight, RotateCcw, AlertTriangle, Settings2, ChevronDown, ChevronUp, ZoomIn } from "lucide-react";

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState<number | ''>('');
  const [zoomMax, setZoomMax] = useState<number | ''>('');

  const [showTrad, setShowTrad] = useState(true);
  const [showInn, setShowInn] = useState(true);

  // What-If State
  const [enableAlt, setEnableAlt] = useState(false);
  const [altLeverage, setAltLeverage] = useState(params.leverage);
  const [altBaseContango, setAltBaseContango] = useState(params.baseContango);

  // Generate alternative simulation data using exactly the same shocks
  const altParams = useMemo(() => ({
    ...params,
    leverage: altLeverage,
    baseContango: altBaseContango
  }), [params, altLeverage, altBaseContango]);

  const { data: rawAltData } = useSimulation(altParams, shocks);

  const isShort = params.leverage < 0;

  // Determine target day for the current phase
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
      }, 30);
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

  // Merge the primary data and the alt data up to currentDay
  const slicedData = useMemo(() => {
    const slice: ExtendedDailyData[] = [];
    for (let i = 0; i <= currentDay; i++) {
      const baseObj = data[i];
      if (!baseObj) continue;

      const merged: ExtendedDailyData = { ...baseObj };
      if (enableAlt && rawAltData[i]) {
        merged.altTradNav = rawAltData[i].tradNav;
        merged.altInnNav = rawAltData[i].innNav;
      }
      slice.push(merged);
    }
    return slice;
  }, [data, rawAltData, currentDay, enableAlt]);

  // Narrative Content
  const renderNarrative = () => {
    if (isShort) {
      // ── 做空模式劇本 (原本的黑天鵝劇本) ──
      switch (phase) {
        case 0:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-light text-slate-100">做空模式展示:</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                此展演將模擬一段長達 {params.tradingDays} 天的投資旅程。我們將觀察在穩定的牛市中，以及突發的黑天鵝事件下，做空 VIX 的兩款商品所面臨的命運。
              </p>
              <button onClick={handleNextPhase} className="mt-4 px-8 py-3 bg-indigo-600 rounded-xl text-white font-semibold flex items-center gap-2">
                <Play size={18} /> 開始情境展演
              </button>
            </div>
          );
        case 1:
          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-light text-blue-300">階段一：牛市的幻覺 (Day 0 - {params.blackSwanDay - 1})</h3>
              <p className="text-slate-300 font-light leading-relaxed">
                在平靜期，<span className="text-red-400 font-medium">傳統 ETN</span> 靠正價差穩定獲利。<br/>
                <span className="text-teal-400 font-medium">創新 ETN</span> 因為提撥保費購買「尾部保護」，淨值增長稍微落後，這是為了保險付出的代價。
              </p>
              {!isPlaying && currentDay === targetDay && (
                <button onClick={handleNextPhase} className="mt-4 px-8 py-3 bg-red-600 rounded-xl text-white font-semibold flex items-center gap-2">
                  <AlertTriangle size={18} /> 黑天鵝發生 (第 {params.blackSwanDay} 天)
                </button>
              )}
            </div>
          );
        case 2:
          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-light text-red-400">階段二：黑天鵝降臨 (Day {params.blackSwanDay})</h3>
              <p className="text-slate-300 font-light leading-relaxed">
                市場爆發恐慌，VIX 單日暴漲 {params.blackSwanSpike}%。<br/>
                <span className="text-red-400 font-medium">傳統型：</span> 資產瞬間歸零。<br/>
                <span className="text-teal-400 font-medium">創新避險型：</span> 選擇權保護傘啟動，抵銷空單虧損，成功保全本金。
              </p>
              {!isPlaying && currentDay === targetDay && (
                <button onClick={handleNextPhase} className="mt-4 px-8 py-3 bg-teal-600 rounded-xl text-white font-semibold flex items-center gap-2">
                  <ChevronRight size={18} /> 觀看復甦走勢
                </button>
              )}
            </div>
          );
        case 3:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-light text-teal-300">階段三：長期勝出的價值</h3>
              <p className="text-slate-300 font-light leading-relaxed">
                恐慌退去，VIX 回落。傳統型已經永遠歸零，而<span className="text-teal-400 font-medium">創新避險型</span> 憑藉存活下來的本金，再次開始享受做空波動率的獲利。
              </p>
              <button onClick={handleReset} className="mt-4 px-8 py-3 bg-slate-700 rounded-xl text-white font-semibold flex items-center gap-2">
                <RotateCcw size={18} /> 重新展演
              </button>
            </div>
          );
      }
    } else {
      // ── 做多模式劇本 (新開發：掩護性買權補血劇本) ──
      switch (phase) {
        case 0:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-light text-slate-100">做多模式展示:</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                做多 VIX 最痛苦的是「正價差 (Contango)」導致的慢性失血。我們將觀察「掩護性買權 (Covered Call)」如何補強做多型產品的存續能力。
              </p>
              <button onClick={handleNextPhase} className="mt-4 px-8 py-3 bg-emerald-600 rounded-xl text-white font-semibold flex items-center gap-2">
                <Play size={18} /> 開始情境展演
              </button>
            </div>
          );
        case 1:
          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-light text-emerald-300">階段一：慢性耗損 (Day 0 - {params.blackSwanDay - 1})</h3>
              <p className="text-slate-300 font-light leading-relaxed">
                在市場平淡期，VIX 期貨正價差高昂。<br/>
                <span className="text-red-400 font-medium">傳統做多型：</span> 淨值因轉倉成本不斷下滑。<br/>
                <span className="text-teal-400 font-medium">創新補血型：</span> 藉由賣出買權收取權利金，大幅抵銷了耗損，淨值維持得更強韌。
              </p>
              {!isPlaying && currentDay === targetDay && (
                <button onClick={handleNextPhase} className="mt-4 px-8 py-3 bg-orange-600 rounded-xl text-white font-semibold flex items-center gap-2">
                  <AlertTriangle size={18} /> 觀察黑天鵝爆發 (第 {params.blackSwanDay} 天)
                </button>
              )}
            </div>
          );
        case 2:
          return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-light text-orange-400">階段二：暴漲與封頂 (Day {params.blackSwanDay})</h3>
              <p className="text-slate-300 font-light leading-relaxed">
                VIX 暴漲！<br/>
                <span className="text-red-400 font-medium">傳統型：</span> 完整捕捉到大漲紅利。<br/>
                <span className="text-teal-400 font-medium">創新補血型：</span> 雖然也能獲利，但因為賣出了買權，漲幅在 30% 處會被「封頂」。這是平時領取收租補貼的代價。
              </p>
              {!isPlaying && currentDay === targetDay && (
                <button onClick={handleNextPhase} className="mt-4 px-8 py-3 bg-blue-600 rounded-xl text-white font-semibold flex items-center gap-2">
                  <ChevronRight size={18} /> 觀察災後對照
                </button>
              )}
            </div>
          );
        case 3:
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-light text-blue-300">階段三：長期存續力對照</h3>
              <p className="text-slate-300 font-light leading-relaxed">
                長期下來，做多 VIX 通常會輸給轉倉成本。但<span className="text-teal-400 font-medium">創新補血型</span> 透過犧牲極端漲幅來換取平時的「補血」，顯著延緩了價值歸零的速度。
              </p>
              <button onClick={handleReset} className="mt-4 px-8 py-3 bg-slate-700 rounded-xl text-white font-semibold flex items-center gap-2">
                <RotateCcw size={18} /> 重新展演
              </button>
            </div>
          );
      }
    }
  };

  return (
    <div className="flex flex-col space-y-6 h-full pb-8 pr-2 custom-scrollbar">
      {/* 參數摘要與公式面板 (此處保持現有的 baseContango 邏輯) */}
      <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl shadow-inner shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1">
              <Settings2 size={14} /> 預設基準參數
            </div>
          </div>
          <button
            onClick={() => setShowMath(!showMath)}
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-purple-900/20"
          >
            {showMath ? "隱藏底層公式" : "查看底層公式"}
            {showMath ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-700/50">起始 VIX: {params.initialVix}</span>
          <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-blue-300/80 border border-blue-900/30">基礎正價差: {params.baseContango}%/天</span>
          <span className={`px-3 py-1 bg-slate-800/50 rounded-lg text-xs border ${isShort ? 'text-red-300 border-red-900/30' : 'text-emerald-300 border-emerald-900/30'}`}>
            槓桿模式: {params.leverage}x ({isShort ? '做空/防禦' : '做多/補血'})
          </span>
        </div>

        {showMath && (
          <div className="mt-3 p-4 bg-black/40 border border-purple-500/20 rounded-lg text-[13px] text-slate-300 font-light animate-in fade-in slide-in-from-top-2">
            <p className="mb-2"><strong className="text-slate-100 font-medium">全天候雙引擎數學邏輯：</strong></p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              {isShort ? (
                <>
                  <li><strong>階梯式尾部防禦 (Shorting)：</strong> 當 VIX 暴漲 &gt; 30% 時觸發分段賠付。</li>
                  <li><strong>動態保費成本：</strong> {params.tailRiskPremium}% × (當日 VIX / 20) / 252。</li>
                </>
              ) : (
                <>
                  <li><strong>掩護性買權補血 (Longing)：</strong> 賣出 OTM Call 收取權利金補助。</li>
                  <li><strong>動態收租回饋：</strong> {params.coveredCallYield}% × (當日 VIX / 20) / 252。</li>
                  <li><strong>漲幅封頂：</strong> 當日 VIX 貢獻上限鎖定於 30%。</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* 控制面板 (Zoom, Change Assumptions) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl shadow-inner shrink-0">
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showTrad} onChange={(e) => setShowTrad(e.target.checked)} className="accent-red-400" />
            顯示基準傳統型
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInn} onChange={(e) => setShowInn(e.target.checked)} className="accent-teal-400" />
            顯示基準創新型
          </label>
          <div className="flex items-center gap-2">
            <ZoomIn size={14} className="text-purple-400" />
            <input type="checkbox" checked={isZoomed} onChange={(e) => setIsZoomed(e.target.checked)} className="accent-purple-500" />
            <span>自訂範圍</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-yellow-400 font-medium cursor-pointer">
            <input type="checkbox" checked={enableAlt} onChange={(e) => setEnableAlt(e.target.checked)} className="accent-yellow-500" />
            更改假設 (對照組):
          </label>
          <div className={`flex gap-4 ${enableAlt ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <input type="number" step="0.5" value={altLeverage} onChange={(e)=>setAltLeverage(Number(e.target.value))} className="w-16 bg-slate-900 border border-slate-700 rounded px-1 text-sm text-slate-200" title="假設槓桿" />
            <input type="number" step="0.01" value={altBaseContango} onChange={(e)=>setAltBaseContango(Number(e.target.value))} className="w-16 bg-slate-900 border border-slate-700 rounded px-1 text-sm text-slate-200" title="假設正價差" />
          </div>
        </div>
      </div>

      {/* 動畫主區域 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" style={{ height: '550px' }}>
        <div className="xl:col-span-1 h-full flex flex-col gap-4">
          <GlassCard className="flex-1 flex flex-col justify-between border-l-4 border-l-purple-500 overflow-y-auto custom-scrollbar">
            {renderNarrative()}
            <div className="mt-8 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-mono">
                <span>DAY {currentDay}</span>
                <span>TARGET {targetDay}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${(currentDay / params.tradingDays) * 100}%` }}></div>
              </div>
              {isPlaying && (
                <button onClick={togglePause} className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-all">
                  {isPaused ? "繼續播放" : "暫停解說"}
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="xl:col-span-3 h-full">
          <GlassCard className="h-full p-4">
            <StoryChart
              data={slicedData as any}
              maxDays={params.tradingDays}
              showTrad={showTrad}
              showInn={showInn}
              showAlt={enableAlt}
              isZoomed={isZoomed}
              zoomMin={zoomMin}
              zoomMax={zoomMax}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
