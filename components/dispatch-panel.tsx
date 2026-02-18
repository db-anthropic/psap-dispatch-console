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
  followUpQuestions: string[];
  onAskQuestion: (question: string) => void;
}

export function DispatchPanel({
  toolResults,
  activeTools,
  narrative,
  followUpQuestions,
  onAskQuestion,
}: DispatchPanelProps) {
  const addressData = toolResults.verify_address;
  const geocodeData = toolResults.geocode_address;
  const propertyData = toolResults.enrich_property;
  const routeData = toolResults.calculate_route;

  // Merge contacts from address-based and location-based PSAP lookups
  const contactsData =
    toolResults.lookup_emergency_contacts || toolResults.lookup_psap_by_location;

  // Extract coordinates for map links
  const incidentLat = geocodeData?.latitude ?? propertyData?.property?.latitude;
  const incidentLon = geocodeData?.longitude ?? propertyData?.property?.longitude;
  const stationLat = contactsData?.psap?.siteLatitude;
  const stationLon = contactsData?.psap?.siteLongitude;

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
              business={propertyData?.business}
              isLoading={activeTools.includes("enrich_property")}
            />
            <HazardCard
              data={propertyData?.hazards}
              isLoading={activeTools.includes("enrich_property")}
            />
            <ContactsCard
              data={contactsData}
              isLoading={
                activeTools.includes("lookup_emergency_contacts") ||
                activeTools.includes("lookup_psap_by_location")
              }
            />
            <RouteCard
              data={routeData}
              isLoading={activeTools.includes("calculate_route")}
              incidentLat={incidentLat}
              incidentLon={incidentLon}
              stationLat={stationLat}
              stationLon={stationLon}
            />
            {narrative && <NarrativeCard text={narrative} />}
            {followUpQuestions.length > 0 && (
              <FollowUpQuestions
                questions={followUpQuestions}
                onAsk={onAskQuestion}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FollowUpQuestions({
  questions,
  onAsk,
}: {
  questions: string[];
  onAsk: (q: string) => void;
}) {
  return (
    <div className="animate-fade-in rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Follow-Up Questions
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onAsk(q)}
            className="rounded-full border border-accent/30 bg-accent/10 px-3.5 py-2 text-xs text-accent hover:bg-accent/20 transition-colors text-left leading-relaxed"
          >
            {q}
          </button>
        ))}
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
