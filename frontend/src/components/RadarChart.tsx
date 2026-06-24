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
  const center = size / 2;
  const rMax = (size / 2) - 45; // Max radius leaving margin for labels

  // Core topics with their importance/weightage rates based on past 5 years of GATE exams
  const coreTopics = [
    { name: 'Linear Algebra', importance: 0.80 },
    { name: 'Probability & Statistics', importance: 0.85 },
    { name: 'Verbal Aptitude', importance: 0.70 },
    { name: 'Quantitative Aptitude', importance: 0.80 },
    { name: 'Algorithms', importance: 0.95 },
    { name: 'Operating Systems', importance: 0.90 }
  ];

  const totalAxes = coreTopics.length;
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

  // 1. Generate coordinates for GATE Importance Rate polygon
  const importancePoints = coreTopics.map((topic, idx) => getCoordinates(idx, topic.importance));
  const importancePointsStr = importancePoints.map(p => `${p.x},${p.y}`).join(' ');

  // 2. Generate coordinates for User's Accuracy (if they have attempted tests)
  // Check if they have at least one test attempt by looking at whether data is provided
  const hasAttempts = data && data.length > 0;
  
  const userAccuracyData = coreTopics.map(coreTopic => {
    // Find matching topic in user data (case insensitive)
    const match = data?.find(item => item.topic.toLowerCase().replace('&', 'and') === coreTopic.name.toLowerCase().replace('&', 'and'));
    return {
      topic: coreTopic.name,
      accuracy: match ? match.accuracy : 0.0
    };
  });

  const userPoints = userAccuracyData.map((item, idx) => getCoordinates(idx, item.accuracy));
  const userPointsStr = userPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <svg width={size} height={size} className="overflow-visible animate-fade-in">
        {/* Grid Levels */}
        {levels.map((level, levelIdx) => {
          const gridPoints = coreTopics.map((_, idx) => {
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
        {coreTopics.map((_, idx) => {
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

        {/* Shaded GATE Importance Rate Polygon (Gold/Orange) */}
        <polygon
          points={importancePointsStr}
          fill="rgba(245, 158, 11, 0.05)"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />

        {/* Shaded User Accuracy Polygon (Brand Blue) */}
        {hasAttempts && (
          <>
            <polygon
              points={userPointsStr}
              fill="rgba(59, 88, 255, 0.22)"
              stroke="#3b58ff"
              strokeWidth="2.5"
            />
            {/* Dots */}
            {userPoints.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#09090b"
                stroke="#3b58ff"
                strokeWidth="2.5"
              />
            ))}
          </>
        )}

        {/* Labels */}
        {coreTopics.map((item, idx) => {
          const labelCoords = getCoordinates(idx, 1.22); // Push labels slightly further out
          const anchor = labelCoords.x > center + 10 ? 'start' : labelCoords.x < center - 10 ? 'end' : 'middle';
          
          return (
            <text
              key={idx}
              x={labelCoords.x}
              y={labelCoords.y + 4}
              textAnchor={anchor}
              fontSize="9"
              fontWeight="700"
              fill="#a1a1aa"
              className="select-none"
            >
              {item.name}
            </text>
          );
        })}
      </svg>

      {/* Legend Container */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 text-[10px] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500 border border-brand-400" />
          <span className="text-zinc-300">
            {hasAttempts ? 'Your Accuracy' : 'Your Accuracy (No Mocks Attempted)'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-amber-500/20 border border-amber-500 border-dashed" />
          <span className="text-amber-500">
            GATE Importance Rate (Last 5 Yrs Avg)
          </span>
        </div>
      </div>
    </div>
  );
}

