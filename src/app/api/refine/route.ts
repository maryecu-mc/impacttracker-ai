import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { RefineRequest, RefineResponse } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body: RefineRequest = await req.json();
    const { rawInput, category } = body;

    if (!rawInput?.trim()) {
      return NextResponse.json<RefineResponse>(
        { bullets: [], error: "rawInput is required" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: `You are an expert resume writer. Transform raw work accomplishments into 2-4 strong, quantified resume bullet points.

Rules:
- Start each bullet with a strong action verb (past tense)
- Include metrics, percentages, or scale where you can reasonably infer them
- Be specific and results-focused
- Keep each bullet under 20 words
- Return ONLY a JSON array of strings, no other text

Example output: ["Reduced API latency by 40% by rewriting search indexing pipeline", "Eliminated on-call pages for search team over 6-month period"]`,
      messages: [
        {
          role: "user",
          content: `Category: ${category}\n\nAccomplishment: ${rawInput}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const bullets: string[] = JSON.parse(text);

    return NextResponse.json<RefineResponse>({ bullets });
  } catch (err) {
    console.error("Refine API error:", err);
    return NextResponse.json<RefineResponse>(
      { bullets: [], error: "Failed to refine. Check your API key and try again." },
      { status: 500 }
    );
  }
}
