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
import { ArrowRightLeft, Shield, TrendingUp, Info } from "lucide-react";

export function ReplicationMode() {
  const [baseVix, setBaseVix] = useState(15);

  const shortData = useMemo(() => {
    const data = [];
    const leverage = -1.0;
    const strike = baseVix * 1.5;
    const premium = 5;
    for (let x = 5; x <= 65; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      const trad = vixReturn * leverage * 100;
      const protection = Math.max(0, (x - strike) / baseVix) * 1.2 * 100; // 加強 Gamma 到 1.2x 展示效果
      const inn = trad + protection - premium;
      data.push({ vix: x, trad: Number(trad.toFixed(1)), inn: Number(inn.toFixed(1)) });
    }
    return data;
  }, [baseVix]);

  const longData = useMemo(() => {
    const data = [];
    const leverage = 1.0;
    const strike = baseVix * 1.35;
    const income = 10;
    for (let x = 5; x <= 65; x += 1) {
      const vixReturn = (x - baseVix) / baseVix;
      const trad = vixReturn * leverage * 100;
      const cappedVixReturn = Math.min(vixReturn, (strike - baseVix) / baseVix);
      const inn = (cappedVixReturn * leverage * 100) + income;
      data.push({ vix: x, trad: Number(trad.toFixed(1)), inn: Number(inn.toFixed(1)) });
    }
    return data;
  }, [baseVix]);

  const PayoffChart = ({ title, data, color, type }: any) => (
    <div className="flex-1 flex flex-col min-h-0 group">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className={`w-2 h-2 rounded-full ${type === 'short' ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse`} />
             <h4 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h4>
          </div>
          <p className="text-xs text-slate-500 font-light italic">
            {type === 'short' ? '下檔保護機制：買入尾部買權' : '上檔增益機制：賣出掩護買權'}
          </p>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-slate-600 block uppercase tracking-widest">組裝成本/收益</span>
           <span className={`text-lg font-mono font-bold ${type === 'short' ? 'text-purple-400' : 'text-emerald-400'}`}>
              {type === 'short' ? '-5.0%' : '+10.0%'}
           </span>
        </div>
      </div>
      
      <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4 relative overflow-hidden group-hover:border-white/10 transition-colors">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={type === 'short' ? '#a855f7' : '#10b981'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={type === 'short' ? '#a855f7' : '#10b981'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="vix" type="number" domain={[5, 65]} stroke="#334155" fontSize={10} tick={{fill:'#475569'}} />
            <YAxis stroke="#334155" fontSize={10} tick={{fill:'#475569'}} />
            <Tooltip 
              contentStyle={{backgroundColor:'#020617', border:'1px solid #1e293b', borderRadius:'12px', fontSize:'12px'}}
              itemStyle={{padding:'2px 0'}}
            />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
            <ReferenceLine x={baseVix} stroke="#3b82f6" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="inn" name="創新策略" stroke={type === 'short' ? '#a855f7' : '#10b981'} strokeWidth={3} fillOpacity={1} fill={`url(#grad-${type})`} />
            <Line type="monotone" dataKey="trad" name="傳統部位" stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 4" opacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      {/* 頂部資訊條 */}
      <div className="grid grid-cols-5 gap-6 shrink-0">
        <GlassCard className="col-span-2 flex items-center gap-4 bg-gradient-to-r from-blue-600/10 to-transparent border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">結構工程總覽</h3>
            <p className="text-[11px] text-slate-400 leading-tight mt-1">
              將傳統 ETN 部位與衍生性金融商品（買權）進行二次封裝，實現「風險非對稱性」的動態調整。
            </p>
          </div>
        </GlassCard>

        <GlassCard className="col-span-3 flex items-center justify-between px-8">
          <div className="space-y-2 flex-1 max-w-xs">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest">
               <span>市場基準點 (Initial VIX)</span>
               <span className="text-blue-400 font-bold font-mono">{baseVix}</span>
            </div>
            <input 
              type="range" min={10} max={30} value={baseVix} 
              onChange={e=>setBaseVix(Number(e.target.value))} 
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-blue-500 cursor-pointer" 
            />
          </div>
          <div className="flex items-center gap-6 ml-8">
             <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Shield size={12} className="text-purple-400" /> 尾部防禦
             </div>
             <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <TrendingUp size={12} className="text-emerald-400" /> 收租補血
             </div>
          </div>
        </GlassCard>
      </div>

      {/* 雙圖區域：使用更高的空間 */}
      <div className="flex-1 flex gap-8 min-h-0 pb-6">
        <PayoffChart title="反向 VIX 避險組裝" data={shortData} color="text-purple-400" type="short" />
        <div className="flex items-center justify-center">
           <ArrowRightLeft className="text-slate-700" size={32} />
        </div>
        <PayoffChart title="正向 VIX 補血組裝" data={longData} color="text-emerald-400" type="long" />
      </div>
    </div>
  );
}
