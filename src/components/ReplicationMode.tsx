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
  ReferenceLine,
  AreaChart,
  Area
} from "recharts";
import { Shield, TrendingUp, Info, Plus, Minus, Equal, ArrowRight } from "lucide-react";

export function ReplicationMode() {
  const [activeTab, setActiveTab] = useState<'short' | 'long'>('short');
  
  // 參數滑桿
  const [baseVix, setBaseVix] = useState(15);
  const [premium, setPremium] = useState(5); // 權利金成本/收益

  // 反向模組顯示狀態
  const [shortShowTrad, setShortShowTrad] = useState(true);
  const [shortShowOpt, setShortShowOpt] = useState(false);
  const [shortShowInn, setShortShowInn] = useState(false);

  // 正向模組顯示狀態
  const [longShowTrad, setLongShowTrad] = useState(true);
  const [longShowOpt, setLongShowOpt] = useState(false);
  const [longShowInn, setLongShowInn] = useState(false);

  // 計算反向數據 (-1x + Buy OTM Call)
  const shortData = useMemo(() => {
    const data = [];
    const leverage = -1.0;
    const strike = baseVix * 1.5; // 履約價設定為 VIX 上漲 50%
    const gammaMultiplier = 1.5;  // 尾部爆發力乘數

    for (let x = 5; x <= 65; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      
      // 1. 傳統 ETN 損益
      const trad = vixReturn * leverage * 100;
      
      // 2. 選擇權元件 (單純的 payoff，扣掉成本)
      // 只有在 VIX 超過履約價時，才會產生正向報酬 (Gamma爆發)
      const optPayoff = Math.max(0, (x - strike) / baseVix) * 100 * gammaMultiplier;
      const opt = optPayoff - premium; // 買權利金是支出
      
      // 3. 創新商品
      const inn = trad + opt;

      data.push({ 
        vix: x, 
        trad: Number(trad.toFixed(1)), 
        opt: Number(opt.toFixed(1)), 
        inn: Number(inn.toFixed(1)) 
      });
    }
    return data;
  }, [baseVix, premium]);

  // 計算正向數據 (+1x + Sell OTM Call)
  const longData = useMemo(() => {
    const data = [];
    const leverage = 1.0;
    const strike = baseVix * 1.35; // 履約價設定為 VIX 上漲 35%

    for (let x = 5; x <= 65; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      
      // 1. 傳統 ETN 損益
      const trad = vixReturn * leverage * 100;
      
      // 2. 選擇權元件 (賣出買權)
      // VIX 超過履約價時會產生負向報酬，但平時有權利金收入
      const optPayoff = -Math.max(0, (x - strike) / baseVix) * 100;
      const opt = optPayoff + premium; // 賣權利金是收入
      
      // 3. 創新商品
      const inn = trad + opt;

      data.push({ 
        vix: x, 
        trad: Number(trad.toFixed(1)), 
        opt: Number(opt.toFixed(1)), 
        inn: Number(inn.toFixed(1)) 
      });
    }
    return data;
  }, [baseVix, premium]);

  // 控制透明度效果 (當創新商品勾選時，淡化其他元件)
  const isShortAssembled = shortShowInn;
  const isLongAssembled = longShowInn;

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden max-h-[calc(100vh-160px)]">
      
      {/* 頂部切換 Tabs */}
      <div className="flex space-x-4 shrink-0">
        <button
          onClick={() => setActiveTab('short')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'short'
              ? "bg-purple-600/20 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          <Shield size={18} /> 反向模組 (-1x)：尾部防禦結構
        </button>
        <button
          onClick={() => setActiveTab('long')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'long'
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          <TrendingUp size={18} /> 正向模組 (+1x)：收租補血結構
        </button>
      </div>

      {/* 參數控制區 */}
      <GlassCard className="grid grid-cols-2 gap-8 shrink-0 py-4 px-6 border-l-4 border-l-blue-500">
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] text-slate-400 uppercase tracking-widest font-bold">
            <span>市場基準點 (Initial VIX)</span>
            <span className="text-blue-400 text-sm font-mono">{baseVix}</span>
          </div>
          <input 
            type="range" min={10} max={30} value={baseVix} 
            onChange={e=>setBaseVix(Number(e.target.value))} 
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-blue-500 cursor-pointer" 
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] text-slate-400 uppercase tracking-widest font-bold">
            <span>選擇權權利金 (Premium)</span>
            <span className={activeTab === 'short' ? "text-purple-400 text-sm font-mono" : "text-emerald-400 text-sm font-mono"}>
              {activeTab === 'short' ? '-' : '+'}{premium}%
            </span>
          </div>
          <input 
            type="range" min={1} max={15} value={premium} 
            onChange={e=>setPremium(Number(e.target.value))} 
            className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${activeTab === 'short' ? 'accent-purple-500' : 'accent-emerald-500'}`} 
          />
        </div>
      </GlassCard>

      {/* 主內容區：積木勾選 + 圖表 */}
      <GlassCard className="flex-1 flex flex-col min-h-0 p-6 relative overflow-hidden">
        
        {/* 積木組裝區 (Checkboxes) & 公式 */}
        <div className="flex flex-col items-center justify-center space-y-4 mb-6 shrink-0">
          <div className="flex items-center justify-center space-x-6">
            
            {/* 傳統元件 */}
            <label className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              (activeTab === 'short' ? shortShowTrad : longShowTrad)
                ? "bg-slate-800/50 border-slate-600" 
                : "bg-transparent border-slate-800 hover:border-slate-700"
            }`}>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={activeTab === 'short' ? shortShowTrad : longShowTrad}
                  onChange={(e) => activeTab === 'short' ? setShortShowTrad(e.target.checked) : setLongShowTrad(e.target.checked)}
                  className="w-4 h-4 accent-slate-500"
                />
                <span className="font-bold text-slate-200">傳統 ETN</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {activeTab === 'short' ? '線性做空 (-1x)' : '線性做多 (+1x)'}
              </span>
            </label>

            <Plus className="text-slate-600" />

            {/* 選擇權元件 */}
            <label className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              (activeTab === 'short' ? shortShowOpt : longShowOpt)
                ? (activeTab === 'short' ? "bg-purple-900/20 border-purple-500" : "bg-emerald-900/20 border-emerald-500")
                : "bg-transparent border-slate-800 hover:border-slate-700"
            }`}>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={activeTab === 'short' ? shortShowOpt : longShowOpt}
                  onChange={(e) => activeTab === 'short' ? setShortShowOpt(e.target.checked) : setLongShowOpt(e.target.checked)}
                  className={`w-4 h-4 ${activeTab === 'short' ? 'accent-purple-500' : 'accent-emerald-500'}`}
                />
                <span className={`font-bold ${activeTab === 'short' ? 'text-purple-300' : 'text-emerald-300'}`}>
                  選擇權元件
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {activeTab === 'short' ? `買入買權 (保費 -${premium}%)` : `賣出買權 (收入 +${premium}%)`}
              </span>
            </label>

            <ArrowRight className="text-slate-400" />

            {/* 創新商品 */}
            <label className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all shadow-lg ${
              (activeTab === 'short' ? shortShowInn : longShowInn)
                ? (activeTab === 'short' ? "bg-purple-600/20 border-purple-400 shadow-purple-500/20" : "bg-emerald-600/20 border-emerald-400 shadow-emerald-500/20")
                : "bg-transparent border-slate-800 hover:border-slate-700"
            }`}>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={activeTab === 'short' ? shortShowInn : longShowInn}
                  onChange={(e) => activeTab === 'short' ? setShortShowInn(e.target.checked) : setLongShowInn(e.target.checked)}
                  className={`w-4 h-4 ${activeTab === 'short' ? 'accent-purple-400' : 'accent-emerald-400'}`}
                />
                <span className={`font-bold text-lg ${activeTab === 'short' ? 'text-purple-400' : 'text-emerald-400'}`}>
                  創新全天候 ETN
                </span>
              </div>
              <span className="text-[10px] text-slate-300">
                {activeTab === 'short' ? '保險機制啟動' : '收租機制啟動'}
              </span>
            </label>

          </div>

          <div className="text-xs font-mono text-slate-500 bg-black/40 px-4 py-2 rounded-lg border border-white/5">
            {activeTab === 'short' 
              ? "Formula: 創新淨值 = 傳統反向 (-1x) + 買入尾部買權 (Gamma > 0) - 保費支出"
              : "Formula: 創新淨值 = 傳統正向 (+1x) + 賣出掩護買權 (Capped Upside) + 權利金收入"
            }
          </div>
        </div>

        {/* 核心圖表區 */}
        <div className="flex-1 min-h-[400px] w-full relative mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={activeTab === 'short' ? shortData : longData} 
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="vix" 
                type="number" 
                domain={[5, 65]} 
                stroke="#64748b" 
                label={{ value: '市場 VIX 指數', position: 'insideBottom', offset: -10, fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b" 
                label={{ value: '策略報酬率 (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{backgroundColor:'rgba(10,5,20,0.9)', border:'1px solid #1e293b', borderRadius:'8px'}}
                formatter={(val: number) => `${val.toFixed(1)}%`}
              />
              
              <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
              <ReferenceLine x={baseVix} stroke="#3b82f6" strokeDasharray="4 4" label={{value: '初始VIX', position: 'top', fill: '#3b82f6'}} />
              
              {/* 反向死亡線 */}
              {activeTab === 'short' && (
                <ReferenceLine y={-100} stroke="#ef4444" strokeWidth={1} strokeDasharray="2 2" label={{value: '清算歸零線', position: 'insideTopLeft', fill: '#ef4444'}} />
              )}

              {/* === 繪製線條 (反向) === */}
              {activeTab === 'short' && shortShowTrad && (
                <Line 
                  type="monotone" dataKey="trad" name="傳統反向 ETN" 
                  stroke="#64748b" strokeWidth={isShortAssembled ? 1 : 3} strokeDasharray="4 4" 
                  dot={false} isAnimationActive={true} opacity={isShortAssembled ? 0.3 : 1}
                />
              )}
              {activeTab === 'short' && shortShowOpt && (
                <Line 
                  type="monotone" dataKey="opt" name="買入選擇權 (扣除保費)" 
                  stroke="#a855f7" strokeWidth={isShortAssembled ? 1 : 3} strokeDasharray="4 4" 
                  dot={false} isAnimationActive={true} opacity={isShortAssembled ? 0.3 : 1}
                />
              )}
              {activeTab === 'short' && shortShowInn && (
                <Line 
                  type="monotone" dataKey="inn" name="創新反向 ETN" 
                  stroke="#c084fc" strokeWidth={5} 
                  dot={false} isAnimationActive={true} 
                  style={{ filter: 'drop-shadow(0 0 8px rgba(192,132,252,0.5))' }}
                />
              )}

              {/* === 繪製線條 (正向) === */}
              {activeTab === 'long' && longShowTrad && (
                <Line 
                  type="monotone" dataKey="trad" name="傳統正向 ETN" 
                  stroke="#64748b" strokeWidth={isLongAssembled ? 1 : 3} strokeDasharray="4 4" 
                  dot={false} isAnimationActive={true} opacity={isLongAssembled ? 0.3 : 1}
                />
              )}
              {activeTab === 'long' && longShowOpt && (
                <Line 
                  type="monotone" dataKey="opt" name="賣出選擇權 (含權利金)" 
                  stroke="#10b981" strokeWidth={isLongAssembled ? 1 : 3} strokeDasharray="4 4" 
                  dot={false} isAnimationActive={true} opacity={isLongAssembled ? 0.3 : 1}
                />
              )}
              {activeTab === 'long' && longShowInn && (
                <Line 
                  type="monotone" dataKey="inn" name="創新正向 ETN" 
                  stroke="#34d399" strokeWidth={5} 
                  dot={false} isAnimationActive={true}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
