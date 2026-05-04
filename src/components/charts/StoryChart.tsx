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
  showTradShort: boolean;
  showTradLong: boolean;
  showInnShort: boolean;
  showInnLong: boolean;
};

export function StoryChart({ 
  data, 
  maxDays, 
  showTradShort, 
  showTradLong, 
  showInnShort, 
  showInnLong 
}: StoryChartProps) {
  const yAxisWidth = 50;

  return (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 flex flex-col">
        {/* Top Chart: ETN NAVs (60% Height) */}
        <ResponsiveContainer width="100%" height="60%">
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
            
            {/* 傳統反向：改為實線，較細 */}
            {showTradShort && (
              <Line yAxisId="left" type="monotone" dataKey="tradShort" name="傳統反向 (-1x)" stroke="#f43f5e" strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.4} />
            )}
            {/* 創新反向：紫色厚實線 */}
            {showInnShort && (
              <Line yAxisId="left" type="monotone" dataKey="innShort" name="創新反向 (-1x)" stroke="#a855f7" strokeWidth={4} dot={false} isAnimationActive={false} />
            )}
            
            {/* 傳統正向：改為實線，較細 */}
            {showTradLong && (
              <Line yAxisId="left" type="monotone" dataKey="tradLong" name="傳統正向 (+1x)" stroke="#ef4444" strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.4} />
            )}
            {/* 創新正向：翡翠厚實線 */}
            {showInnLong && (
              <Line yAxisId="left" type="monotone" dataKey="innLong" name="創新正向 (+1x)" stroke="#10b981" strokeWidth={4} dot={false} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Bottom Chart: VIX (40% Height) */}
        <ResponsiveContainer width="100%" height="40%">
          <LineChart data={data} syncId="story-sync" margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.02)" />
            <XAxis dataKey="day" type="number" domain={[0, maxDays]} stroke="#475569" tick={{ fill: '#475569', fontSize: 11 }} />
            <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fill: '#38bdf8', fontSize: 11 }} domain={[0, 60]} ticks={[0, 20, 40, 60]} width={yAxisWidth} />
            <Line yAxisId="left" type="monotone" dataKey="vix" name="VIX 指數" stroke="#38bdf8" strokeWidth={1.5} dot={false} opacity={0.3} isAnimationActive={false} />
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.95)', border: '1px solid #0ea5e9', color: '#fff', borderRadius: '12px' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
