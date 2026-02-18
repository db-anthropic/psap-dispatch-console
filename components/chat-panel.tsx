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
 * Strip lines starting with ">> " from text. These follow-up questions
 * are now handled by the dispatch panel, so we simply remove them.
 */
function stripFollowUps(text: string): string {
  const lines = text.split("\n");
  const filtered = lines.filter((line) => !line.startsWith(">> "));

  // Trim trailing empty lines
  while (filtered.length > 0 && filtered[filtered.length - 1].trim() === "") {
    filtered.pop();
  }

  return filtered.join("\n").trim();
}

/**
 * Generate a realistic iMessage-style timestamp for a message.
 * Earlier messages get timestamps further in the past.
 */
function getTimestamp(messageIndex: number, totalMessages: number): string {
  const now = new Date();
  // Space messages ~1-2 minutes apart, starting from (totalMessages * 1.5) minutes ago
  const minutesAgo = Math.max(0, (totalMessages - messageIndex) * 1.5);
  const msgTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
  return msgTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface ChatPanelProps {
  messages: any[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onScenario: (message: string) => void;
  onClear: () => void;
  narrativeMessageId: string;
  narrativePartIndex: number;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onScenario,
  onClear,
  narrativeMessageId,
  narrativePartIndex,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "#030712" }}>
      {/* iMessage-style header */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#0a0f1a", borderBottom: "1px solid #1f2937" }}>
        {/* Back chevron (decorative) */}
        <div className="flex items-center w-16">
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </div>

        {/* Center: avatar + name + active status */}
        <div className="flex flex-col items-center gap-0.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-white text-[11px] font-bold"
            style={{ backgroundColor: "#374151" }}
          >
            911
          </div>
          <span className="text-white text-xs font-medium leading-tight">Emergency Caller</span>
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            Active
          </span>
        </div>

        {/* Right: New Demo button */}
        <div className="flex items-center w-16 justify-end">
          {messages.length > 0 && (
            <button
              onClick={onClear}
              disabled={isLoading}
              className="text-accent text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              New Demo
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full p-4 mb-4" style={{ backgroundColor: "#111827" }}>
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
            <p className="text-white text-sm font-medium">
              Start a demo scenario
            </p>
            <p className="text-muted text-xs mt-1 max-w-[240px]">
              Select a scenario below or type a message
            </p>
            <div className="mt-6">
              <DemoScenarios onSelect={onScenario} disabled={isLoading} />
            </div>
          </div>
        )}

        {messages.map((message: any, messageIndex: number) => {
          const isUser = message.role === "user";
          // Check if this is a dispatcher follow-up (user message with [DISPATCHER] prefix)
          const firstTextPart = (message.parts as any[]).find(
            (p: any) => p.type === "text" && p.text?.trim()
          );
          const isDispatcherMsg = isUser && firstTextPart?.text?.startsWith("[DISPATCHER] ");
          const timestamp = getTimestamp(messageIndex, messages.length);

          // Collect all renderable parts for this message
          const renderedParts: React.ReactNode[] = [];

          (message.parts as any[]).forEach((part: any, i: number) => {
            if (part.type === "text" && part.text?.trim()) {
              // Filter out the dispatch briefing narrative (including updated briefings)
              if (message.id === narrativeMessageId && i === narrativePartIndex) return;
              if (part.text.length > 200 && part.text.includes("DISPATCH BRIEFING")) return;

              // Strip follow-up question lines
              const cleanText = stripFollowUps(part.text);
              if (!cleanText) return;

              // Detect [DISPATCHER] prefix — render on right (purple) as dispatcher message
              const isDispatcher = isUser && cleanText.startsWith("[DISPATCHER] ");
              const displayText = isDispatcher ? cleanText.replace("[DISPATCHER] ", "") : cleanText;

              if (isUser && !isDispatcher) {
                // Caller message — left, gray
                renderedParts.push(
                  <div key={i} className="flex justify-start mb-1">
                    <div
                      className="max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed text-white"
                      style={{
                        backgroundColor: "#374151",
                        borderRadius: "18px 18px 18px 4px",
                      }}
                    >
                      <div className="whitespace-pre-wrap">{displayText}</div>
                    </div>
                  </div>
                );
              } else {
                // Dispatcher/agent message — right, purple (covers both assistant and [DISPATCHER] user messages)
                renderedParts.push(
                  <div key={i} className="flex justify-end mb-1">
                    <div
                      className="max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed text-white"
                      style={{
                        backgroundColor: "#7C3AED",
                        borderRadius: "18px 18px 4px 18px",
                      }}
                    >
                      <div className="whitespace-pre-wrap">{displayText}</div>
                    </div>
                  </div>
                );
              }
              return;
            }

            const toolName = getToolName(part.type);
            if (toolName) {
              const toolInfo = TOOL_LABELS[toolName] || {
                label: toolName,
                icon: "&#9881;",
              };
              const isDone = part.state === "output-available";
              const isError = part.state === "error";

              renderedParts.push(
                <div key={i} className="flex justify-center mb-1">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                    style={{ backgroundColor: "#1f2937", color: "#6b7280" }}
                  >
                    <span className="text-[10px]">{toolInfo.icon}</span>
                    <span>
                      {isDone
                        ? `${toolInfo.label} — done`
                        : isError
                          ? `${toolInfo.label} — failed`
                          : `${toolInfo.label}...`}
                    </span>
                    {isDone && <span className="text-success text-[10px]">&#10003;</span>}
                    {isError && <span className="text-danger text-[10px]">&#10007;</span>}
                    {!isDone && !isError && (
                      <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-accent border-t-transparent" />
                    )}
                  </div>
                </div>
              );
              return;
            }
          });

          if (renderedParts.length === 0) return null;

          return (
            <div key={message.id} className="mb-3">
              {renderedParts}
              {/* Timestamp below the message group */}
              <div
                className={`mt-0.5 text-[10px] ${
                  isUser && !isDispatcherMsg ? "text-left pl-1" : "text-right pr-1"
                }`}
                style={{ color: "#4b5563" }}
              >
                {timestamp}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-end mb-3">
            <div
              className="flex items-center gap-1.5 px-4 py-3"
              style={{
                backgroundColor: "#7C3AED",
                borderRadius: "18px 18px 4px 18px",
              }}
            >
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 px-3 pb-4 pt-2" style={{ borderTop: "1px solid #1f2937" }}>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Message..."
              className="w-full rounded-full py-2.5 pl-4 pr-4 text-sm text-white placeholder:text-muted focus:outline-none"
              style={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
