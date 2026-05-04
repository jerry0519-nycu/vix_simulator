"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type StoryChartProps = {
  data: any[];
  maxDays: number;
  showTrad: boolean;
  showInn: boolean;
  showAlt?: boolean;
};

export function StoryChart({ data, maxDays, showTrad, showInn, showAlt }: StoryChartProps) {
  const yAxisWidth = 50;

  return (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 flex flex-col">
        {/* Top Chart: ETN NAVs (75% Height) */}
        <ResponsiveContainer width="100%" height="75%">
          <LineChart data={data} syncId="story-sync" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" type="number" domain={[0, maxDays]} stroke="#64748b" tick={false} hide />
            <YAxis 
              yAxisId="left" stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              domain={[0, 'auto']} 
              width={yAxisWidth}
            />
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.95)', border: '1px solid #334155', color: '#fff', borderRadius: '12px' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            {showTrad && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="tradNav" 
                name="傳統型 (Benchmark)" 
                stroke="#f43f5e" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                dot={false} 
                isAnimationActive={false} 
              />
            )}
            
            {showInn && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="innNav" 
                name="創新反向 (-1x)" 
                stroke="#a855f7" 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={false} 
              />
            )}

            {showAlt && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="altInnNav" 
                name="創新正向 (+1x)" 
                stroke="#10b981" 
                strokeWidth={4} 
                dot={false} 
                isAnimationActive={false} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Bottom Chart: VIX (25% Height) */}
        <ResponsiveContainer width="100%" height="25%">
          <LineChart data={data} syncId="story-sync" margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.02)" />
            <XAxis dataKey="day" type="number" domain={[0, maxDays]} stroke="#475569" tick={{ fill: '#475569', fontSize: 11 }} />
            <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fill: '#38bdf8', fontSize: 11 }} domain={[0, 60]} ticks={[0, 30, 60]} width={yAxisWidth} />
            <Line yAxisId="left" type="monotone" dataKey="vix" name="VIX 指數" stroke="#38bdf8" strokeWidth={1} dot={false} opacity={0.4} strokeDasharray="4 4" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
