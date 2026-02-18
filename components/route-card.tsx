"use client";

import { Card, CardHeader, CardSkeleton } from "./address-card";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RouteCardProps {
  data?: any;
  isLoading: boolean;
  incidentLat?: number | null;
  incidentLon?: number | null;
  stationLat?: number | null;
  stationLon?: number | null;
}

export function RouteCard({
  data,
  isLoading,
  incidentLat,
  incidentLon,
  stationLat,
  stationLon,
}: RouteCardProps) {
  if (!data && !isLoading) return null;

  if (isLoading && !data) {
    return <CardSkeleton label="Response Route" />;
  }

  if (data?.error) {
    return (
      <Card>
        <CardHeader icon={<RouteIcon />} title="Response Route" status="error" />
        <p className="text-sm text-danger">{data.error}</p>
      </Card>
    );
  }

  const time = data.totalTime;
  const distance = data.totalDistance;

  const hasRouteCoords =
    incidentLat != null &&
    incidentLon != null &&
    stationLat != null &&
    stationLon != null;

  const mapsUrl = hasRouteCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${stationLat},${stationLon}&destination=${incidentLat},${incidentLon}&travelmode=driving`
    : null;

  return (
    <Card>
      <CardHeader icon={<RouteIcon />} title="Response Route" status="success" />
      <div className="flex items-center gap-6">
        {/* ETA */}
        <div className="flex flex-col items-center rounded-lg bg-danger/10 px-6 py-3">
          <span className="text-2xl font-bold text-danger tabular-nums">
            {typeof time === "number" ? time.toFixed(1) : time}
          </span>
          <span className="text-xs text-danger/80 uppercase mt-0.5">
            {data.timeUnit || "min"} ETA
          </span>
        </div>

        {/* Distance */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <span className="font-mono">
              {typeof distance === "number" ? distance.toFixed(1) : distance}{" "}
              {data.distanceUnit || "mi"}
            </span>
          </div>
          <span className="text-xs text-muted mt-1">From responding station</span>
        </div>
      </div>

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          View Route on Google Maps
        </a>
      )}
    </Card>
  );
}

function RouteIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
