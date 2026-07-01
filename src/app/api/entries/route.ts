import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ImpactEntry } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("impact_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date_of_impact", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map DB rows to ImpactEntry shape
  const entries: ImpactEntry[] = (data ?? []).map(rowToEntry);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry: ImpactEntry = await request.json();

  const { data, error } = await supabase
    .from("impact_entries")
    .insert(entryToRow(entry, user.id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: rowToEntry(data) }, { status: 201 });
}

// ─── Shape converters ─────────────────────────────────────────────────────────

function entryToRow(entry: ImpactEntry, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    created_at: entry.createdAt,
    date_of_impact: entry.dateOfImpact,
    primary_use: entry.primaryUse,
    raw_input: entry.rawInput,
    who_benefited: entry.whoBenefited,
    impact_types: entry.impactTypes,
    contribution_types: entry.contributionTypes,
    estimated_impact: entry.estimatedImpact,
    strategic_priority: entry.strategicPriority,
    kpi_metric: entry.kpiMetric,
    company_value: entry.companyValue,
    project_initiative: entry.projectInitiative,
    leadership_priority: entry.leadershipPriority,
    refined_outputs: entry.refinedOutputs,
  };
}

function rowToEntry(row: Record<string, unknown>): ImpactEntry {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
    dateOfImpact: row.date_of_impact as string,
    primaryUse: row.primary_use as ImpactEntry["primaryUse"],
    rawInput: row.raw_input as string,
    whoBenefited: (row.who_benefited as string[]) ?? [],
    impactTypes: (row.impact_types as string[]) ?? [],
    contributionTypes: (row.contribution_types as string[]) ?? [],
    estimatedImpact: (row.estimated_impact as string) ?? "",
    strategicPriority: (row.strategic_priority as string) ?? "",
    kpiMetric: (row.kpi_metric as string) ?? "",
    companyValue: (row.company_value as string) ?? "",
    projectInitiative: (row.project_initiative as string) ?? "",
    leadershipPriority: (row.leadership_priority as string) ?? "",
    refinedOutputs: (row.refined_outputs as ImpactEntry["refinedOutputs"]) ?? null,
  };
}
