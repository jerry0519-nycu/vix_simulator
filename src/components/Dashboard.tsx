"use client";

import React, { useState } from "react";
import { SimulationParams, DailyData } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { TraditionalChart } from "./charts/TraditionalChart";
import { InnovativeChart } from "./charts/InnovativeChart";
import { StoryMode } from "./StoryMode";
import { ReplicationMode } from "./ReplicationMode";
import { Zap, ShieldCheck, Activity, Target, TrendingUp, Percent, AlertCircle } from "lucide-react";

type DashboardProps = {
  data: DailyData[];
  stats: any;
  params: SimulationParams;
  activeTab: "traditional" | "innovative" | "replication" | "story";
  setActiveTab: (tab: "traditional" | "innovative" | "replication" | "story") => void;
  shocks: number[];
};

export function Dashboard({ data, stats, params, activeTab, setActiveTab, shocks }: DashboardProps) {
  if (!stats) return null;

  const isShort = params.leverage < 0;

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pb-8 pr-2 custom-scrollbar">
      {/* Hero Header */}
      <div className="relative p-6 rounded-2xl border border-white/[0.05] bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden shadow-2xl shrink-0">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none"></div>
        <h1 className="text-3xl font-light tracking-widest text-slate-100 flex items-center gap-4">
          <span className="w-10 h-[2px] bg-gradient-to-r from-teal-400 to-purple-500"></span>
          量化避險：全天候動態 VIX 模擬器
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4">
        {["traditional", "innovative", "replication", "story"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === tab
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20"
                : "glass-panel text-slate-400 hover:text-white"
            }`}
          >
            {tab === "traditional" && "傳統商品解析"}
            {tab === "innovative" && "創新商品對照"}
            {tab === "replication" && "結構拆解與定價"}
            {tab === "story" && "情境動畫展演"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "story" ? (
        <div className="flex-1 animate-in fade-in zoom-in duration-500 min-h-0">
          <StoryMode data={data} params={params} shocks={shocks} />
        </div>
      ) : activeTab === "replication" ? (
        <div className="flex-1 animate-in fade-in zoom-in duration-500 min-h-0">
          <ReplicationMode />
        </div>
      ) : activeTab === "traditional" ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="border-l-4 border-blue-500">
              <h3 className="text-lg font-light mb-3 text-slate-100">動態正價差收益</h3>
              <p className="text-slate-400 text-sm font-light">VIX 低於 20 時市場處於正價差，做空端每日轉倉賺取溢價 ({params.baseContango}%/天)。</p>
            </GlassCard>
            <GlassCard className="border-l-4 border-orange-500">
              <h3 className="text-lg font-light mb-3 text-slate-100">每日重平衡機制</h3>
              <p className="text-slate-400 text-sm font-light">為了維持固定槓桿 ({params.leverage}x)，基金必須每天重平衡，這會產生波動耗損。</p>
            </GlassCard>
            <GlassCard className="border-l-4 border-red-500">
              <h3 className="text-lg font-light mb-3 text-slate-100">無限尾部風險</h3>
              <p className="text-slate-400 text-sm font-light">黑天鵝發生時缺乏保護。若單日虧損達 100%，將觸發加速清算條款淨值歸零。</p>
            </GlassCard>
          </div>
          <GlassCard>
            <h4 className="text-lg font-semibold mb-4 text-slate-200 font-mono tracking-tighter">TRADITIONAL BENCHMARK PERFORMANCE</h4>
            <TraditionalChart data={data} />
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className={`p-4 rounded-xl border flex items-center justify-between ${isShort ? 'bg-purple-500/10 border-purple-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isShort ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isShort ? <ShieldCheck size={24} /> : <Zap size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  當前引擎：{isShort ? '模組 A - 階梯式尾部防禦' : '模組 B - 掩護性買權補血'}
                </h3>
                <p className="text-sm text-slate-400">
                  {isShort ? '側重：防禦極端黑天鵝。代價是平時的保費支出。' : '側重：優化持有體驗。優勢是平時的權利金收入。'}
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className={`text-2xl font-bold ${isShort ? 'text-purple-400' : 'text-emerald-400'}`}>
                {params.leverage}x
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                <Activity size={16} /> 即時模擬走勢 (傳統 vs 創新)
              </h4>
              <div className="h-[350px]">
                <InnovativeChart data={data} />
              </div>
            </GlassCard>
            
            <div className="grid grid-cols-2 gap-4">
              {isShort ? (
                <>
                  <GlassCard className="flex flex-col justify-center items-center p-6 border-t-2 border-t-rose-500">
                    <AlertCircle size={24} className="text-rose-400 mb-2" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter text-center">平時保費代價 (Trad &gt; Inn)</p>
                    <p className="text-4xl font-bold font-mono text-white">
                      {stats.preSwanTradWinRatio.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">天數佔比</p>
                  </GlassCard>
                  <GlassCard className="flex flex-col justify-center items-center p-6 border-t-2 border-t-orange-500">
                    <Activity size={24} className="text-orange-400 mb-2" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter text-center">平均落後幅度</p>
                    <p className="text-4xl font-bold font-mono text-white">
                      -{stats.preSwanTradOutperformanceAvg.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">保費成本影響</p>
                  </GlassCard>
                </>
              ) : (
                <>
                  <GlassCard className="flex flex-col justify-center items-center p-6 border-t-2 border-t-emerald-500">
                    <TrendingUp size={24} className="text-emerald-400 mb-2" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter text-center">平時補血效益 (Inn &gt; Trad)</p>
                    <p className="text-4xl font-bold font-mono text-white">
                      {stats.preSwanInnWinRatio.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">天數佔比</p>
                  </GlassCard>
                  <GlassCard className="flex flex-col justify-center items-center p-6 border-t-2 border-t-teal-500">
                    <Percent size={24} className="text-teal-400 mb-2" />
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter text-center">平均領先幅度</p>
                    <p className="text-4xl font-bold font-mono text-white">
                      +{stats.preSwanInnOutperformanceAvg.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">收租增益影響</p>
                  </GlassCard>
              )}
              
              <GlassCard className="col-span-2 p-6 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-3">
                   <p className="text-xs text-slate-500 uppercase">黑天鵝事件最終生存狀態</p>
                   <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${stats.innBankrupt ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {stats.innBankrupt ? '歸零陣亡' : '成功存續'}
                   </div>
                </div>
                <div className="flex items-end gap-4">
                   <div className="flex-1">
                      <p className="text-2xl font-bold text-slate-100 font-mono">${stats.finalInnNav.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">創新 ETN 最終淨值</p>
                   </div>
                   <div className="flex-1 border-l border-white/10 pl-4">
                      <p className="text-2xl font-bold text-slate-400 font-mono">${stats.finalTradNav.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">傳統 ETN 最終淨值</p>
                   </div>
                </div>
              </GlassCard>
            </div>
          </div>

          <GlassCard className="!bg-black/40">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">風險與成本告知 (Risk Disclosure)</h4>
             <p className="text-[12px] text-slate-400 leading-relaxed font-light italic">
                {isShort 
                  ? "在 VIX 處於正價差的平穩期，為了維持「階梯式尾部防禦」，創新商品需持續支付保費，這會導致其淨值在多數時間內略低於傳統商品。然而，這正是為了換取在極端黑天鵝事件中的生存權。"
                  : "「掩護性買權補血」策略在平穩期能有效優化收益，但當 VIX 發生極端單日暴漲時，其獲利將被封頂於 30%，投資者相當於以放棄超額尾部收益為代價，換取平時更穩健的持倉體驗。"
                }
             </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
