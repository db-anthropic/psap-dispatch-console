"use client";

import { Card, CardHeader, CardSkeleton } from "./address-card";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface HazardCardProps {
  data?: any;
  isLoading: boolean;
}

function riskLevel(score: string | undefined): {
  label: string;
  color: string;
  bg: string;
} {
  if (!score || score === "Unknown") return { label: "Unknown", color: "text-muted", bg: "bg-surface-light" };
  const num = parseInt(score, 10);
  if (!isNaN(num)) {
    if (num <= 3) return { label: "Low", color: "text-success", bg: "bg-success/10" };
    if (num <= 6) return { label: "Moderate", color: "text-warning", bg: "bg-warning/10" };
    return { label: "High", color: "text-danger", bg: "bg-danger/10" };
  }
  // Handle text-based risk levels
  const lower = score.toLowerCase();
  if (lower.includes("low") || lower.includes("minimal")) return { label: score, color: "text-success", bg: "bg-success/10" };
  if (lower.includes("moderate") || lower.includes("medium")) return { label: score, color: "text-warning", bg: "bg-warning/10" };
  if (lower.includes("high") || lower.includes("severe") || lower.includes("very")) return { label: score, color: "text-danger", bg: "bg-danger/10" };
  return { label: score, color: "text-muted", bg: "bg-surface-light" };
}

function floodZoneSeverity(zone: string | undefined): {
  label: string;
  color: string;
  bg: string;
} {
  if (!zone || zone === "Unknown") return { label: "Unknown", color: "text-muted", bg: "bg-surface-light" };
  // FEMA flood zones: A/V zones are high-risk, B/X-shaded are moderate, C/X are minimal
  if (zone.startsWith("A") || zone.startsWith("V")) return { label: zone, color: "text-danger", bg: "bg-danger/10" };
  if (zone === "B" || zone === "X-SHADED") return { label: zone, color: "text-warning", bg: "bg-warning/10" };
  return { label: zone, color: "text-success", bg: "bg-success/10" };
}

export function HazardCard({ data, isLoading }: HazardCardProps) {
  if (!data && !isLoading) return null;

  if (isLoading && !data) {
    return <CardSkeleton label="Hazard Assessment" />;
  }

  const earthquake = riskLevel(data?.earthquake?.riskScore);
  const flood = floodZoneSeverity(data?.flood?.zone);
  const floodRisk = riskLevel(data?.flood?.floodRisk);
  const wildfire = riskLevel(data?.wildfire?.riskScore);

  return (
    <Card>
      <CardHeader icon={<ShieldIcon />} title="Hazard Assessment" />
      <div className="space-y-2">
        <HazardRow
          label="Earthquake Risk"
          risk={earthquake}
        />
        <HazardRow
          label="Flood Zone"
          risk={flood}
          extra={data?.flood?.floodRisk && data.flood.floodRisk !== "Unknown" ? `Risk: ${floodRisk.label}` : undefined}
        />
        <HazardRow
          label="Wildfire Risk"
          risk={wildfire}
        />
      </div>
    </Card>
  );
}

function HazardRow({
  label,
  risk,
  extra,
}: {
  label: string;
  risk: { label: string; color: string; bg: string };
  extra?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-light/50 px-3 py-2">
      <span className="text-xs text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        {extra && <span className="text-xs text-muted">{extra}</span>}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${risk.color} ${risk.bg}`}
        >
          {risk.label}
        </span>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  );
}
