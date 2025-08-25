import { streamText } from "ai";
import { openai } from "@/lib/openai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  return result.toTextStreamResponse();
}