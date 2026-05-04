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
  ReferenceDot,
} from "recharts";
import { DailyData } from "@/hooks/useSimulation";

export function TraditionalChart({ data }: { data: DailyData[] }) {
  // Find the exact death cross day where tradNav hits 0
  const deathCrossDay = data.find((d) => d.tradNav === 0);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#64748b' }} />
          <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#64748b' }} domain={[0, 'auto']} />
          <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fill: '#64748b' }} domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} allowDataOverflow={true} />
          <Tooltip 
            formatter={(value: number) => value.toFixed(2)}
            contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.9)', borderColor: '#4c1d95', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="tradNav"
            name="傳統 ETN 淨值"
            stroke="#fb7185"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="vix"
            name="VIX 指數"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 4"
            isAnimationActive={false}
          />
          {deathCrossDay && (
            <ReferenceDot 
              yAxisId="left" 
              x={deathCrossDay.day} 
              y={0} 
              r={6} 
              fill="#ef4444" 
              stroke="#fff" 
              strokeWidth={2} 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
