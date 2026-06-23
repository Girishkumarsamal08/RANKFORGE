'use client';

import React from 'react';

interface RadarData {
  topic: string;
  accuracy: number; // 0 to 1
}

interface RadarChartProps {
  data: RadarData[];
  size?: number;
}

export default function RadarChart({ data, size = 300 }: RadarChartProps) {
  if (!data || data.length < 3) {
    return (
      <div className="flex h-[300px] items-center justify-center text-xs text-zinc-400">
        Take tests in multiple subjects to populate the radar chart.
      </div>
    );
  }

  const center = size / 2;
  const rMax = (size / 2) - 40; // Max radius leaving margin for labels
  const totalAxes = data.length;

  // Grid levels (e.g. 0.2, 0.4, 0.6, 0.8, 1.0)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to get coordinates on the axis
  const getCoordinates = (index: number, value: number) => {
    const angle = (2 * Math.PI * index) / totalAxes - Math.PI / 2; // Offset by -90 deg to start top
    const r = value * rMax;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate coordinates for data points
  const points = data.map((item, idx) => getCoordinates(idx, item.accuracy));
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grids */}
        {levels.map((level, levelIdx) => {
          const gridPoints = data.map((_, idx) => {
            const coords = getCoordinates(idx, level);
            return `${coords.x},${coords.y}`;
          }).join(' ');

          return (
            <polygon
              key={levelIdx}
              points={gridPoints}
              fill="none"
              stroke="#242338"
              strokeWidth="1"
              strokeDasharray={level === 1 ? "none" : "3,3"}
            />
          );
        })}

        {/* Axes */}
        {data.map((_, idx) => {
          const outerPoint = getCoordinates(idx, 1);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke="#242338"
              strokeWidth="1"
            />
          );
        })}

        {/* Shaded Accuracy Polygon */}
        {points.length > 0 && (
          <>
            <polygon
              points={pointsStr}
              fill="rgba(59, 88, 255, 0.15)"
              stroke="#3b58ff"
              strokeWidth="2"
            />
            {/* Dots */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#09090b"
                stroke="#3b58ff"
                strokeWidth="2.5"
              />
            ))}
          </>
        )}

        {/* Labels */}
        {data.map((item, idx) => {
          const labelCoords = getCoordinates(idx, 1.15); // Push labels slightly further out
          const anchor = labelCoords.x > center + 10 ? 'start' : labelCoords.x < center - 10 ? 'end' : 'middle';
          
          return (
            <text
              key={idx}
              x={labelCoords.x}
              y={labelCoords.y + 4}
              textAnchor={anchor}
              fontSize="10"
              fontWeight="600"
              fill="#a1a1aa"
              className="select-none"
            >
              {item.topic}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
