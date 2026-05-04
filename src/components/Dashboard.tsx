"use client";

import React, { useState } from "react";
import { SimulationParams, DailyData } from "@/hooks/useSimulation";
import { GlassCard } from "./ui/GlassCard";
import { TraditionalChart } from "./charts/TraditionalChart";
import { InnovativeChart } from "./charts/InnovativeChart";
import { StoryMode } from "./StoryMode";
import { ReplicationMode } from "./ReplicationMode";
import { TrendingDown, ShieldCheck, AlertTriangle } from "lucide-react";

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

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pb-8 pr-2 custom-scrollbar">
      {/* Hero Header */}
      <div className="relative p-6 rounded-2xl border border-white/[0.05] bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden shadow-2xl shrink-0">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none"></div>
        
        <h1 className="text-3xl font-light tracking-widest text-slate-100 flex items-center gap-4">
          <span className="w-10 h-[2px] bg-gradient-to-r from-teal-400 to-purple-500"></span>
          量化避險：尾部動態反向 VIX 模擬器
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab("traditional")}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === "traditional"
              ? "bg-blue-600/50 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/50"
              : "glass-panel text-slate-400 hover:text-white"
          }`}
        >
          傳統商品解析
        </button>
        <button
          onClick={() => setActiveTab("innovative")}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === "innovative"
              ? "bg-teal-600/50 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)] border border-teal-400/50"
              : "glass-panel text-slate-400 hover:text-white"
          }`}
        >
          創新商品對照
        </button>
        <button
          onClick={() => setActiveTab("replication")}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === "replication"
              ? "bg-indigo-600/50 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400/50"
              : "glass-panel text-slate-400 hover:text-white"
          }`}
        >
          結構拆解與定價
        </button>
        <button
          onClick={() => setActiveTab("story")}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
            activeTab === "story"
              ? "bg-purple-600/50 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400/50"
              : "glass-panel text-slate-400 hover:text-white"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          情境動畫展演
        </button>
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
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/40 to-transparent"></div>
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                動態正價差收益
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">VIX 低於 20 時市場處於正價差，做空端每日轉倉賺取溢價 ({params.baseContango}%/天)。VIX 20~30 時正價差逐步收窄；VIX 超過 30 則轉為逆價差，做空端反而因轉倉而虧損。</p>
            </GlassCard>
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/40 to-transparent"></div>
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]"></span>
                每日重平衡機制
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">為了維持固定的槓桿倍數 (例如 -1x)，基金必須每天進行資產重平衡。這會導致在波動市場中產生「波動耗損 (Volatility Drag)」。</p>
            </GlassCard>
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/40 to-transparent"></div>
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                無限尾部風險
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">當 VIX 飆升的「黑天鵝」事件發生時缺乏下檔保護。若單日虧損達 100%，將觸發加速清算條款，引發流動性踩踏使淨值歸零。</p>
            </GlassCard>
          </div>
          
          <GlassCard className="!bg-black/40 border-white/[0.02]">
            <h4 className="text-xs tracking-widest uppercase font-semibold text-blue-400/70 mb-3">數學運算邏輯</h4>
            <code className="text-[13px] text-slate-300/80 block font-mono leading-loose">
              <span className="text-blue-300/80">▸ 動態市場價差狀態：</span><br/>
              　VIX ≤ 20 → 正價差 = 基礎正價差 ({params.baseContango}%/天)<br/>
              　20 &lt; VIX ≤ 30 → 正價差 = 基礎正價差 × (30 - VIX) / 10<br/>
              　VIX &gt; 30 → 逆價差 = -0.2% × (VIX - 30)<br/><br/>
              <span className="text-blue-300/80">▸ 實際轉倉收益 = 市場價差 × (-槓桿方向)</span><br/>
              　做空 (槓桿&lt;0)：正價差賺、逆價差虧<br/><br/>
              <span className="text-blue-300/80">▸ 每日報酬 = (VIX 變動率 × 槓桿) + 實際轉倉收益</span><br/>
              　今日淨值 = 昨日淨值 × (1 + 每日報酬)<br/>
              <span className="text-red-400/80 mt-1 block text-xs tracking-wide">※ 若單日報酬 ≤ -100%，淨值強制歸零（加速清算條款）</span>
            </code>
          </GlassCard>

          <GlassCard>
            <h4 className="text-lg font-semibold mb-4 text-slate-200">VIX 走勢 vs. 傳統 ETN 淨值走勢</h4>
            <TraditionalChart data={data} />
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="text-center">
              <p className="text-sm text-slate-400 mb-1">最終淨值 (Final NAV)</p>
              <p className={`text-3xl font-bold ${stats.tradBankrupt ? 'text-red-500' : 'text-green-400'}`}>
                ${stats.finalTradNav.toFixed(2)}
              </p>
            </GlassCard>
            <GlassCard className="text-center">
              <p className="text-sm text-slate-400 mb-1">最大回撤</p>
              <p className="text-3xl font-bold text-orange-400">
                {(stats.tradMaxDrawdown * 100).toFixed(2)}%
              </p>
            </GlassCard>
            <GlassCard className="text-center">
              <p className="text-sm text-slate-400 mb-1">破產狀態</p>
              <p className={`text-3xl font-bold ${stats.tradBankrupt ? 'text-red-500' : 'text-green-400'}`}>
                {stats.tradBankrupt ? "已清算歸零" : "存活"}
              </p>
            </GlassCard>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/40 to-transparent"></div>
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span>
                核心反向策略
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">與傳統商品相同，主要透過做空 VIX 期貨來賺取穩定轉倉收益，捕捉市場長期平靜時的利潤。</p>
            </GlassCard>
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/40 to-transparent"></div>
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></span>
                提撥避險成本
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">將每日轉倉收益強制提撥固定比例 ({params.premiumCost}%) 去買入極度價外的 VIX 買權 (Deep OTM Call)，將「無限風險」轉為「有限風險」。</p>
            </GlassCard>
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/40 to-transparent"></div>
              <h3 className="text-lg font-light tracking-wide mb-3 text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                Gamma 賠付保護
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light">犧牲了平時些微的獲利速度。但當黑天鵝發生時，選擇權的 Gamma 巨幅賠付將能成功阻止清算歸零，保全大部分本金。</p>
            </GlassCard>
          </div>

          <GlassCard className="!bg-black/40 border-white/[0.02]">
            <h4 className="text-xs tracking-widest uppercase font-semibold text-teal-400/70 mb-3">數學運算邏輯</h4>
            <code className="text-[13px] text-slate-300/80 block font-mono leading-loose">
              <span className="text-teal-300/80">▸ 平時報酬 = (VIX 變動率 × 槓桿) + [實際轉倉收益 × (1 - 權利金提撥 {params.premiumCost}%)]</span><br/>
              　實際轉倉收益 = 動態市場價差 × (-槓桿方向)<br/><br/>
              <span className="text-teal-300/80">▸ 黑天鵝觸發條件：VIX 單日暴漲 &gt; 50%</span><br/>
              　賠付報酬 = 平時報酬 + <span className="text-emerald-300">Gamma 賠付 (VIX 暴漲幅度 × 0.8)</span><br/><br/>
              　今日淨值 = 昨日淨值 × (1 + 當日報酬)
            </code>
          </GlassCard>

          <GlassCard>
            <h4 className="text-lg font-semibold mb-4 text-slate-200">VIX、傳統 ETN 與 創新 ETN 對照</h4>
            <InnovativeChart data={data} />
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="text-center">
              <p className="text-sm text-slate-400 mb-1">最終淨值 (Innovative NAV)</p>
              <p className={`text-3xl font-bold ${stats.innBankrupt ? 'text-red-500' : 'text-teal-400'}`}>
                ${stats.finalInnNav.toFixed(2)}
              </p>
            </GlassCard>
            <GlassCard className="text-center">
              <p className="text-sm text-slate-400 mb-1">最大回撤</p>
              <p className="text-3xl font-bold text-orange-400">
                {(stats.innMaxDrawdown * 100).toFixed(2)}%
              </p>
            </GlassCard>
            <GlassCard className="text-center">
              <p className="text-sm text-slate-400 mb-1">破產狀態</p>
              <p className={`text-3xl font-bold ${stats.innBankrupt ? 'text-red-500' : 'text-teal-400'}`}>
                {stats.innBankrupt ? "已清算歸零" : "成功避險存活"}
              </p>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
