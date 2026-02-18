"use client";

import { useEffect, useRef } from "react";
import { DemoScenarios } from "./demo-scenarios";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  verify_address: { label: "Verifying address", icon: "📍" },
  geocode_address: { label: "Geocoding location", icon: "🌐" },
  lookup_emergency_contacts: { label: "Looking up emergency contacts", icon: "📞" },
  lookup_psap_by_location: { label: "Looking up PSAP by coordinates", icon: "📡" },
  enrich_property: { label: "Enriching property data", icon: "🏠" },
  calculate_route: { label: "Calculating route", icon: "🚒" },
};

/** Extract tool name from a part.type like "tool-verify_address" */
function getToolName(partType: string): string | null {
  if (partType.startsWith("tool-")) return partType.slice(5);
  return null;
}

/**
 * Split text into regular content and follow-up question buttons.
 * Lines starting with ">> " are extracted as clickable questions.
 */
function splitFollowUps(text: string): { content: string; questions: string[] } {
  const lines = text.split("\n");
  const contentLines: string[] = [];
  const questions: string[] = [];

  for (const line of lines) {
    if (line.startsWith(">> ")) {
      questions.push(line.slice(3).trim());
    } else {
      contentLines.push(line);
    }
  }

  // Trim trailing empty lines from content
  while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === "") {
    contentLines.pop();
  }

  return { content: contentLines.join("\n").trim(), questions };
}

interface ChatPanelProps {
  messages: any[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onScenario: (message: string) => void;
  onClear: () => void;
  narrative: string;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onScenario,
  onClear,
  narrative,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Emergency 911 Agent
          </h2>
          <p className="text-[10px] text-muted/60 mt-0.5">
            Powered by Precisely &amp; Claude
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            disabled={isLoading}
            className="text-xs text-muted hover:text-white transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            New Demo
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-surface-light p-4 mb-4">
              <svg
                className="h-8 w-8 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
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
            </div>
            <p className="text-muted text-sm">
              Describe an emergency scenario
            </p>
            <p className="text-muted/60 text-xs mt-1">
              Include an address to see Precisely&apos;s geo intelligence in action
            </p>
          </div>
        )}

        {messages.map((message: any) => (
          <div key={message.id}>
            {(message.parts as any[]).map((part: any, i: number) => {
              if (part.type === "text" && part.text?.trim()) {
                // Filter out the dispatch briefing — it shows in the intelligence panel
                if (narrative && part.text === narrative) return null;
                const isUser = message.role === "user";

                if (isUser) {
                  return (
                    <div key={i} className="flex justify-end mb-2">
                      <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-accent text-white rounded-br-md">
                        <div className="whitespace-pre-wrap">{part.text}</div>
                      </div>
                    </div>
                  );
                }

                // Assistant message: split into content + follow-up buttons
                const { content, questions } = splitFollowUps(part.text);

                return (
                  <div key={i} className="mb-2 space-y-2">
                    {content && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-surface-light text-gray-200 rounded-bl-md">
                          <div className="whitespace-pre-wrap">{content}</div>
                        </div>
                      </div>
                    )}
                    {questions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-1">
                        {questions.map((q, qi) => (
                          <button
                            key={qi}
                            onClick={() => onScenario(q)}
                            disabled={isLoading}
                            className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const toolName = getToolName(part.type);
              if (toolName) {
                const toolInfo = TOOL_LABELS[toolName] || {
                  label: toolName,
                  icon: "⚙️",
                };
                const isDone = part.state === "output-available";
                const isError = part.state === "error";

                return (
                  <div key={i} className="flex justify-start mb-1.5">
                    <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs border border-border">
                      <span>{toolInfo.icon}</span>
                      <span className="text-muted">
                        {isDone
                          ? `${toolInfo.label} — done`
                          : isError
                            ? `${toolInfo.label} — failed`
                            : `${toolInfo.label}...`}
                      </span>
                      {isDone && <span className="text-success">✓</span>}
                      {isError && <span className="text-danger">✗</span>}
                      {!isDone && !isError && (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-surface-light px-4 py-2.5 rounded-bl-md">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scenario bar + Input */}
      <div className="shrink-0 border-t border-border p-4 space-y-3">
        {messages.length === 0 && (
          <DemoScenarios onSelect={onScenario} disabled={isLoading} />
        )}
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Describe an emergency scenario..."
            className="flex-1 rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-danger px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
