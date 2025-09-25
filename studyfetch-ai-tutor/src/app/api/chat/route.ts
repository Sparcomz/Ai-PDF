import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `You are an AI tutor. Base your answers strictly on the provided PDF context below. 

When possible:
1. Provide a natural language answer to the student's question.
2. After your answer, output a JSON metadata object INSIDE a <metadata> block.

Formats:
- For one supporting sentence:
<metadata>
{"page": <page_number>, "sentence": "<exact sentence copied from PDF>"}
</metadata>

- For multiple supporting sentences:
<metadata>
{"page": <page_number>, "sentences": ["<sentence1>", "<sentence2>", "..."]}
</metadata>

Copy sentences EXACTLY from the PDF text (do not paraphrase).
Never invent page numbers.
If no answer is in the PDF, respond: "I could not find that information in the document."`,
        },
        {
          role: "system",
          content: `Here is the extracted PDF text:\n\n${context}`,
        },
        ...messages,
      ],
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}