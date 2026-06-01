export type VisibilityLevel =
  | "just-for-me"
  | "manager-discussion"
  | "leadership-ready"
  | "career-safe";

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  "just-for-me": "Just for me",
  "manager-discussion": "Manager discussion",
  "leadership-ready": "Leadership-ready",
  "career-safe": "Career-safe",
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
  dateOfImpact: string; // YYYY-MM-DD
  visibilityLevel: VisibilityLevel;

  // Section 1
  rawInput: string;

  // Section 2 — Context
  whoBenefited: string[];
  impactTypes: string[];
  contributionTypes: string[];
  estimatedImpact: string;

  // Section 3 — Alignment
  strategicPriority: string;
  kpiMetric: string;
  companyValue: string;
  projectInitiative: string;
  leadershipPriority: string;

  // Section 4 — AI outputs
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
