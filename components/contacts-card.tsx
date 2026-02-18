"use client";

import { Card, CardHeader, CardSkeleton } from "./address-card";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ContactsCardProps {
  data?: any;
  isLoading: boolean;
}

const AHJ_ICONS: Record<string, { icon: string; color: string }> = {
  EMS: { icon: "🚑", color: "text-success" },
  Fire: { icon: "🚒", color: "text-danger" },
  Police: { icon: "🚔", color: "text-accent" },
};

export function ContactsCard({ data, isLoading }: ContactsCardProps) {
  if (!data && !isLoading) return null;

  if (isLoading && !data) {
    return <CardSkeleton label="Emergency Contacts" />;
  }

  if (data?.error) {
    return (
      <Card>
        <CardHeader icon={<PhoneIcon />} title="Emergency Contacts" status="error" />
        <p className="text-sm text-danger">{data.error}</p>
      </Card>
    );
  }

  const { psap, ahjs } = data;

  return (
    <Card>
      <CardHeader icon={<PhoneIcon />} title="Emergency Contacts" status="success" />
      <div className="space-y-3">
        {/* PSAP */}
        {psap && (
          <div className="rounded-lg bg-surface-light/50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-warning">
                PSAP
              </span>
              {psap.type && psap.type !== "Unknown" && (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                  {psap.type}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-white">{psap.agency}</p>
            {psap.phone && psap.phone !== "Unknown" && (
              <p className="text-xs font-mono text-accent mt-0.5">{psap.phone}</p>
            )}
            {psap.county && (
              <p className="text-xs text-muted mt-0.5">{psap.county} County</p>
            )}
          </div>
        )}

        {/* AHJs */}
        {ahjs && ahjs.length > 0 && (
          <div className="space-y-2">
            {ahjs.map((ahj: any, i: number) => {
              const info = AHJ_ICONS[ahj.type] || { icon: "📋", color: "text-muted" };
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-surface-light/50 p-3"
                >
                  <span className="text-lg">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold uppercase ${info.color}`}>
                        {ahj.type}
                      </span>
                    </div>
                    <p className="text-sm text-white truncate">{ahj.agency}</p>
                    {ahj.phone && ahj.phone !== "Unknown" && (
                      <p className="text-xs font-mono text-accent mt-0.5">{ahj.phone}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}
