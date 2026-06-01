export type PrimaryUse =
  | "personal-tracking"
  | "performance-review"
  | "leadership-update"
  | "career-growth"
  | "multi-purpose";

export const PRIMARY_USE_LABELS: Record<PrimaryUse, string> = {
  "personal-tracking": "Personal tracking",
  "performance-review": "Performance review",
  "leadership-update": "Leadership update",
  "career-growth": "Career growth",
  "multi-purpose": "Multi-purpose",
};

export interface RefinedOutputs {
  accomplishmentStatement: string;
  measurableImpact: string;
  performanceReviewBullet: string;
  leadershipUpdateBullet: string;
  careerStoryBullet: string;
  executiveSummary: string;
  starFormat: string;
}

export interface ImpactEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  dateOfImpact: string;
  primaryUse: PrimaryUse;

  rawInput: string;
  whoBenefited: string[];
  impactTypes: string[];
  contributionTypes: string[];
  estimatedImpact: string;

  strategicPriority: string;
  kpiMetric: string;
  companyValue: string;
  projectInitiative: string;
  leadershipPriority: string;

  refinedOutputs: RefinedOutputs | null;
}

export interface UserSettings {
  strategicPriorities: string[];
  kpiMetrics: string[];
  companyValues: string[];
  projects: string[];
}

export interface RefineRequest {
  rawInput: string;
  primaryUse: PrimaryUse;
  dateOfImpact: string;
  whoBenefited: string[];
  impactTypes: string[];
  contributionTypes: string[];
  estimatedImpact: string;
  strategicPriority: string;
  kpiMetric: string;
  companyValue: string;
}

export interface RefineResponse {
  outputs: RefinedOutputs;
  error?: string;
  demo?: boolean; // true when running without an API key
}

export interface RegenerateRequest {
  rawInput: string;
  context: Omit<RefineRequest, "rawInput">;
  outputKey: keyof RefinedOutputs;
}

export interface RegenerateResponse {
  text: string;
  error?: string;
}
