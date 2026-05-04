"use client";

import { useMemo } from "react";

export type SimulationParams = {
  tradingDays: number;
  initialVix: number;
  dailyVol: number;
  baseContango: number;        // 基礎正價差水準 (%/天)
  leverage: number;
  blackSwanDay: number;
  blackSwanSpike: number;
  tailRiskPremium: number;     // 尾部保費提撥比例 (%), leverage < 0 時使用
  coveredCallYield: number;    // 掩護性買權收租率 (%), leverage > 0 時使用
};

export type DailyData = {
  day: number;
  vix: number;
  tradNav: number;
  innNav: number;
  marketContango: number;
  actualRollYield: number;
};

// ── Box-Muller 標準常態亂數產生器 ──
export function useShocks(seed: number, length: number = 1500) {
  return useMemo(() => {
    const shocks = [];
    for (let i = 0; i < length; i++) {
      let u1 = Math.random();
      let u2 = Math.random();
      if (u1 === 0) u1 = 0.0001;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      shocks.push(z0);
    }
    return shocks;
  }, [seed, length]);
}

// ── 動態市場價差計算 ──
function calcMarketContango(currentVix: number, baseContango: number): number {
  if (currentVix <= 20) {
    return baseContango / 100;
  } else if (currentVix <= 30) {
    return (baseContango / 100) * ((30 - currentVix) / 10);
  } else {
    return -0.002 * (currentVix - 30);
  }
}

// ── 核心模擬引擎（全天候雙引擎動態避險系統） ──
export function useSimulation(params: SimulationParams, shocks: number[]) {
  const data = useMemo(() => {
    const result: DailyData[] = [];
    let currentVix = Number(params.initialVix);
    let tradNav = 100;
    let innNav = 100;

    const activeShocks = shocks.length > 0 ? shocks : [0];

    for (let day = 0; day <= params.tradingDays; day++) {
      if (day === 0) {
        const mc = calcMarketContango(currentVix, params.baseContango);
        const ary = mc * (-Math.sign(params.leverage));
        result.push({ day, vix: currentVix, tradNav, innNav, marketContango: mc, actualRollYield: ary });
        continue;
      }

      // ══════════════════════════════════════════════
      // 步驟 1：VIX 價格變化（OU 均值回歸）
      // ══════════════════════════════════════════════
      let vixReturn = 0;
      if (day === params.blackSwanDay) {
        vixReturn = params.blackSwanSpike / 100;
      } else {
        const z0 = activeShocks[day % activeShocks.length];
        const kappa = 0.05;
        const longTermMean = Number(params.initialVix);
        const drift = kappa * (longTermMean - currentVix) / currentVix;
        vixReturn = drift + z0 * (params.dailyVol / 100);
      }
      currentVix = currentVix * (1 + vixReturn);

      // ══════════════════════════════════════════════
      // 步驟 2：動態市場價差 & 實際轉倉收益
      // ══════════════════════════════════════════════
      const marketContango = calcMarketContango(currentVix, params.baseContango);
      const actualRollYield = marketContango * (-Math.sign(params.leverage));

      // ══════════════════════════════════════════════
      // 步驟 3：傳統 ETN 淨值（不含任何保護機制）
      // ══════════════════════════════════════════════
      if (tradNav > 0) {
        const tradReturn = (vixReturn * params.leverage) + actualRollYield;
        if (tradReturn <= -1) {
          tradNav = 0;
        } else {
          tradNav = tradNav * (1 + tradReturn);
          if (tradNav < 0) tradNav = 0;
        }
      }

      // ══════════════════════════════════════════════
      // 步驟 4：創新 ETN 淨值（雙引擎動態避險）
      // ══════════════════════════════════════════════
      if (innNav > 0) {
        let innReturn = 0;

        if (params.leverage < 0) {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 模組 A：階梯式尾部防禦引擎 (做空模式)
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 動態保費：VIX 越高 → 選擇權隱含波動率越高 → 保費越貴
          const dynamicPremium = (params.tailRiskPremium / 100) * (currentVix / 20) / 252;
          innReturn = (vixReturn * params.leverage) + actualRollYield - dynamicPremium;

          // 階梯式 Gamma 賠付（VIX 暴漲時選擇權啟動）
          const absVixReturn = Math.abs(vixReturn);
          if (vixReturn > 0.30) {
            if (absVixReturn <= 0.50) {
              // 第一層：輕度異常 (30%~50%)
              innReturn += absVixReturn * 0.3;
            } else if (absVixReturn <= 0.80) {
              // 第二層：嚴重異常 (50%~80%)
              innReturn += absVixReturn * 0.6;
            } else {
              // 第三層：極端黑天鵝 (>80%)
              innReturn += absVixReturn * 1.0;
            }
          }

        } else if (params.leverage > 0) {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 模組 B：掩護性買權補血引擎 (做多模式)
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 動態收租：VIX 越高 → 選擇權權利金越貴 → 收租越多
          const dynamicYield = (params.coveredCallYield / 100) * (currentVix / 20) / 252;

          // 上檔封頂：因為賣出了買權，極端上漲的利潤被讓渡
          const cappedVixReturn = Math.min(vixReturn, 0.30);
          innReturn = (cappedVixReturn * params.leverage) + actualRollYield + dynamicYield;

        } else {
          // leverage === 0：無槓桿，創新與傳統相同
          innReturn = actualRollYield;
        }

        if (innReturn <= -1) {
          innNav = 0;
        } else {
          innNav = innNav * (1 + innReturn);
          if (innNav < 0) innNav = 0;
        }
      }

      result.push({ day, vix: currentVix, tradNav, innNav, marketContango, actualRollYield });
    }

    return result;
  }, [params, shocks]);

  // ── 統計指標 ──
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const finalTradNav = data[data.length - 1].tradNav;
    const finalInnNav = data[data.length - 1].innNav;

    let maxTradNav = 0;
    let maxInnNav = 0;
    let tradMaxDrawdown = 0;
    let innMaxDrawdown = 0;

    data.forEach(d => {
      if (d.tradNav > maxTradNav) maxTradNav = d.tradNav;
      if (d.innNav > maxInnNav) maxInnNav = d.innNav;

      const tradDd = maxTradNav > 0 ? (maxTradNav - d.tradNav) / maxTradNav : 0;
      if (tradDd > tradMaxDrawdown) tradMaxDrawdown = tradDd;

      const innDd = maxInnNav > 0 ? (maxInnNav - d.innNav) / maxInnNav : 0;
      if (innDd > innMaxDrawdown) innMaxDrawdown = innDd;
    });

    return {
      finalTradNav,
      finalInnNav,
      tradMaxDrawdown,
      innMaxDrawdown,
      tradBankrupt: finalTradNav === 0,
      innBankrupt: finalInnNav === 0,
    };
  }, [data]);

  return { data, stats };
}
