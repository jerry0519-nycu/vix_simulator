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
    switch (phase) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-light text-slate-100">預設情境:</h3>
            <p className="text-slate-400 font-light leading-relaxed">
              在此預設將模擬一段長達 {params.tradingDays} 天的投資旅程。將觀察在穩定的牛市中，以及突發的黑天鵝事件下，兩種不同結構的 ETN 所面臨的損益。
            </p>
            <button
              onClick={handleNextPhase}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-semibold flex items-center gap-2 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
              <Play size={18} /> 開始情境展演
            </button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xl font-light text-blue-300">階段一：牛市的幻覺 (Day 0 - Day {params.blackSwanDay - 1})</h3>
            <p className="text-slate-300 font-light leading-relaxed">
              在市場平靜的時期，VIX 維持低檔震盪。<span className="text-red-400 font-medium">傳統 ETN</span> 靠著穩定的正價差持續創造豐厚利潤。<br/>
              而<span className="text-teal-400 font-medium">創新避險 ETN</span> 因為必須持續提撥 {params.premiumCost}% 的收益去購買極度價外買權，淨值成長幅度稍稍落後。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={handleNextPhase}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl text-white font-semibold flex items-center gap-2 hover:from-orange-500 hover:to-red-500 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  <AlertTriangle size={18} /> 黑天鵝發生 (第 {params.blackSwanDay} 天)
                </button>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xl font-light text-red-400">階段二：黑天鵝降臨 (Day {params.blackSwanDay})</h3>
            <p className="text-slate-300 font-light leading-relaxed">
              就在第 {params.blackSwanDay} 天，市場爆發突發性恐慌，VIX 指數單日暴漲 {params.blackSwanSpike}%<br/><br/>
              <span className="text-red-400 font-medium">傳統 ETN：</span> 單日虧損達到了 100%，觸發加速清算條款，資產瞬間歸零。<br/>
              <span className="text-teal-400 font-medium">創新避險 ETN：</span> 系統性買入的極度價外買權啟動，成功彌補了期貨端價值的大幅下跌，雖小幅虧損但成功保全了本金。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={handleNextPhase}
                  className="px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl text-white font-semibold flex items-center gap-2 hover:from-teal-500 hover:to-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  <ChevronRight size={18} /> 觀看災後復甦走勢
                </button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xl font-light text-teal-300">階段三：災後復甦 (Day {params.blackSwanDay + 1} - 結尾)</h3>
            <p className="text-slate-300 font-light leading-relaxed">
              恐慌情緒逐漸消退，VIX 再次回落至歷史均值。但對於<span className="text-red-400 font-medium">傳統 ETN</span> 而言，歸零的淨值已經永遠無法起死回生。<br/><br/>
              相反地，<span className="text-teal-400 font-medium">創新避險 ETN</span> 憑藉著成功度過危機的本金，再次開始享受做空波動率的穩定利潤，證明了長期穩健量化避險策略的價值。
            </p>
            {!isPlaying && currentDay === targetDay && (
              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-slate-700/50 rounded-xl text-white font-semibold flex items-center gap-2 hover:bg-slate-600/50 transition-all border border-slate-500/50"
                >
                  <RotateCcw size={18} /> 重新展演
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-6 h-full pb-8 pr-2 custom-scrollbar">

      {/* Parameters Summary Badge & Math Explanation */}
      <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl shadow-inner shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1">
              <Settings2 size={14} /> 預設基準參數
            </div>
            <span className="text-[11px] text-slate-500 font-light">
              (註：此為本展演之固定環境變數，將決定下方 VIX 軌跡與基準 ETN 走勢)
            </span>
          </div>
          <button
            onClick={() => setShowMath(!showMath)}
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-purple-900/20"
          >
            {showMath ? "隱藏底層公式" : "查看底層公式與計算範例"}
            {showMath ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-700/50">起始 VIX: {params.initialVix}</span>
          <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-700/50">平時日波動: {params.dailyVol}%</span>
          <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-blue-300/80 border border-blue-900/30">基礎正價差: {params.baseContango}%/天</span>
          <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-red-300/80 border border-red-900/30">槓桿倍數: {params.leverage}x</span>
          <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-orange-300/80 border border-orange-900/30">黑天鵝暴漲: {params.blackSwanSpike}%</span>
        </div>

        {/* Collapsible Math Panel */}
        {showMath && (
          <div className="mt-3 p-4 bg-black/40 border border-purple-500/20 rounded-lg text-[13px] text-slate-300 font-light animate-in fade-in slide-in-from-top-2">
            <p className="mb-2"><strong className="text-slate-100 font-medium">1. VIX 指數生成（均值回歸模型）</strong></p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-400">
              <li>每日 VIX 變動率 = [均值拉力 (預設均值=起始 VIX)] + [隨機常態亂數 × <span className="text-slate-200">平時日波動 ({params.dailyVol}%)</span>]</li>
              <li>VIX 就像一根彈簧，平時會在 {params.initialVix} 上下震盪，不會無止盡地飆升。</li>
            </ul>

            <p className="mb-2"><strong className="text-slate-100 font-medium">2. 動態轉倉收益計算</strong></p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-400">
              <li>VIX ≤ 20：市場價差 = 基礎正價差 (<span className="text-blue-300">{params.baseContango}%/天</span>)，做空端轉倉賺取溢價</li>
              <li>20 &lt; VIX ≤ 30：正價差線性遞減至零，轉倉收益逐步消失</li>
              <li>VIX &gt; 30：進入逆價差區間，做空端每日因轉倉而額外虧損，造成「暴漲 + 逆價差」的雙重打擊</li>
              <li>實際轉倉收益 = 市場價差 × (-槓桿方向)，做空時正價差賺、逆價差虧</li>
            </ul>

            <p className="mb-2"><strong className="text-slate-100 font-medium">3. ETN 淨值計算（起始 $100、每日重平衡）</strong></p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-400">
              <li>傳統 ETN 每日報酬 = (VIX 變動率 × <span className="text-red-300">槓桿 {params.leverage}x</span>) + <span className="text-blue-300">實際轉倉收益</span></li>
              <li><strong className="text-slate-200 font-medium">第一天計算範例：</strong> 假設 VIX 從 15 跌到 14.7 (變動率 -2%)，此時 VIX=14.7 &lt; 20，市場價差={params.baseContango}%。實際轉倉收益={params.baseContango}% × 1 = {params.baseContango}%。傳統 ETN 報酬 = (-2% × -1) + {params.baseContango}% = {(2 + params.baseContango).toFixed(2)}%。淨值 = $100 × (1 + {(2 + params.baseContango).toFixed(2)}%) = <strong className="text-emerald-400">${(100 * (1 + (2 + params.baseContango) / 100)).toFixed(2)}</strong></li>
            </ul>

            <p className="mb-2"><strong className="text-slate-100 font-medium">4. 創新避險 ETN 的風險控制</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>平時每日報酬率會將轉倉收益扣除 <span className="text-teal-300">權利金提撥比例 ({params.premiumCost}%)</span> 去買保護，因此平時獲利會比傳統型稍微落後。</li>
              <li><strong>黑天鵝事件：</strong> 當 VIX 單日暴漲超過 50% 時，傳統 ETN 單日虧損超過 100% 觸發強制歸零，但創新 ETN 會觸發「巨幅賠付」，獲得額外補償來保全本金。</li>
            </ul>
          </div>
        )}
      </div>

      {/* Global Controls Panel */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl shadow-inner shrink-0">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showTrad}
              onChange={(e) => setShowTrad(e.target.checked)}
              className="w-4 h-4 rounded accent-red-400 bg-slate-800 border-slate-700"
            />
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            顯示基準傳統 ETN
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showInn}
              onChange={(e) => setShowInn(e.target.checked)}
              className="w-4 h-4 rounded accent-teal-400 bg-slate-800 border-slate-700"
            />
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            顯示基準創新 ETN
          </label>

          <div className="h-4 w-px bg-slate-700 hidden sm:block mx-2"></div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-purple-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={isZoomed}
                onChange={(e) => setIsZoomed(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-500 bg-slate-800 border-slate-700"
              />
              <ZoomIn size={14} className="text-purple-400" />
              自訂範圍 (Zoom)
            </label>

            {isZoomed && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <input
                  type="number"
                  placeholder="Min (Auto)"
                  value={zoomMin}
                  onChange={(e) => setZoomMin(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 bg-slate-900 border border-purple-500/50 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-purple-400 placeholder-slate-600"
                />
                <span className="text-slate-500 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max (Auto)"
                  value={zoomMax}
                  onChange={(e) => setZoomMax(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 bg-slate-900 border border-purple-500/50 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-purple-400 placeholder-slate-600"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 xl:gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-yellow-400 font-medium">
            <input
              type="checkbox"
              checked={enableAlt}
              onChange={(e) => setEnableAlt(e.target.checked)}
              className="w-4 h-4 rounded accent-yellow-500 bg-slate-800 border-slate-700"
            />
            更改假設:
          </label>

          <div className={`flex items-center gap-4 transition-opacity ${enableAlt ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">假設槓桿倍數:</label>
              <input
                type="number"
                step="0.5"
                value={altLeverage}
                onChange={(e) => setAltLeverage(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 outline-none focus:border-yellow-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">假設正價差(%/天):</label>
              <input
                type="number"
                step="0.01"
                value={altBaseContango}
                onChange={(e) => setAltBaseContango(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" style={{ height: '600px', minHeight: '600px' }}>
        {/* Narrative Panel */}
        <div className="xl:col-span-1 h-full flex flex-col gap-4 min-h-0">
          <GlassCard className="flex-1 flex flex-col justify-between border-l-4 border-l-purple-500 overflow-y-auto custom-scrollbar">
            {renderNarrative()}

            <div className="mt-8 pt-4 border-t border-white/5 shrink-0">
              <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                <span>當前進度</span>
                <span className="font-mono text-purple-300">Day {currentDay} / {params.tradingDays}</span>
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 transition-all duration-100"
                  style={{ width: `${(currentDay / params.tradingDays) * 100}%` }}
                ></div>
              </div>

              {/* Pause/Resume Button */}
              {isPlaying && (
                <button
                  onClick={togglePause}
                  className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    isPaused
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
                      : "bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30"
                  }`}
                >
                  {isPaused ? <><Play size={16} /> 繼續動畫</> : <><Pause size={16} /> 暫停解說</>}
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Chart Panel */}
        <div className="xl:col-span-3 h-full flex flex-col gap-4 min-h-0">
          <GlassCard className="flex-1 flex flex-col min-h-0 p-2 sm:p-4 pt-4 sm:pt-6">
            <div className="flex-1 min-h-0 w-full relative">
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
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
