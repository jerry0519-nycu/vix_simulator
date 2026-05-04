"use client";

import { useMemo } from "react";

export type SimulationParams = {
  tradingDays: number;
  initialVix: number;
  dailyVol: number;
  baseContango: number;   // 基礎正價差水準 (e.g. 0.15 = 0.15%/day)
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
  marketContango: number; // 當日市場價差狀態 (for debugging / display)
  actualRollYield: number; // 結合槓桿方向後的實際轉倉收益
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

// ── 動態市場價差計算函式 ──
// 根據當前 VIX 價位決定市場處於正價差 (Contango) 或逆價差 (Backwardation)
function calcMarketContango(currentVix: number, baseContango: number): number {
  if (currentVix <= 20) {
    // VIX 低於 20：市場平靜，維持完整正價差
    return baseContango / 100; // 轉換為小數
  } else if (currentVix <= 30) {
    // VIX 20~30：正價差逐步收窄（線性遞減至零）
    return (baseContango / 100) * ((30 - currentVix) / 10);
  } else {
    // VIX > 30：進入逆價差區間，越高逆價差越嚴重
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

    for (let day = 0; day <= params.tradingDays; day++) {
      if (day === 0) {
        const mc = calcMarketContango(currentVix, params.baseContango);
        const ary = mc * (-Math.sign(params.leverage));
        result.push({ day, vix: currentVix, tradNav, innNav, marketContango: mc, actualRollYield: ary });
        continue;
      }

      // ── 1. VIX 價格變化（OU 均值回歸） ──
      let vixReturn = 0;
      if (day === params.blackSwanDay) {
        vixReturn = params.blackSwanSpike / 100;
      } else {
        const z0 = activeShocks[day % activeShocks.length];
        const kappa = 0.05; // 均值回歸速度
        const longTermMean = Number(params.initialVix);
        const drift = kappa * (longTermMean - currentVix) / currentVix;
        vixReturn = drift + z0 * (params.dailyVol / 100);
      }
      currentVix = currentVix * (1 + vixReturn);

      // ── 2. 動態市場價差狀態 ──
      const marketContango = calcMarketContango(currentVix, params.baseContango);

      // ── 3. 實際轉倉收益 = 市場價差 × (-槓桿方向) ──
      // 做空 VIX 期貨時 (leverage < 0)：正價差 → 轉倉賺錢；逆價差 → 轉倉虧錢
      // 做多 VIX 期貨時 (leverage > 0)：正價差 → 轉倉虧錢；逆價差 → 轉倉賺錢
      const actualRollYield = marketContango * (-Math.sign(params.leverage));

      // ── 4. 傳統 ETN 淨值計算 ──
      if (tradNav > 0) {
        const tradEtnReturn = (vixReturn * params.leverage) + actualRollYield;
        if (tradEtnReturn <= -1) {
          tradNav = 0; // 加速清算條款
        } else {
          tradNav = tradNav * (1 + tradEtnReturn);
        }
      }

      // ── 5. 創新避險 ETN 淨值計算 ──
      if (innNav > 0) {
        // 平時：轉倉收益扣除權利金提撥
        let innEtnReturn = (vixReturn * params.leverage) + (actualRollYield * (1 - params.premiumCost / 100));

        // 黑天鵝保護：當 VIX 單日暴漲超過 50% 時，觸發 Gamma 賠付
        if (vixReturn > 0.5) {
          innEtnReturn += (vixReturn * 0.8);
        }

        if (innEtnReturn <= -1) {
          innNav = 0;
        } else {
          innNav = innNav * (1 + innEtnReturn);
        }
      }

      result.push({ day, vix: currentVix, tradNav, innNav, marketContango, actualRollYield });
    }

    return result;
  }, [params, shocks]);

  // ── 統計指標計算 ──
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
