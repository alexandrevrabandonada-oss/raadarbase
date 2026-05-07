"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimeSeriesPoint } from "@/lib/data/silence-radar-time-series";

interface TimeSeriesChartProps {
  points: TimeSeriesPoint[];
  title?: string;
  showActions?: boolean;
}

export function TimeSeriesChart({ points, title, showActions = true }: TimeSeriesChartProps) {
  const data = useMemo(() => {
    return points.map((p) => ({
      ...p,
      dateLabel: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    }));
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-muted-foreground">Ainda não há pontos suficientes para comparar impacto no tempo.</p>
      </div>
    );
  }

  const actionDates = showActions ? data.filter(d => d.actionCreatedAt).map(d => d.dateLabel) : [];

  return (
    <div className="space-y-4">
      {title && <h3 className="font-semibold">{title}</h3>}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dateLabel" fontSize={12} tickMargin={10} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            {actionDates.map((d, i) => (
              <ReferenceLine key={i} x={d} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Ação', fill: '#f59e0b', fontSize: 10 }} />
            ))}
            <Line
              type="monotone"
              dataKey="reportCount"
              name="Relatos"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="interactionCount"
              name="Interações"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground italic mt-2">
        Série agregada. Não representa comportamento individual.
      </p>
    </div>
  );
}
