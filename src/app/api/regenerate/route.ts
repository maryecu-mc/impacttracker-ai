import { NextRequest, NextResponse } from "next/server";
import type { RegenerateRequest, RegenerateResponse } from "@/lib/types";

const FORMAT_INSTRUCTIONS: Record<string, string> = {
  accomplishmentStatement:
    "Write a polished 2-3 sentence accomplishment statement that captures what happened and why it mattered. Be specific and concrete.",
  measurableImpact:
    "Write 1-2 sentences focused on quantified or concrete outcomes and results. Lead with the impact.",
  performanceReviewBullet:
    "Write one tight bullet point for a performance review. Start with a past-tense action verb. Under 25 words. Results-focused.",
  leadershipUpdateBullet:
    "Write one bullet point suitable for a leadership status update, team meeting, or Slack digest. Concise and informative.",
  careerStoryBullet:
    "Write one bullet point suitable for promotions, interviews, performance reviews, and career growth conversations — not just job applications. Scope + action + result.",
  executiveSummary:
    "Write one short paragraph framing this contribution for a senior leader who needs context quickly. Professional and executive-ready.",
  starFormat:
    "Write a STAR-format accomplishment using exactly these headers on separate lines: Situation:, Task:, Action:, Result:. Use \\n between each section.",
};

function demoRegenerate(rawInput: string, outputKey: string): string {
  const input = rawInput.trim();
  const lc = input.charAt(0).toLowerCase() + input.slice(1);

  const map: Record<string, string> = {
    accomplishmentStatement: `${input}. The work required initiative and careful coordination to execute well. The result strengthened team operations and delivered clear value to key stakeholders.`,
    measurableImpact: `By completing ${lc}, the team gained meaningful efficiency and reduced delays on related workstreams. The outcome was directly tied to organizational priorities.`,
    performanceReviewBullet: `Drove ${lc}, resulting in improved team performance and stakeholder satisfaction.`,
    leadershipUpdateBullet: `Delivered: ${input}. Outcomes are positive and aligned with current goals.`,
    careerStoryBullet: `Demonstrated ownership and impact by ${lc}, producing results that advanced team and organizational goals.`,
    executiveSummary: `The work centered on ${lc}. Execution was strong and the outcome was well-received by stakeholders. This contribution supported the team's ability to operate effectively and stay aligned with strategic direction.`,
    starFormat: `Situation: Context required action on ${lc}.\nTask: Deliver results within existing resources and timeline.\nAction: ${input}.\nResult: Work was completed with positive outcomes for the team and key stakeholders.`,
  };

  return map[outputKey] ?? `Refreshed: ${input}.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegenerateRequest = await req.json();
    const { rawInput, context, outputKey } = body;

    if (!rawInput?.trim() || !outputKey) {
      return NextResponse.json<RegenerateResponse>(
        { text: "", error: "rawInput and outputKey are required" },
        { status: 400 }
      );
    }

    // No API key — return demo regeneration
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json<RegenerateResponse>({
        text: demoRegenerate(rawInput, outputKey),
        demo: true,
      } as RegenerateResponse & { demo: boolean });
    }

    const instruction = FORMAT_INSTRUCTIONS[outputKey] ?? "Rewrite this accomplishment.";

    const contextLines = [`Contribution: ${rawInput}`];
    if (context.whoBenefited?.length) contextLines.push(`Who benefited: ${context.whoBenefited.join(", ")}`);
    if (context.contributionTypes?.length) contextLines.push(`Work type: ${context.contributionTypes.join(", ")}`);
    if (context.impactTypes?.length) contextLines.push(`Impact types: ${context.impactTypes.join(", ")}`);
    if (context.estimatedImpact) contextLines.push(`Estimated impact: ${context.estimatedImpact}`);
    if (context.strategicPriority) contextLines.push(`Strategic priority: ${context.strategicPriority}`);
    if (context.kpiMetric) contextLines.push(`KPI / Metric: ${context.kpiMetric}`);
    if (context.companyValue) contextLines.push(`Company value: ${context.companyValue}`);

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 512,
      system: `You are an expert professional communications writer. ${instruction}

Language rules:
- Specific, concrete, and human — never generic
- Never use: "leveraged", "spearheaded", "collaborated cross-functionally", "demonstrated strong ability", "successfully", "proactively"
- Return ONLY the output text — no labels, no JSON, no extra commentary`,
      messages: [{ role: "user", content: contextLines.join("\n") }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json<RegenerateResponse>({ text });
  } catch (err) {
    console.error("Regenerate error:", err);
    return NextResponse.json<RegenerateResponse>(
      { text: "", error: "Could not regenerate. Please try again." },
      { status: 500 }
    );
  }
}
