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

// ── 核心模擬引擎（全天候雙引擎動態避險系統 - 槓桿連動定價版） ──
export function useSimulation(params: SimulationParams, shocks: number[]) {
  const data = useMemo(() => {
    const result: DailyData[] = [];
    let currentVix = Number(params.initialVix);
    let tradNav = 100;
    let innNav = 100;

    const activeShocks = shocks.length > 0 ? shocks : [0];
    const absLev = Math.abs(params.leverage);

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
      const safeVix = Math.max(currentVix, 0.1); 

      if (day === params.blackSwanDay) {
        vixReturn = params.blackSwanSpike / 100;
      } else {
        const z0 = activeShocks[day % activeShocks.length];
        const kappa = 0.05;
        const longTermMean = Number(params.initialVix);
        const drift = kappa * (longTermMean - safeVix) / safeVix;
        vixReturn = drift + z0 * (params.dailyVol / 100);
      }
      currentVix = Math.max(currentVix * (1 + vixReturn), 5);

      // ══════════════════════════════════════════════
      // 步驟 2：動態市場價差 & 實際轉倉收益
      // ══════════════════════════════════════════════
      const marketContango = calcMarketContango(currentVix, params.baseContango);
      const actualRollYield = marketContango * (-Math.sign(params.leverage));

      // ══════════════════════════════════════════════
      // 步驟 3：傳統 ETN 淨值
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
      // 步驟 4：創新 ETN 淨值（槓桿連動定價）
      // ══════════════════════════════════════════════
      if (innNav > 0) {
        let innReturn = 0;

        if (params.leverage < 0) {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 模組 A：槓桿連動尾部防禦 (Short)
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 保費與槓桿掛鉤：風險越高，保費規模越大
          const dynamicPremium = (params.tailRiskPremium / 100) * (currentVix / 20) * absLev / 252;
          innReturn = (vixReturn * params.leverage) + actualRollYield - dynamicPremium;

          // 階梯式賠付也乘上槓桿倍數，確保高槓桿下也能覆蓋虧損
          const absVixReturn = Math.abs(vixReturn);
          if (vixReturn > 0.30) {
            if (absVixReturn <= 0.50) {
              innReturn += absVixReturn * 0.3 * absLev;
            } else if (absVixReturn <= 0.80) {
              innReturn += absVixReturn * 0.6 * absLev;
            } else {
              innReturn += absVixReturn * 1.0 * absLev;
            }
          }

        } else if (params.leverage > 0) {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 模組 B：槓桿連動掩護性買權 (Long)
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // 收租規模隨槓桿放大
          const dynamicYield = (params.coveredCallYield / 100) * (currentVix / 20) * absLev / 252;

          // 上檔封頂維持 30%（代表放棄超過此幅度的 VIX 上漲利潤）
          const cappedVixReturn = Math.min(vixReturn, 0.30);
          innReturn = (cappedVixReturn * params.leverage) + actualRollYield + dynamicYield;

        } else {
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
