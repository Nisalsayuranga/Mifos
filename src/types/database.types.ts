/**
 * PROPIX — Supabase Database TypeScript Types
 *
 * This file represents the TypeScript type definitions for the
 * PROPIX Supabase PostgreSQL schema defined in:
 *   supabase/migrations/001_initial_schema.sql
 *
 * HOW TO REGENERATE:
 * Once the schema is applied to Supabase, you can auto-generate
 * accurate types using the Supabase CLI:
 *
 *   npx supabase gen types typescript --project-id gceenrzmsiwbhluzzyfc > src/types/database.types.ts
 *
 * Or install Supabase CLI globally:
 *   npm install -g supabase
 *   supabase login
 *   supabase gen types typescript --project-id gceenrzmsiwbhluzzyfc --schema public > src/types/database.types.ts
 *
 * IMPORTANT: Regenerate this file after any schema changes.
 * The hand-written types below are accurate to the migration SQL
 * but should be replaced by CLI-generated types after schema is applied.
 *
 * USAGE:
 * import { Database } from "@/types/database.types";
 * import { createClient } from "@/lib/supabase/client";
 * const supabase = createClient<Database>();
 */

// ─── Enum value types (matching CHECK constraints in SQL) ───────────────────

export type UserRole = "buyer" | "seller" | "agent" | "admin";
export type UserStatus = "active" | "inactive" | "suspended";

export type PropertyCategory =
  | "house"
  | "apartment"
  | "land"
  | "commercial"
  | "villa"
  | "agricultural";

export type ListingType = "sale" | "rent";

export type PropertyStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "published"
  | "sold"
  | "rented"
  | "expired"
  | "archived";

export type PropertyCondition =
  | "brand_new"
  | "semi_new"
  | "good_condition"
  | "needs_renovation"
  | "land_only";

export type DocumentType =
  | "title_deed"
  | "survey_plan"
  | "building_permit"
  | "coc"
  | "deed_of_transfer"
  | "other";

export type DocumentStatus = "pending" | "approved" | "rejected";

export type InquiryStatus = "new" | "read" | "responded" | "closed";

export type ViewingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

export type ValuationType = "digital" | "professional";

export type ValuationStatus =
  | "submitted"
  | "under_review"
  | "assigned"
  | "scheduled"
  | "completed"
  | "rejected";

export type ConsultationType = "buying" | "selling" | "investment" | "general";

export type ConsultationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

export type FinancingEmploymentStatus =
  | "salaried"
  | "self_employed"
  | "business_owner"
  | "overseas_employed";

export type FinancingStatus =
  | "submitted"
  | "under_review"
  | "eligible"
  | "not_eligible"
  | "approved"
  | "rejected";

