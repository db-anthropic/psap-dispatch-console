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
  const { messages, sendMessage, status } = useChat();
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              PSAP Dispatch Intelligence Console
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <span className="hidden sm:inline">
            Powered by{" "}
            <span className="font-medium text-accent">Precisely</span>
            {" + "}
            <span className="font-medium text-warning">Claude AI</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-success">Active</span>
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
