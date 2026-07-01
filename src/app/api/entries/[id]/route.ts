import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ImpactEntry } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry: ImpactEntry = await request.json();

  const { data, error } = await supabase
    .from("impact_entries")
    .update({
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
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped: ImpactEntry = {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at ?? data.created_at,
    dateOfImpact: data.date_of_impact,
    primaryUse: data.primary_use,
    rawInput: data.raw_input,
    whoBenefited: data.who_benefited ?? [],
    impactTypes: data.impact_types ?? [],
    contributionTypes: data.contribution_types ?? [],
    estimatedImpact: data.estimated_impact ?? "",
    strategicPriority: data.strategic_priority ?? "",
    kpiMetric: data.kpi_metric ?? "",
    companyValue: data.company_value ?? "",
    projectInitiative: data.project_initiative ?? "",
    leadershipPriority: data.leadership_priority ?? "",
    refinedOutputs: data.refined_outputs ?? null,
  };

  return NextResponse.json({ entry: mapped });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("impact_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