// ─── Row types (what SELECT returns from each table) ────────────────────────

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface AgentRow {
  id: string;
  profile_id: string;
  license_number: string | null;
  bio: string | null;
  experience_years: number | null;
  specializations: string[] | null;
  service_areas: string[] | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyRow {
  id: string;
  seller_id: string;
  agent_id: string | null;
  title: string;
  description: string | null;
  category: PropertyCategory;
  listing_type: ListingType;
  price: number;
  price_label: string | null;
  land_size: number;
  building_size: number;
  beds: number;
  baths: number;
  parking: number;
  condition: PropertyCondition | null;
  year_built: number | null;
  province: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: PropertyStatus;
  verified: boolean;
  featured: boolean;
  views: number;
  inquiries_count: number;
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyImageRow {
  id: string;
  property_id: string;
  storage_path: string;
  file_name: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface PropertyDocumentRow {
  id: string;
  property_id: string;
  document_type: DocumentType;
  storage_path: string;
  file_name: string | null;
  status: DocumentStatus;
  uploaded_by: string;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyFeatureRow {
  id: string;
  property_id: string;
  feature_name: string;
  created_at: string;
}

export interface SavedPropertyRow {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface PropertyViewRow {
  id: string;
  property_id: string;
  viewer_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface InquiryRow {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  agent_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface ViewingRequestRow {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  agent_id: string | null;
  requested_date: string;   // DATE → string (ISO format)
  requested_time: string | null;  // TIME → string (HH:MM:SS)
  message: string | null;
  status: ViewingStatus;
  created_at: string;
  updated_at: string;
}

export interface ValuationRequestRow {
  id: string;
  requested_by: string;
  property_id: string | null;
  property_address: string;
  district: string;
  property_type: PropertyCategory;
  land_size: number | null;
  building_size: number | null;
  valuation_type: ValuationType;
  estimated_value: number | null;
  assigned_agent_id: string | null;
  scheduled_date: string | null;
  reference_code: string | null;
  status: ValuationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationRequestRow {
  id: string;
  requested_by: string;
  property_id: string | null;
  assigned_agent_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  consultation_type: ConsultationType;
  preferred_date: string | null;    // DATE → string
  preferred_time: string | null;    // TIME → string
  message: string | null;
  reference_code: string | null;
  status: ConsultationStatus;
  created_at: string;
  updated_at: string;
}

export interface FinancingRequestRow {
  id: string;
  applicant_id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  employment_status: FinancingEmploymentStatus;
  monthly_income: number;
  requested_loan: number;
  property_value: number | null;
  loan_term_years: number | null;
  interest_rate: number | null;
  reference_code: string | null;
  status: FinancingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Insert types (what you pass to INSERT operations) ──────────────────────

export type ProfileInsert = Omit<ProfileRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

export type PropertyInsert = Omit<
  PropertyRow,
  "id" | "created_at" | "updated_at" | "views" | "inquiries_count"
> & {
  id?: string;
  views?: number;
  inquiries_count?: number;
};

export type PropertyImageInsert = Omit<PropertyImageRow, "id" | "created_at"> & {
  id?: string;
};

export type PropertyDocumentInsert = Omit<
  PropertyDocumentRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export type PropertyFeatureInsert = Omit<PropertyFeatureRow, "id" | "created_at"> & {
  id?: string;
};

export type SavedPropertyInsert = Omit<SavedPropertyRow, "id" | "created_at"> & {
  id?: string;
};

export type InquiryInsert = Omit<InquiryRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type ViewingRequestInsert = Omit<ViewingRequestRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type ValuationRequestInsert = Omit<ValuationRequestRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type ConsultationRequestInsert = Omit<ConsultationRequestRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type FinancingRequestInsert = Omit<FinancingRequestRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export type NotificationInsert = Omit<NotificationRow, "id" | "created_at"> & {
  id?: string;
};

// ─── Update types (what you pass to UPDATE operations) ──────────────────────

export type PropertyUpdate = Partial<Omit<PropertyRow, "id" | "seller_id" | "created_at">>;
export type ProfileUpdate = Partial<Omit<ProfileRow, "id" | "email" | "created_at">>;
export type AgentUpdate = Partial<Omit<AgentRow, "id" | "profile_id" | "created_at">>;

// ─── Supabase Database type shape (for createClient<Database>()) ─────────────
// NOTE: Replace this with CLI-generated types once schema is applied:
//   npx supabase gen types typescript --project-id gceenrzmsiwbhluzzyfc > src/types/database.types.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      agents: {
        Row: AgentRow;
        Insert: Omit<AgentRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: AgentUpdate;
      };
      properties: {
        Row: PropertyRow;
        Insert: PropertyInsert;
        Update: PropertyUpdate;
      };
      property_images: {
        Row: PropertyImageRow;
        Insert: PropertyImageInsert;
        Update: Partial<Omit<PropertyImageRow, "id" | "created_at">>;
      };
      property_documents: {
        Row: PropertyDocumentRow;
        Insert: PropertyDocumentInsert;
        Update: Partial<Omit<PropertyDocumentRow, "id" | "created_at">>;
      };
      property_features: {
        Row: PropertyFeatureRow;
        Insert: PropertyFeatureInsert;
        Update: Partial<Omit<PropertyFeatureRow, "id" | "created_at">>;
      };
      saved_properties: {
        Row: SavedPropertyRow;
        Insert: SavedPropertyInsert;
        Update: never;
      };
      property_views: {
        Row: PropertyViewRow;
        Insert: Omit<PropertyViewRow, "id" | "created_at"> & { id?: string };
        Update: never;
      };
      inquiries: {
        Row: InquiryRow;
        Insert: InquiryInsert;
        Update: Partial<Omit<InquiryRow, "id" | "created_at">>;
      };
      viewing_requests: {
        Row: ViewingRequestRow;
        Insert: ViewingRequestInsert;
        Update: Partial<Omit<ViewingRequestRow, "id" | "created_at">>;
      };
      valuation_requests: {
        Row: ValuationRequestRow;
        Insert: ValuationRequestInsert;
        Update: Partial<Omit<ValuationRequestRow, "id" | "created_at">>;
      };
      consultation_requests: {
        Row: ConsultationRequestRow;
        Insert: ConsultationRequestInsert;
        Update: Partial<Omit<ConsultationRequestRow, "id" | "created_at">>;
      };
      financing_requests: {
        Row: FinancingRequestRow;
        Insert: FinancingRequestInsert;
        Update: Partial<Omit<FinancingRequestRow, "id" | "created_at">>;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: Partial<Omit<NotificationRow, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
