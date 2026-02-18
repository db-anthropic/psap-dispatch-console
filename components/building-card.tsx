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
            {business.sicCode && <span>SIC: {business.sicCode}</span>}
            {business.naicsCode && <span>NAICS: {business.naicsCode}</span>}
            {business.employeeCount != null && (
              <span>{business.employeeCount} employees</span>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <DataRow label="Building Type" value={data.buildingType} />
        <DataRow label="Stories" value={data.stories} />
        <DataRow label="Year Built" value={data.yearBuilt} />
        <DataRow
          label="Building Area"
          value={data.buildingArea ? `${Number(data.buildingArea).toLocaleString()} sq ft` : ""}
        />
        <DataRow label="Exterior Walls" value={data.exteriorWalls} />
        <DataRow label="Roof Type" value={data.roofType} />
        <DataRow label="Foundation" value={data.foundationType} />
        <DataRow label="Heating Fuel" value={data.heatingFuel} />
        <DataRow label="Heating Type" value={data.heatingType} />
        <DataRow label="Cooling" value={data.coolingType} />
        <DataRow label="Bedrooms" value={data.numberOfBedrooms} />
        <DataRow label="Bathrooms" value={data.numberOfBathrooms} />
        <DataRow label="Total Rooms" value={data.numberOfRooms} />
        <DataRow label="Garage" value={data.garageType} />
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
