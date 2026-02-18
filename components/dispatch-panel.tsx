"use client";

import { AddressCard } from "./address-card";
import { BuildingCard } from "./building-card";
import { HazardCard } from "./hazard-card";
import { ContactsCard } from "./contacts-card";
import { RouteCard } from "./route-card";
import { NarrativeCard } from "./narrative-card";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DispatchPanelProps {
  toolResults: Record<string, any>;
  activeTools: string[];
  narrative: string;
}

export function DispatchPanel({
  toolResults,
  activeTools,
  narrative,
}: DispatchPanelProps) {
  const addressData = toolResults.verify_address;
  const geocodeData = toolResults.geocode_address;
  const contactsData = toolResults.lookup_emergency_contacts;
  const propertyData = toolResults.enrich_property;
  const routeData = toolResults.calculate_route;

  const hasAnyData =
    addressData || geocodeData || contactsData || propertyData || routeData || narrative;

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Dispatch Intelligence
        </h2>
        {hasAnyData && (
          <div className="flex items-center gap-1.5 text-xs text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!hasAnyData ? (
          <EmptyState />
        ) : (
          <>
            <AddressCard
              data={addressData}
              geocode={geocodeData}
              isLoading={
                activeTools.includes("verify_address") ||
                activeTools.includes("geocode_address")
              }
            />
            <BuildingCard
              data={propertyData?.property}
              isLoading={activeTools.includes("enrich_property")}
            />
            <HazardCard
              data={propertyData?.hazards}
              isLoading={activeTools.includes("enrich_property")}
            />
            <ContactsCard
              data={contactsData}
              isLoading={activeTools.includes("lookup_emergency_contacts")}
            />
            <RouteCard
              data={routeData}
              isLoading={activeTools.includes("calculate_route")}
            />
            {narrative && <NarrativeCard text={narrative} />}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="grid grid-cols-2 gap-3 mb-6 w-full max-w-sm opacity-30">
        {["Address", "Building", "Hazards", "Contacts"].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-dashed border-border-light p-6 flex items-center justify-center"
          >
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-muted text-sm">Awaiting incident data</p>
      <p className="text-muted/50 text-xs mt-1">
        Data cards will populate as Precisely APIs return results
      </p>
    </div>
  );
}
