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
  Area,
  AreaChart
} from "recharts";
import { Shield, Zap, TrendingUp, HelpCircle } from "lucide-react";

export function ReplicationMode() {
  const [baseVix, setBaseVix] = useState(15);

  const shortData = useMemo(() => {
    const data = [];
    const leverage = -1.0;
    const strike = baseVix * 1.5;
    const premium = 5;
    for (let x = 5; x <= 60; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      const trad = vixReturn * leverage * 100;
      const protection = Math.max(0, (x - strike) / baseVix) * 1.0 * 100;
      const inn = trad + protection - premium;
      data.push({ vix: x, trad, inn, opt: protection - premium });
    }
    return data;
  }, [baseVix]);

  const longData = useMemo(() => {
    const data = [];
    const leverage = 1.0;
    const strike = baseVix * 1.3;
    const income = 10;
    for (let x = 5; x <= 60; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      const trad = vixReturn * leverage * 100;
      const cappedVixReturn = Math.min(vixReturn, (strike - baseVix) / baseVix);
      const inn = (cappedVixReturn * leverage * 100) + income;
      data.push({ vix: x, trad, inn, opt: inn - trad });
    }
    return data;
  }, [baseVix]);

  const ChartSection = ({ title, data, color, type, icon: Icon }: any) => (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${type === 'short' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-tight">{title}</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Payoff Analysis</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-mono ${type === 'short' ? 'text-purple-300' : 'text-emerald-300'}`}>
            {type === 'short' ? '保護門檻: 150%' : '封頂門檻: 130%'}
          </span>
        </div>
      </div>

      <GlassCard className="flex-1 p-4 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={type === 'short' ? '#a855f7' : '#10b981'} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={type === 'short' ? '#a855f7' : '#10b981'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="vix" type="number" domain={[5, 60]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v)=>`${v}%`} />
            <Tooltip 
              contentStyle={{backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius:'8px', fontSize:'11px'}}
              formatter={(val:any) => [`${Number(val).toFixed(1)}%`]}
            />
            <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
            <ReferenceLine x={baseVix} stroke="#3b82f6" strokeDasharray="3 3" label={{value:'ENTRY', position:'top', fill:'#3b82f6', fontSize:9}} />
            
            <Area type="monotone" dataKey="inn" stroke={type === 'short' ? '#a855f7' : '#10b981'} strokeWidth={3} fillOpacity={1} fill={`url(#grad-${type})`} />
            <Line type="monotone" dataKey="trad" stroke="#f43f5e" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
      
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase">策略優勢</p>
            <p className="text-xs text-slate-300">{type === 'short' ? '下檔風險有限' : '額外權利金補助'}</p>
         </div>
         <div className="bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase">策略犧牲</p>
            <p className="text-xs text-slate-300">{type === 'short' ? '平時利潤略降' : '上檔獲利封頂'}</p>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full max-h-[calc(100vh-220px)]">
      {/* 頂部全寬控制條 */}
      <GlassCard className="p-4 flex items-center justify-between shrink-0 border-b-2 border-b-blue-500/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
             <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">金融工程解構：雙向損益圖譜</h2>
            <p className="text-xs text-slate-500">分析不同市場環境下的到期損益 (Payoff) 形狀</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-black/20 p-2 px-6 rounded-2xl border border-white/5">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
               <span>基準 VIX 設定</span>
               <span className="text-blue-400">{baseVix}</span>
            </div>
            <input type="range" min={10} max={30} value={baseVix} onChange={e=>setBaseVix(Number(e.target.value))} className="w-48 h-1.5 bg-slate-800 rounded-lg appearance-none accent-blue-500" />
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <div className="w-3 h-0.5 bg-red-400 border-t border-dashed"></div> 傳統部位
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <div className="w-3 h-3 bg-purple-500/40 border border-purple-500 rounded-sm"></div> 創新避險
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <div className="w-3 h-3 bg-emerald-500/40 border border-emerald-500 rounded-sm"></div> 創新補血
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 雙圖區域 */}
      <div className="flex-1 flex gap-8 min-h-0">
        <ChartSection title="Module A: Tail-Risk Hedging" data={shortData} color="text-purple-400" type="short" icon={Shield} />
        <ChartSection title="Module B: Covered Call Boost" data={longData} color="text-emerald-400" type="long" icon={Zap} />
      </div>
      
      {/* 底部說明 */}
      <div className="flex items-center gap-2 text-[11px] text-slate-600 italic shrink-0">
         <HelpCircle size={14} />
         提示：橫軸代表結算時的 VIX 指數價格；縱軸代表策略相對於起始淨值的損益百分比。
      </div>
    </div>
  );
}
