"use client";

export interface Scenario {
  label: string;
  icon: string;
  color: string;
  message: string;
}

export const SCENARIOS: Scenario[] = [
  {
    label: "Residential Fire — Troy, NY",
    icon: "🔥",
    color: "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20",
    message:
      "There's a fire at 350 Jordan Rd, Troy, NY 12180. Flames visible from the second floor. Two people inside.",
  },
  {
    label: "Medical Emergency — Trumbull, CT",
    icon: "🚑",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
    message:
      "I need an ambulance at 860 White Plains Road, Trumbull, CT 06611. 65-year-old male, chest pains, conscious but short of breath.",
  },
  {
    label: "Commercial Incident — Manhattan",
    icon: "🏢",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
    message:
      "There's a gas leak at 1271 Avenue of the Americas, New York, NY 10020. Large office building, people evacuating.",
  },
];

interface DemoScenariosProps {
  onSelect: (message: string) => void;
  disabled: boolean;
}

export function DemoScenarios({ onSelect, disabled }: DemoScenariosProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SCENARIOS.map((scenario) => (
        <button
          key={scenario.label}
          onClick={() => onSelect(scenario.message)}
          disabled={disabled}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${scenario.color}`}
        >
          <span>{scenario.icon}</span>
          <span>{scenario.label}</span>
        </button>
      ))}
    </div>
  );
}
