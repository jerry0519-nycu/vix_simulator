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
  isZoomed?: boolean;
  zoomMin?: number | '';
  zoomMax?: number | '';
};

export function StoryChart({ data, maxDays, showTrad, showInn, showAlt, isZoomed, zoomMin, zoomMax }: StoryChartProps) {
  // To ensure the two charts align perfectly vertically, we force the YAxis to have the same width.
  const yAxisWidth = 50;

  const domainMin = isZoomed ? (zoomMin === '' || zoomMin === undefined ? 'auto' : zoomMin) : 0;
  const domainMax = isZoomed ? (zoomMax === '' || zoomMax === undefined ? 'auto' : zoomMax) : 'auto';

  return (
    // The relative + absolute wrapper prevents the famous Recharts "infinite growing" bug in flex containers
    <div className="w-full h-full relative">
      <div className="absolute inset-0 flex flex-col">
        {/* Top Chart: ETN NAVs (70% Height) */}
        <ResponsiveContainer width="100%" height="70%">
          <LineChart data={data} syncId="story-sync" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
            {/* Hide X-axis tick labels to save space, but keep the axis line */}
            <XAxis 
              dataKey="day" 
              type="number" 
              domain={[0, maxDays]} 
              stroke="#64748b" 
              tick={false}
              allowDataOverflow={false}
            />
            <YAxis 
              yAxisId="left" 
              stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              domain={[domainMin, domainMax]} 
              width={yAxisWidth}
              allowDataOverflow={true}
            />
            
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.9)', borderColor: '#4c1d95', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '14px' }} />
            
            {showTrad && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tradNav"
                name="傳統 ETN"
                stroke="#fb7185"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {showInn && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="innNav"
                name="基準創新 ETN"
                stroke="#34d399"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showAlt && (
              <>
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="altTradNav"
                  name="假設傳統 ETN"
                  stroke="#eab308"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="altInnNav"
                  name="假設創新 ETN"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Bottom Chart: VIX (30% Height) */}
        <ResponsiveContainer width="100%" height="30%">
          <LineChart data={data} syncId="story-sync" margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.02)" />
            <XAxis 
              dataKey="day" 
              type="number" 
              domain={[0, maxDays]} 
              stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              allowDataOverflow={false}
            />
            {/* We put VIX on the left axis here as well, so it aligns with the top chart's YAxis */}
            <YAxis 
              yAxisId="left" 
              stroke="#38bdf8" 
              tick={{ fill: '#38bdf8', fontSize: 12 }} 
              domain={[0, 60]} 
              ticks={[0, 20, 40, 60]} 
              allowDataOverflow={true} 
              width={yAxisWidth}
            />
            
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ backgroundColor: 'rgba(10, 5, 20, 0.9)', borderColor: '#0ea5e9', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="vix"
              name="VIX 指數"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
