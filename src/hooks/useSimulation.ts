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

// ── 核心模擬引擎 ──
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

      const marketContango = calcMarketContango(currentVix, params.baseContango);
      const actualRollYield = marketContango * (-Math.sign(params.leverage));

      if (tradNav > 0) {
        const tradReturn = (vixReturn * params.leverage) + actualRollYield;
        if (tradReturn <= -1) tradNav = 0;
        else {
          tradNav = tradNav * (1 + tradReturn);
          if (tradNav < 0) tradNav = 0;
        }
      }

      if (innNav > 0) {
        let innReturn = 0;
        if (params.leverage < 0) {
          const dynamicPremium = (params.tailRiskPremium / 100) * (currentVix / 20) * absLev / 252;
          innReturn = (vixReturn * params.leverage) + actualRollYield - dynamicPremium;
          const absVixReturn = Math.abs(vixReturn);
          if (vixReturn > 0.30) {
            if (absVixReturn <= 0.50) innReturn += absVixReturn * 0.3 * absLev;
            else if (absVixReturn <= 0.80) innReturn += absVixReturn * 0.6 * absLev;
            else innReturn += absVixReturn * 1.0 * absLev;
          }
        } else if (params.leverage > 0) {
          const dynamicYield = (params.coveredCallYield / 100) * (currentVix / 20) * absLev / 252;
          const cappedVixReturn = Math.min(vixReturn, 0.30);
          innReturn = (cappedVixReturn * params.leverage) + actualRollYield + dynamicYield;
        } else {
          innReturn = actualRollYield;
        }

        if (innReturn <= -1) innNav = 0;
        else {
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

    let innWinDays = 0;
    let tradWinDays = 0;
    let innDiffSum = 0;
    let tradDiffSum = 0;
    const preSwanDays = params.blackSwanDay;

    data.forEach((d, i) => {
      if (d.tradNav > maxTradNav) maxTradNav = d.tradNav;
      if (d.innNav > maxInnNav) maxInnNav = d.innNav;

      const tradDd = maxTradNav > 0 ? (maxTradNav - d.tradNav) / maxTradNav : 0;
      if (tradDd > tradMaxDrawdown) tradMaxDrawdown = tradDd;

      const innDd = maxInnNav > 0 ? (maxInnNav - d.innNav) / maxInnNav : 0;
      if (innDd > innMaxDrawdown) innMaxDrawdown = innDd;

      // 黑天鵝前統計
      if (i < params.blackSwanDay) {
        if (d.innNav > d.tradNav) {
          innWinDays++;
          if (d.tradNav > 0) innDiffSum += (d.innNav - d.tradNav) / d.tradNav;
        } else if (d.tradNav > d.innNav) {
          tradWinDays++;
          if (d.innNav > 0) tradDiffSum += (d.tradNav - d.innNav) / d.innNav;
        }
      }
    });

    return {
      finalTradNav,
      finalInnNav,
      tradMaxDrawdown,
      innMaxDrawdown,
      tradBankrupt: finalTradNav === 0,
      innBankrupt: finalInnNav === 0,
      // 創新領先指標 (用於 Leverage > 0)
      preSwanInnWinRatio: (innWinDays / preSwanDays) * 100,
      preSwanInnOutperformanceAvg: (innDiffSum / Math.max(1, innWinDays)) * 100,
      // 傳統領先指標 (用於 Leverage < 0，展示保費代價)
      preSwanTradWinRatio: (tradWinDays / preSwanDays) * 100,
      preSwanTradOutperformanceAvg: (tradDiffSum / Math.max(1, tradWinDays)) * 100,
    };
  }, [data, params.blackSwanDay]);

  return { data, stats };
}
