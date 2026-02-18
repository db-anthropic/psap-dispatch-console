import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { tools } from "@/lib/tools";
import { systemPrompt } from "@/lib/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250514"),
    system: systemPrompt,
    messages,
    tools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
