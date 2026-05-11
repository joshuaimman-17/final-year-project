export interface Farm {
  id: string;
  owner_id: string;
  name: string;
  village?: string;
  district?: string;
  state?: string;
  created_at: string;
  fields?: Field[];
}

export interface Field {
  id: string;
  farm_id: string;
  polygon: any; // GeoJSON
  area_hectares: number;
  soil_type_baseline?: string;
  irrigation_type?: string;
}

export interface SprayingWindow {
  status: "OPTIMAL" | "MARGINAL" | "DANGER";
  reason: string;
  next_optimal_window: string;
}
