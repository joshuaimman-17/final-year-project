export type DiagnosisStatus = "PROCESSING" | "AI_DIAGNOSED" | "EXPERT_REVIEWING" | "COMPLETED" | "FAILED";

export interface AIDiagnosisResult {
  suggested_disease: string;
  confidence_score: number;
  treatment_summary?: string;
  processed_at: string;
}

export interface Diagnosis {
  id: string;
  field_id: string;
  user_id: string;
  image_url: string;
  crop_type: string;
  status: DiagnosisStatus;
  ai_result?: AIDiagnosisResult;
  created_at: string;
}
