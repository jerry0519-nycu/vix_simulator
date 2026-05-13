"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { useSimulation, useShocks, SimulationParams } from "@/hooks/useSimulation";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [seed, setSeed] = useState(0);
  const [activeTab, setActiveTab] = useState<"traditional" | "innovative" | "replication" | "story">("traditional");
  const [params, setParams] = useState<SimulationParams>({
    tradingDays: 252,
    initialVix: 15,
    dailyVol: 2.5,
    baseContango: 0.25,
    leverage: -1.0,
    blackSwanDay: 200,
    blackSwanSpike: 75,
    tailRiskPremium: 10,
    coveredCallYield: 10,
  });

  const shocks = useShocks(seed);
  const { data, stats } = useSimulation(params, shocks);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-screen w-full items-center justify-center text-slate-400">Loading Simulation...</div>;
  }

  return (
    <main className="relative flex h-screen w-full p-6 overflow-hidden">
      {/* Ambient Glow Effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[50%] bg-teal-600/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      
      <div className="relative z-10 flex h-full w-full space-x-6">
        {activeTab !== "story" && activeTab !== "replication" && (
          <Sidebar params={params} setParams={setParams} onRegenerate={() => setSeed(s => s + 1)} />
        )}
        <Dashboard 
          data={data} 
          stats={stats} 
          params={params} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          shocks={shocks} 
        />
      </div>
    </main>
  );
}
