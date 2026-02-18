"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AddressCardProps {
  data?: any;
  geocode?: any;
  isLoading: boolean;
}

export function AddressCard({ data, geocode, isLoading }: AddressCardProps) {
  if (!data && !isLoading) return null;

  if (isLoading && !data) {
    return <CardSkeleton label="Address Verification" />;
  }

  if (data?.error) {
    return (
      <Card>
        <CardHeader icon={<MapPinIcon />} title="Address Verification" status="error" />
        <p className="text-sm text-danger">{data.error}</p>
      </Card>
    );
  }

  const confidence = data?.confidence;
  const confidenceColor =
    confidence >= 90 ? "text-success" : confidence >= 70 ? "text-warning" : "text-danger";

  const lat = geocode?.latitude ?? data?.latitude;
  const lon = geocode?.longitude ?? data?.longitude;

  return (
    <Card>
      <CardHeader icon={<MapPinIcon />} title="Verified Address" status="success" />
      <p className="text-sm font-medium text-white mb-2">{data.formattedAddress}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {data.preciselyId && (
          <DataRow label="PreciselyID" value={data.preciselyId} mono />
        )}
        {confidence != null && (
          <DataRow
            label="Confidence"
            value={`${confidence}%`}
            className={confidenceColor}
          />
        )}
        {geocode?.matchScore != null && (
          <DataRow label="Match Score" value={geocode.matchScore} />
        )}
        {lat != null && lon != null && (
          <DataRow label="Coordinates" value={`${lat}, ${lon}`} mono />
        )}
      </div>
      {lat != null && lon != null && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          View on Google Maps
        </a>
      )}
    </Card>
  );
}

// Shared sub-components used across cards

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in rounded-xl border border-border bg-surface p-4">
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status?: "success" | "error" | "warning" | "loading";
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-muted">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {title}
        </h3>
      </div>
      {status === "success" && (
        <span className="flex items-center gap-1 text-xs text-success">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          Verified
        </span>
      )}
      {status === "error" && (
        <span className="text-xs text-danger">Failed</span>
      )}
      {status === "loading" && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      )}
    </div>
  );
}

export function DataRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  className?: string;
}) {
  if (value === null || value === undefined || value === "" || value === "Unknown") return null;
  return (
    <div className="flex flex-col">
      <span className="text-muted">{label}</span>
      <span
        className={`text-gray-200 ${mono ? "font-mono text-[11px]" : ""} ${className || ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function CardSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-surface-light" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        <span className="ml-auto inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-3/4 rounded bg-surface-light" />
        <div className="h-3 w-1/2 rounded bg-surface-light" />
      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </svg>
  );
}
