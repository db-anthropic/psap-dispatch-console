"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useMemo } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { DispatchPanel } from "@/components/dispatch-panel";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Extract tool name from a part.type like "tool-verify_address" */
function getToolName(partType: string): string | null {
  if (partType.startsWith("tool-")) return partType.slice(5);
  return null;
}

export default function Home() {
  const { messages, sendMessage, status, setMessages } = useChat();
  const [input, setInput] = useState("");

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleScenario = (message: string) => {
    if (isLoading) return;
    sendMessage({ text: message });
  };

  const handleClear = () => {
    setMessages([]);
  };

  // Extract tool data from all messages for the dispatch panel
  const { toolResults, activeTools, narrative } = useMemo(() => {
    const results: Record<string, any> = {};
    const active: string[] = [];
    let lastNarrative = "";

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      let completedToolCount = 0;
      let lastTextAfterTools = "";

      for (const part of message.parts as any[]) {
        const toolName = getToolName(part.type);
        if (toolName) {
          if (part.state === "output-available") {
            results[toolName] = part.output;
            completedToolCount++;
          } else if (
            part.state === "input-available" ||
            part.state === "input-streaming"
          ) {
            active.push(toolName);
          }
        } else if (part.type === "text" && part.text?.trim()) {
          // Track the last text part in this message
          lastTextAfterTools = part.text;
        }
      }

      // Narrative detection: look for the last text in a message where
      // at least 3 tools have completed (the final briefing)
      if (completedToolCount >= 3 && lastTextAfterTools.length > 200) {
        lastNarrative = lastTextAfterTools;
      }
    }

    return {
      toolResults: results,
      activeTools: active,
      narrative: lastNarrative,
    };
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3 bg-surface">
        <div className="flex items-center gap-3">
          {/* Precisely logo mark */}
          <svg className="h-7 w-7 text-accent" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm-2.4 24h-3.2V8h6.4c3.535 0 6.4 2.865 6.4 6.4s-2.865 6.4-6.4 6.4H13.6V24zm0-6.4h3.2c1.767 0 3.2-1.433 3.2-3.2s-1.433-3.2-3.2-3.2h-3.2v6.4z" />
          </svg>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              <span className="text-accent">Precisely</span>{" "}
              <span className="font-normal text-gray-300">Geo Intelligence Demo</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <span className="hidden sm:inline text-xs">
            Powered by{" "}
            <span className="font-medium text-accent">Precisely APIs</span>
            {" + "}
            <span className="font-medium text-orange-400">Claude AI</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-success text-xs">Active</span>
          </span>
        </div>
      </header>

      {/* Main split-panel layout */}
      <div className="flex min-h-0 flex-1">
        {/* Chat Panel — Left */}
        <div className="flex w-[45%] flex-col border-r border-border">
          <ChatPanel
            messages={messages}
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onScenario={handleScenario}
            onClear={handleClear}
            narrative={narrative}
          />
        </div>

        {/* Dispatch Panel — Right */}
        <div className="flex w-[55%] flex-col">
          <DispatchPanel
            toolResults={toolResults}
            activeTools={activeTools}
            narrative={narrative}
          />
        </div>
      </div>
    </div>
  );
}
