"use client";

import { Card, CardHeader } from "./address-card";

interface NarrativeCardProps {
  text: string;
}

export function NarrativeCard({ text }: NarrativeCardProps) {
  if (!text) return null;

  return (
    <Card>
      <CardHeader icon={<DocumentIcon />} title="Dispatch Briefing" status="success" />
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
          {text}
        </div>
      </div>
    </Card>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}
