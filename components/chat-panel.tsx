"use client";

import { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  verify_address: { label: "Verifying address", icon: "📍" },
  geocode_address: { label: "Geocoding location", icon: "🌐" },
  lookup_emergency_contacts: { label: "Looking up emergency contacts", icon: "📞" },
  enrich_property: { label: "Enriching property data", icon: "🏠" },
  calculate_route: { label: "Calculating route", icon: "🚒" },
};

/** Extract tool name from a part.type like "tool-verify_address" */
function getToolName(partType: string): string | null {
  if (partType.startsWith("tool-")) return partType.slice(5);
  return null;
}

interface ChatPanelProps {
  messages: any[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
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
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          911 Call Channel
        </h2>
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
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
            </div>
            <p className="text-muted text-sm">
              Begin by describing your emergency
            </p>
            <p className="text-muted/60 text-xs mt-1">
              Provide an address to start the dispatch intelligence workflow
            </p>
          </div>
        )}

        {messages.map((message: any) => (
          <div key={message.id}>
            {(message.parts as any[]).map((part: any, i: number) => {
              if (part.type === "text" && part.text?.trim()) {
                const isUser = message.role === "user";
                return (
                  <div
                    key={i}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "bg-accent text-white rounded-br-md"
                          : "bg-surface-light text-gray-200 rounded-bl-md"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{part.text}</div>
                    </div>
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

      {/* Input */}
      <div className="shrink-0 border-t border-border p-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Describe your emergency..."
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
