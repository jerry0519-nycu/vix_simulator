"use client";

import React, { useState } from "react";
import { SimulationParams, DailyData } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { TraditionalChart } from "./charts/TraditionalChart";
import { InnovativeChart } from "./charts/InnovativeChart";
import { StoryMode } from "./StoryMode";
import { ReplicationMode } from "./ReplicationMode";
import { Zap, ShieldCheck, Activity, Target } from "lucide-react";

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
          {/* 傳統頁內容省略部分，保持原樣但更新標題 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="relative overflow-hidden border-l-4 border-blue-500">
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">動態正價差收益</h3>
              <p className="text-slate-400 text-sm font-light">VIX 低於 20 時市場處於正價差，做空端每日轉倉賺取溢價 ({params.baseContango}%/天)。</p>
            </GlassCard>
            <GlassCard className="relative overflow-hidden border-l-4 border-orange-500">
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">每日重平衡機制</h3>
              <p className="text-slate-400 text-sm font-light">為了維持固定槓桿 ({params.leverage}x)，基金必須每天重平衡，這會產生波動耗損。</p>
            </GlassCard>
            <GlassCard className="relative overflow-hidden border-l-4 border-red-500">
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">無限尾部風險</h3>
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
          {/* 引擎狀態條 */}
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
                  {isShort ? '目標：在黑天鵝事件中保全本金並防止歸零。' : '目標：降低做多 VIX 時的正價差慢性耗損。'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block uppercase tracking-widest mb-1">槓桿狀態</span>
              <span className={`text-2xl font-mono font-bold ${isShort ? 'text-purple-400' : 'text-emerald-400'}`}>
                {params.leverage}x {isShort ? 'INVERSE' : 'LONG'}
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
              <GlassCard className="flex flex-col justify-center items-center p-6 border-t-2 border-t-blue-500">
                <Target size={24} className="text-blue-400 mb-2" />
                <p className="text-xs text-slate-500 uppercase tracking-tighter">最終淨值 (NAV)</p>
                <p className={`text-4xl font-bold font-mono ${stats.innBankrupt ? 'text-red-500' : 'text-white'}`}>
                  ${stats.finalInnNav.toFixed(2)}
                </p>
              </GlassCard>
              <GlassCard className="flex flex-col justify-center items-center p-6 border-t-2 border-t-orange-500">
                <Activity size={24} className="text-orange-400 mb-2" />
                <p className="text-xs text-slate-500 uppercase tracking-tighter">最大回撤改善</p>
                <p className="text-4xl font-bold font-mono text-white">
                  {((stats.tradMaxDrawdown - stats.innMaxDrawdown) * 100).toFixed(1)}%
                </p>
              </GlassCard>
              <GlassCard className="col-span-2 flex items-center justify-between p-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase">存活與獲利效率</p>
                  <p className="text-lg text-slate-200">
                    {stats.innBankrupt ? "避險失敗（極端壓力）" : (isShort ? "成功抵禦黑天鵝" : "顯著緩解耗損")}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg text-sm font-bold ${stats.finalInnNav > stats.finalTradNav ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {stats.finalInnNav > stats.finalTradNav ? '跑贏傳統型' : '跑輸傳統型'}
                </div>
              </GlassCard>
            </div>
          </div>

          <GlassCard className="!bg-black/40">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">數學演算邏輯細節</h4>
             <div className="grid grid-cols-2 gap-8 text-[13px] font-mono leading-relaxed">
                <div className="space-y-2 border-r border-white/5 pr-4">
                   <p className="text-blue-400 font-bold">● 傳統模型基石</p>
                   <p className="text-slate-400">報酬 = (VIX %Δ × {params.leverage}) + 轉倉收益</p>
                   <p className="text-slate-400">轉倉 = 市場正價差 × (-槓桿方向)</p>
                </div>
                <div className="space-y-2">
                   <p className={`${isShort ? 'text-purple-400' : 'text-emerald-400'} font-bold`}>
                      ● 創新{isShort ? '避險' : '補血'}引擎
                   </p>
                   {isShort ? (
                     <p className="text-slate-400 italic">階梯賠付: 30%/50%/80% 觸發 0.3x/0.6x/1.0x 補償</p>
                   ) : (
                     <p className="text-slate-400 italic">上檔限制: VIX 單日漲幅貢獻封頂於 30%</p>
                   )}
                   <p className="text-slate-400">動態{isShort ? '保費' : '收租'} = 基準率 × (VIX/20)</p>
                </div>
             </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
