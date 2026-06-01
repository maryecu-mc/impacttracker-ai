export interface ImpactEntry {
  id: string;
  rawInput: string;
  refinedBullets: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefineRequest {
  rawInput: string;
  category: string;
}

export interface RefineResponse {
  bullets: string[];
  error?: string;
}
