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

/** Split >> prefixed follow-up questions from narrative text */
function extractFollowUps(text: string): { cleanText: string; questions: string[] } {
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

  // Trim trailing empty lines / separators
  while (
    contentLines.length > 0 &&
    (contentLines[contentLines.length - 1].trim() === "" ||
      contentLines[contentLines.length - 1].trim() === "---")
  ) {
    contentLines.pop();
  }

  return { cleanText: contentLines.join("\n").trim(), questions };
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

  /** Send a follow-up question with a dispatcher prefix so chat renders it on the right */
  const handleFollowUp = (question: string) => {
    sendMessage({ text: `[DISPATCHER] ${question}` });
  };

  const handleClear = () => {
    setMessages([]);
  };

  // Extract tool data from all messages for the dispatch panel
  const {
    toolResults,
    activeTools,
    narrative,
    followUpQuestions,
    narrativeMessageId,
    narrativePartIndex,
  } = useMemo(() => {
    const results: Record<string, any> = {};
    const active: string[] = [];
    let lastNarrative = "";
    let narMsgId = "";
    let narPartIdx = -1;

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      let completedToolCount = 0;
      let lastTextAfterTools = "";
      let lastTextPartIndex = -1;

      const parts = message.parts as any[];
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
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
          lastTextAfterTools = part.text;
          lastTextPartIndex = i;
        }
      }

      // Narrative detection: if message has 3+ completed tools, the last text
      // is ALWAYS the briefing — no length check needed (fixes streaming leak)
      if (completedToolCount >= 3 && lastTextPartIndex >= 0) {
        lastNarrative = lastTextAfterTools;
        narMsgId = message.id;
        narPartIdx = lastTextPartIndex;
      }
      // Also catch updated briefings (no tools, but contains the keyword)
      else if (lastTextAfterTools.includes("DISPATCH BRIEFING") && lastTextPartIndex >= 0) {
        lastNarrative = lastTextAfterTools;
        narMsgId = message.id;
        narPartIdx = lastTextPartIndex;
      }
    }

    // Extract follow-up questions from narrative
    const { cleanText, questions } = lastNarrative
      ? extractFollowUps(lastNarrative)
      : { cleanText: "", questions: [] };

    return {
      toolResults: results,
      activeTools: active,
      narrative: cleanText,
      followUpQuestions: questions,
      narrativeMessageId: narMsgId,
      narrativePartIndex: narPartIdx,
    };
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3 bg-surface">
        <div className="flex items-center gap-3">
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
            narrativeMessageId={narrativeMessageId}
            narrativePartIndex={narrativePartIndex}
          />
        </div>

        {/* Dispatch Panel — Right */}
        <div className="flex w-[55%] flex-col">
          <DispatchPanel
            toolResults={toolResults}
            activeTools={activeTools}
            narrative={narrative}
            followUpQuestions={followUpQuestions}
            onAskQuestion={handleFollowUp}
          />
        </div>
      </div>
    </div>
  );
}
