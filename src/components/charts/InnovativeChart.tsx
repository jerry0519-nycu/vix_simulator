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
import { DailyData } from "@/hooks/useSimulation";

export function InnovativeChart({ data }: { data: DailyData[] }) {
  // 檢查是否正在做多或做空 (簡化判斷，通常傳入 props 更好，這裡先直接觀察最後一天的數值)
  // 為了精確度，我們假設 tradNav 下降而 vix 上升時為做空
  
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" stroke="#475569" fontSize={12} />
          <YAxis yAxisId="left" stroke="#475569" fontSize={12} domain={[0, 'auto']} />
          <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={12} domain={[0, 80]} hide />
          <Tooltip 
            formatter={(value: number) => value.toFixed(2)}
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
          />
          <Legend verticalAlign="top" height={36}/>
          
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="tradNav"
            name="傳統型 ETN"
            stroke="#f43f5e"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
            isAnimationActive={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="innNav"
            name="創新避險型 ETN"
            stroke="#10b981"
            strokeWidth={4}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="vix"
            name="VIX 指數 (右軸)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            opacity={0.3}
            strokeDasharray="8 4"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
