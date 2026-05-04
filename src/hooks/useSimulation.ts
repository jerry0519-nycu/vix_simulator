"use client";

import { useMemo, useRef, useEffect } from "react";

export type SimulationParams = {
  tradingDays: number;
  initialVix: number;
  dailyVol: number;
  rollYield: number;
  leverage: number;
  blackSwanDay: number;
  blackSwanSpike: number;
  premiumCost: number;
};

export type DailyData = {
  day: number;
  vix: number;
  tradNav: number;
  innNav: number;
};

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

export function useSimulation(params: SimulationParams, shocks: number[]) {
  const data = useMemo(() => {
    const result: DailyData[] = [];
    let currentVix = Number(params.initialVix); // Ensure numeric
    let tradNav = 100;
    let innNav = 100;

    // Fallback if shocks is somehow empty (should not happen in normal usage)
    const activeShocks = shocks.length > 0 ? shocks : [0];

    for (let day = 0; day <= params.tradingDays; day++) {
      if (day === 0) {
        result.push({ day, vix: currentVix, tradNav, innNav });
        continue;
      }

      let vixReturn = 0;

      // Check if today is the black swan day
      if (day === params.blackSwanDay) {
        vixReturn = params.blackSwanSpike / 100;
      } else {
        // Ornstein-Uhlenbeck Mean Reverting Process
        const z0 = activeShocks[day % activeShocks.length];
        const kappa = 0.05; // 均值回歸速度 (Speed of mean reversion)
        const longTermMean = Number(params.initialVix); // 將設定的初始價格作為長期均值
        const drift = kappa * (longTermMean - currentVix) / currentVix;
        vixReturn = drift + z0 * (params.dailyVol / 100);
      }

      currentVix = currentVix * (1 + vixReturn);

      // Traditional ETN
      if (tradNav > 0) {
        const tradEtnReturn = (vixReturn * params.leverage) + (params.rollYield / 100);
        // Acceleration Clause: if daily loss >= 100%, it goes to 0
        if (tradEtnReturn <= -1) {
          tradNav = 0;
        } else {
          tradNav = tradNav * (1 + tradEtnReturn);
        }
      }

      // Innovative ETN
      if (innNav > 0) {
        let innEtnReturn = (vixReturn * params.leverage) + ((params.rollYield / 100) * (1 - params.premiumCost / 100));
        
        // Options Gamma Payoff on Black Swan
        if (vixReturn > 0.5) {
          innEtnReturn += (vixReturn * 0.8);
        }

        if (innEtnReturn <= -1) {
          innNav = 0;
        } else {
          innNav = innNav * (1 + innEtnReturn);
        }
      }

      result.push({ day, vix: currentVix, tradNav, innNav });
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
