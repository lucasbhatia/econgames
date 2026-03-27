"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

interface Gate {
  g: number;
  sl: number;
  spd: number;
}

interface Horse {
  name: string;
  finish: number;
  gates: Gate[];
}

interface StrideAnalysisProps {
  horses: Horse[];
  colors: string[];
}

interface ScatterPoint {
  x: number;
  y: number;
  horse: string;
  gate: number;
  efficiency: number;
}

interface EfficiencyEntry {
  name: string;
  color: string;
  efficiency: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "#1a1a2a" }}>
        {d.horse}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "13px", color: "#6b7280" }}>
        <p style={{ margin: 0 }}>
          Gate: <span style={{ color: "#1a1a2a" }}>{d.gate}</span>
        </p>
        <p style={{ margin: 0 }}>
          Stride: <span style={{ color: "#1a1a2a" }}>{d.x.toFixed(2)} ft</span>
        </p>
        <p style={{ margin: 0 }}>
          Speed: <span style={{ color: "#1a1a2a" }}>{d.y.toFixed(2)} ft/s</span>
        </p>
        <p style={{ margin: 0 }}>
          Efficiency:{" "}
          <span style={{ fontWeight: 600, color: "#b8941f" }}>
            {d.efficiency.toFixed(3)}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function StrideAnalysis({ horses, colors }: StrideAnalysisProps) {
  const { scatterData, efficiencyRanking, domain } = useMemo(() => {
    const grouped: Record<string, ScatterPoint[]> = {};
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    horses.forEach((horse) => {
      grouped[horse.name] = horse.gates.map((gate) => {
        const eff = gate.spd / gate.sl;
        if (gate.sl < minX) minX = gate.sl;
        if (gate.sl > maxX) maxX = gate.sl;
        if (gate.spd < minY) minY = gate.spd;
        if (gate.spd > maxY) maxY = gate.spd;
        return {
          x: gate.sl,
          y: gate.spd,
          horse: horse.name,
          gate: gate.g,
          efficiency: eff,
        };
      });
    });

    const padX = (maxX - minX) * 0.1 || 1;
    const padY = (maxY - minY) * 0.1 || 1;

    const ranking: EfficiencyEntry[] = horses.map((horse, i) => {
      const avgEff =
        horse.gates.reduce((sum, g) => sum + g.spd / g.sl, 0) /
        (horse.gates.length || 1);
      return { name: horse.name, color: colors[i] || "#888", efficiency: avgEff };
    });
    ranking.sort((a, b) => b.efficiency - a.efficiency);

    return {
      scatterData: grouped,
      efficiencyRanking: ranking,
      domain: {
        x: [Math.floor(minX - padX), Math.ceil(maxX + padX)] as [number, number],
        y: [Math.floor(minY - padY), Math.ceil(maxY + padY)] as [number, number],
      },
    };
  }, [horses, colors]);

  const maxEfficiency = efficiencyRanking[0]?.efficiency || 1;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: "12px",
        padding: "20px",
      }}
      className="space-y-5"
    >
      {/* Scatter Chart */}
      <div>
        <h3
          style={{ color: "#1a1a2a", fontSize: "13px" }}
          className="mb-1 font-semibold uppercase tracking-wider"
        >
          Stride Efficiency Map
        </h3>
        <p style={{ color: "#9ca3af", fontSize: "12px" }} className="mb-3">
          Longer strides at lower speed = greater mechanical efficiency
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e2db"
              />
              <XAxis
                type="number"
                dataKey="x"
                name="Stride Length"
                unit=" ft"
                domain={domain.x}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e2db" }}
                tickLine={{ stroke: "#e5e2db" }}
                label={{
                  value: "Stride Length (ft)",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#6b7280",
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Speed"
                unit=" ft/s"
                domain={domain.y}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e2db" }}
                tickLine={{ stroke: "#e5e2db" }}
                label={{
                  value: "Speed (ft/s)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 5,
                  fill: "#6b7280",
                  fontSize: 12,
                }}
              />
              <ZAxis range={[48, 48]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: "3 3", stroke: "#e5e2db" }}
              />

              {/* Trendline — simple diagonal scatter with 2 points */}
              <Scatter
                data={[
                  { x: domain.x[0], y: domain.y[0] },
                  { x: domain.x[1], y: domain.y[1] },
                ]}
                fill="none"
                line={{ stroke: "rgba(184,148,31,0.25)", strokeWidth: 1, strokeDasharray: "6 4" }}
                shape={() => null}
                isAnimationActive={false}
                legendType="none"
              />

              {/* Horse data */}
              {horses.map((horse, i) => (
                <Scatter
                  key={horse.name}
                  name={horse.name}
                  data={scatterData[horse.name] || []}
                  fill={colors[i] || "#888"}
                  fillOpacity={0.85}
                  strokeWidth={0}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Efficiency Ranking */}
      <div>
        <h3
          style={{ color: "#1a1a2a", fontSize: "13px" }}
          className="mb-2 font-semibold uppercase tracking-wider"
        >
          Efficiency Ranking
        </h3>
        <div className="space-y-1.5">
          {efficiencyRanking.map((entry, idx) => {
            const barWidth = (entry.efficiency / maxEfficiency) * 100;
            const isTop = idx === 0;
            return (
              <div
                key={entry.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                style={{
                  backgroundColor: isTop ? "rgba(184,148,31,0.06)" : "#f8f6f2",
                  border: isTop ? "1px solid rgba(184,148,31,0.4)" : "1px solid transparent",
                }}
              >
                <span
                  className="w-5 shrink-0 text-right font-medium"
                  style={{ fontSize: "13px", color: "#9ca3af" }}
                >
                  {idx + 1}
                </span>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span
                  className="w-28 shrink-0 truncate"
                  style={{ fontSize: "14px", color: "#1a1a2a" }}
                >
                  {entry.name}
                </span>
                <div
                  className="relative h-4 flex-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: "#f3f1ec" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: entry.color,
                      opacity: 0.6,
                    }}
                  />
                </div>
                <span
                  className="w-14 shrink-0 text-right font-mono"
                  style={{
                    fontSize: "13px",
                    fontWeight: isTop ? 600 : 400,
                    color: isTop ? "#b8941f" : "#6b7280",
                  }}
                >
                  {entry.efficiency.toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
