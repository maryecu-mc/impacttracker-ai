import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { RefineRequest, RefineResponse, RefinedOutputs } from "@/lib/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert professional communications writer helping people at all levels — Executive Assistants, Chiefs of Staff, Operations, HR, Project Managers, Leaders, and Individual Contributors — clearly articulate the value and impact of their work.

Transform the user's input into exactly 7 distinct outputs. Return ONLY valid JSON — no markdown, no code fences, no extra text.

CRITICAL language rules:
- Be specific, concrete, and human — never generic
- Use active, results-oriented language grounded in the details provided
- Include scope, scale, and context where available
- Never use: "leveraged", "spearheaded", "collaborated cross-functionally", "demonstrated strong ability", "successfully", "proactively", "synergized", "best-in-class"
- Performance review and leadership bullets must be executive-ready and tight
- Career story bullet should work equally for promotions, interviews, reviews, and career conversations — not just job applications
- STAR format must use exactly these headers on separate lines: Situation:, Task:, Action:, Result:
- starFormat field: use \\n between each STAR section header and its content
- When "Primary use" is provided, weight that format's quality highest while keeping all others strong

Return this exact JSON shape:
{
  "accomplishmentStatement": "2-3 sentence polished summary of what happened and why it mattered",
  "measurableImpact": "1-2 sentences focused on quantified or concrete outcomes",
  "performanceReviewBullet": "One tight bullet starting with a past-tense action verb, under 25 words",
  "leadershipUpdateBullet": "One bullet suitable for a status update, team meeting, or Slack digest",
  "careerStoryBullet": "One bullet suitable for promotions, interviews, reviews, and career growth conversations",
  "executiveSummary": "1 short paragraph framing this contribution for a senior leader who needs context fast",
  "starFormat": "Situation: ...\\nTask: ...\\nAction: ...\\nResult: ..."
}`;

function buildUserPrompt(body: RefineRequest): string {
  const lines = [`Contribution: ${body.rawInput}`];
  if (body.primaryUse) lines.push(`Primary use: ${body.primaryUse.replace(/-/g, " ")}`);
  if (body.whoBenefited.length) lines.push(`Who benefited: ${body.whoBenefited.join(", ")}`);
  if (body.contributionTypes.length) lines.push(`Work type: ${body.contributionTypes.join(", ")}`);
  if (body.impactTypes.length) lines.push(`Impact types: ${body.impactTypes.join(", ")}`);
  if (body.estimatedImpact) lines.push(`Estimated impact: ${body.estimatedImpact}`);
  if (body.strategicPriority) lines.push(`Strategic priority: ${body.strategicPriority}`);
  if (body.kpiMetric) lines.push(`KPI / Metric: ${body.kpiMetric}`);
  if (body.companyValue) lines.push(`Company value: ${body.companyValue}`);
  return lines.join("\n");
}

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body: RefineRequest = await req.json();

    if (!body.rawInput?.trim()) {
      return NextResponse.json<RefineResponse>(
        { outputs: {} as RefinedOutputs, error: "rawInput is required" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(body) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const outputs: RefinedOutputs = JSON.parse(stripFences(raw));

    return NextResponse.json<RefineResponse>({ outputs });
  } catch (err) {
    console.error("Refine error:", err);
    return NextResponse.json<RefineResponse>(
      { outputs: {} as RefinedOutputs, error: "Generation failed. Check your API key and try again." },
      { status: 500 }
    );
  }
}
