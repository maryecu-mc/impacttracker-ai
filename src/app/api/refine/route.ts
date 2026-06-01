import { NextRequest, NextResponse } from "next/server";
import type { RefineRequest, RefineResponse, RefinedOutputs } from "@/lib/types";

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
  if (body.whoBenefited?.length) lines.push(`Who benefited: ${body.whoBenefited.join(", ")}`);
  if (body.contributionTypes?.length) lines.push(`Work type: ${body.contributionTypes.join(", ")}`);
  if (body.impactTypes?.length) lines.push(`Impact types: ${body.impactTypes.join(", ")}`);
  if (body.estimatedImpact) lines.push(`Estimated impact: ${body.estimatedImpact}`);
  if (body.strategicPriority) lines.push(`Strategic priority: ${body.strategicPriority}`);
  if (body.kpiMetric) lines.push(`KPI / Metric: ${body.kpiMetric}`);
  if (body.companyValue) lines.push(`Company value: ${body.companyValue}`);
  return lines.join("\n");
}

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

// Returns plausible demo outputs shaped from the actual rawInput so the
// format is clear even without an API key configured.
function generateDemoOutputs(rawInput: string): RefinedOutputs {
  const input = rawInput.trim();
  const lc = input.charAt(0).toLowerCase() + input.slice(1);

  return {
    accomplishmentStatement:
      `${input}. This contribution required clear ownership, coordination, and follow-through in a high-visibility environment. The outcome directly supported team priorities and stakeholder expectations.`,
    measurableImpact:
      `Completing ${lc} produced a tangible improvement to team efficiency and stakeholder alignment. The work reduced friction in the process and enabled faster progress on related priorities.`,
    performanceReviewBullet:
      `Executed ${lc}, delivering measurable impact on team operations and stakeholder outcomes.`,
    leadershipUpdateBullet:
      `Completed: ${input}. Work is on track and aligned with current priorities.`,
    careerStoryBullet:
      `Took ownership of ${lc}, navigating complexity and delivering a result that strengthened team effectiveness and organizational alignment.`,
    executiveSummary:
      `This work involved ${lc}. The contribution was well-executed and timely, with direct impact on team goals and cross-functional stakeholder needs. The outcome positioned the team to move forward with clarity and momentum.`,
    starFormat:
      `Situation: A need arose to address ${lc}.\nTask: Take ownership and deliver a high-quality outcome within existing constraints.\nAction: ${input}.\nResult: The work was completed effectively, contributing to team goals and improving outcomes for key stakeholders.`,
  };
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

    // No API key — return smart demo outputs instead of failing
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json<RefineResponse>({
        outputs: generateDemoOutputs(body.rawInput),
        demo: true,
      });
    }

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

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
      {
        outputs: {} as RefinedOutputs,
        error: "Could not generate outputs. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
