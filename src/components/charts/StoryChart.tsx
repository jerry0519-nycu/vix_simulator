"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxisProps
} from "recharts";

type StoryChartProps = {
  data: any[];
  maxDays: number;
  showTrad: boolean;
  showInnNeg1: boolean;
  showInnPos1: boolean;
};

export function StoryChart({ 
  data, 
  maxDays, 
  showTrad, 
  showInnNeg1, 
  showInnPos1 
}: StoryChartProps) {
  
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="day" 
            type="number" 
            domain={[0, maxDays]} 
            hide
          />
          <YAxis 
            yAxisId="left"
            domain={[0, 'auto']}
            stroke="#475569"
            fontSize={11}
            tickFormatter={(val) => `$${val}`}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 'auto']}
            hide
          />
          <Tooltip
            isAnimationActive={false}
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            itemStyle={{ fontSize: '11px' }}
          />

          {/* VIX 背景輔助線 */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="vix"
            stroke="#3b82f6"
            strokeWidth={1}
            dot={false}
            opacity={0.1}
            strokeDasharray="4 4"
            isAnimationActive={false}
          />

          {/* 傳統 ETN 線 */}
          {showTrad && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tradNav"
              stroke="#f43f5e"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
          )}

          {/* 創新避險型 -1x */}
          {showInnNeg1 && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="innNeg1"
              stroke="#a855f7"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          )}

          {/* 創新補血型 +1x */}
          {showInnPos1 && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="innPos1"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
