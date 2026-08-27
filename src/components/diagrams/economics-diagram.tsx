import { useId } from "react";

import type { CurveTone, DiagramSpec, Pt } from "@/lib/diagrams/spec";
import { cn } from "@/lib/utils";

/**
 * Renders a DiagramSpec as a clean, exam-convention SVG diagram.
 * Geometry is authored in a 0-100 space with y measured upwards.
 */

const W = 460;
const H = 340;
const L = 48;
const R = 438;
const T = 20;
const B = 296;

const px = (x: number) => L + (x / 100) * (R - L);
const py = (y: number) => B - (y / 100) * (B - T);
const pt = ([x, y]: Pt) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`;

const TONE: Record<CurveTone, string> = {
  demand: "var(--ao1)",
  supply: "var(--primary)",
  cost: "var(--ao3)",
  revenue: "var(--chart-4)",
  neutral: "var(--muted-foreground)",
  accent: "var(--chart-2)",
  warn: "var(--destructive)",
};

const SHADE: Record<string, string> = {
  primary: "var(--primary)",
  warn: "var(--warning)",
  muted: "var(--muted-foreground)",
  danger: "var(--destructive)",
};

export function EconomicsDiagram({
  spec,
  title,
  className,
}: {
  spec: DiagramSpec;
  title: string;
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${title} diagram`}
      className={cn("w-full", className)}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <title>{title}</title>
      <defs>
        <marker
          id={`arrow-${uid}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
        </marker>
      </defs>

      {/* shaded areas first so curves sit on top */}
      {(spec.shades ?? []).map((shade, index) => (
        <g key={`shade-${index}`}>
          <polygon
            points={shade.points.map(pt).join(" ")}
            fill={SHADE[shade.tone ?? "primary"]}
            fillOpacity={0.18}
            stroke={SHADE[shade.tone ?? "primary"]}
            strokeOpacity={0.45}
            strokeWidth={1}
          />
          {shade.label ? (
            <text
              x={px((shade.labelAt ?? centroid(shade.points))[0])}
              y={py((shade.labelAt ?? centroid(shade.points))[1])}
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="var(--foreground)"
            >
              {shade.label}
            </text>
          ) : null}
        </g>
      ))}

      {/* axes */}
      <line
        x1={px(0)}
        y1={py(0)}
        x2={px(0)}
        y2={T - 2}
        stroke="var(--foreground)"
        strokeWidth={1.4}
        markerEnd={`url(#arrow-${uid})`}
      />
      <line
        x1={px(0)}
        y1={py(0)}
        x2={R}
        y2={py(0)}
        stroke="var(--foreground)"
        strokeWidth={1.4}
        markerEnd={`url(#arrow-${uid})`}
      />
      <text
        x={4}
        y={T - 4}
        fontSize="12"
        fontWeight="600"
        textAnchor="start"
        fill="var(--foreground)"
      >
        {spec.yLabel}
      </text>
      <text
        x={R}
        y={py(0) + 20}
        fontSize="12"
        fontWeight="600"
        textAnchor="end"
        fill="var(--foreground)"
      >
        {spec.xLabel}
      </text>

      {/* markers: dotted guides */}
      {(spec.markers ?? []).map((marker, index) => {
        const guides = marker.guides ?? "both";
        if (guides === "none") return null;
        return (
          <g key={`guide-${index}`} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeWidth={1}>
            {guides === "both" || guides === "y" ? (
              <line x1={px(0)} y1={py(marker.at[1])} x2={px(marker.at[0])} y2={py(marker.at[1])} />
            ) : null}
            {guides === "both" || guides === "x" ? (
              <line x1={px(marker.at[0])} y1={py(marker.at[1])} x2={px(marker.at[0])} y2={py(0)} />
            ) : null}
          </g>
        );
      })}

      {/* curves */}
      {spec.curves.map((curve, index) => {
        const colour = TONE[curve.tone ?? "neutral"];
        const end = curve.points[curve.points.length - 1] ?? [0, 0];
        const labelPoint = curve.labelAt ?? [end[0] + 3, end[1]];
        return (
          <g key={`curve-${index}`}>
            <polyline
              points={curve.points.map(pt).join(" ")}
              fill="none"
              stroke={colour}
              strokeWidth={2.1}
              strokeLinecap="round"
              strokeDasharray={curve.dashed ? "6 4" : undefined}
            />
            {curve.label ? (
              <text
                x={px(labelPoint[0])}
                y={py(labelPoint[1]) + 4}
                fontSize="11.5"
                fontWeight="600"
                fill={colour}
              >
                {curve.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* marker dots + labels */}
      {(spec.markers ?? []).map((marker, index) => {
        const offset = marker.labelOffset ?? [2.5, 3.5];
        return (
          <g key={`marker-${index}`}>
            <circle cx={px(marker.at[0])} cy={py(marker.at[1])} r={3} fill="var(--foreground)" />
            {marker.label ? (
              <text
                x={px(marker.at[0] + offset[0])}
                y={py(marker.at[1] + offset[1])}
                fontSize="11.5"
                fontWeight="600"
                fill="var(--foreground)"
              >
                {marker.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* free arrows */}
      {(spec.arrows ?? []).map((arrow, index) => (
        <g key={`arrow-${index}`}>
          <line
            x1={px(arrow.from[0])}
            y1={py(arrow.from[1])}
            x2={px(arrow.to[0])}
            y2={py(arrow.to[1])}
            stroke="var(--muted-foreground)"
            strokeWidth={1.3}
            markerEnd={`url(#arrow-${uid})`}
          />
          {arrow.label ? (
            <text
              x={px((arrow.from[0] + arrow.to[0]) / 2)}
              y={py((arrow.from[1] + arrow.to[1]) / 2) - 5}
              fontSize="10.5"
              textAnchor="middle"
              fill="var(--muted-foreground)"
            >
              {arrow.label}
            </text>
          ) : null}
        </g>
      ))}

      {/* axis ticks */}
      {(spec.xTicks ?? []).map((tick, index) => (
        <text
          key={`xt-${index}`}
          x={px(tick.at)}
          y={py(0) + 15}
          fontSize="11"
          textAnchor="middle"
          fill="var(--muted-foreground)"
        >
          {tick.label}
        </text>
      ))}
      {(spec.yTicks ?? []).map((tick, index) => (
        <text
          key={`yt-${index}`}
          x={px(0) - 6}
          y={py(tick.at) + 4}
          fontSize="11"
          textAnchor="end"
          fill="var(--muted-foreground)"
        >
          {tick.label}
        </text>
      ))}

      {/* notes */}
      {(spec.notes ?? []).map((note, index) => (
        <text
          key={`note-${index}`}
          x={px(note.at[0])}
          y={py(note.at[1])}
          fontSize="10.5"
          textAnchor={note.align ?? "start"}
          fill="var(--muted-foreground)"
        >
          {note.text}
        </text>
      ))}
    </svg>
  );
}

function centroid(points: Pt[]): Pt {
  const sum = points.reduce<[number, number]>((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}