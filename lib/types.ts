export type JobStatus =
  | "nueva"
  | "en_revision"
  | "presupuesto_enviado"
  | "aceptada"
  | "en_curso"
  | "completada"
  | "rechazada"
  | "cancelada";

export const JOB_STATUSES: JobStatus[] = [
  "nueva",
  "en_revision",
  "presupuesto_enviado",
  "aceptada",
  "en_curso",
  "completada",
  "rechazada",
  "cancelada",
];

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  zone: string;
  approved: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface Job {
  id: string;
  business_id: string;
  customer_id: string;
  type: string | null;
  status: JobStatus;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  summary: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobData {
  job_id: string;
  data: Record<string, unknown>;
  updated_at: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  url: string;
  created_at: string;
}

export interface JobFinancials {
  job_id: string;
  sale_price: number;
  material_cost: number;
  labor_cost: number;
  travel_cost: number;
  other_costs: number;
  total_cost: number;
  profit: number;
  margin: number;
  updated_at: string;
}
