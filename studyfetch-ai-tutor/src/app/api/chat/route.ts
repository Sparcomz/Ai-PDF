import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // Read messages + PDF context from request body
    const { messages, context } = await req.json();

    const result = await streamText({
      model: openai("gpt-4o-mini"),

      messages: [
        {
          role: "system",
          content:
            "You are an AI tutor. You must base your answers only on the provided PDF content. " +
            "If the requested information is not in the PDF, say: 'I could not find that information in the document.'",
        },
        {
          role: "system",
          content: `Here is the extracted PDF content:\n\n${context}`,
        },
        ...messages, // include conversation history (user + assistant so far)
      ],
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("❌ Error in /api/chat:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}