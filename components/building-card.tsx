"use client";

import { Card, CardHeader, DataRow, CardSkeleton } from "./address-card";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BuildingCardProps {
  data?: any;
  business?: any;
  isLoading: boolean;
}

export function BuildingCard({ data, business, isLoading }: BuildingCardProps) {
  if (!data && !isLoading) return null;

  if (isLoading && !data) {
    return <CardSkeleton label="Building Profile" />;
  }

  const hasBusiness = business?.businessName;

  return (
    <Card>
      <CardHeader icon={<BuildingIcon />} title="Building Profile" status="success" />
      {hasBusiness && (
        <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 mb-3">
          <p className="text-sm font-medium text-accent">{business.businessName}</p>
          <div className="flex gap-3 mt-1 text-xs text-muted">
            {business.lineOfBusiness && <span>{business.lineOfBusiness}</span>}
            {business.phone && <span>{business.phone}</span>}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <DataRow label="Property Type" value={data.propertyType} />
        <DataRow label="Building Type" value={data.buildingType} />
        <DataRow
          label="Building Area"
          value={data.buildingArea ? `${Number(data.buildingArea).toLocaleString()} sq ft` : ""}
        />
        <DataRow
          label="Living Area"
          value={data.livingSquareFootage ? `${Number(data.livingSquareFootage).toLocaleString()} sq ft` : ""}
        />
        <DataRow label="Bedrooms" value={data.bedroomCount} />
        <DataRow label="Bathrooms" value={data.bathroomCount} />
        <DataRow
          label="Elevation"
          value={data.elevation ? `${data.elevation} ft` : ""}
        />
        <DataRow
          label="Sale Amount"
          value={data.saleAmount ? `$${Number(data.saleAmount).toLocaleString()}` : ""}
        />
      </div>
    </Card>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
      />
    </svg>
  );
}
