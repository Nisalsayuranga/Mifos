-- ==============================================================
-- PROPIX — Sri Lanka Digital Real Estate Platform
-- DATABASE MIGRATION: 001_initial_schema.sql
-- ==============================================================
-- Supabase Project: gceenrzmsiwbhluzzyfc
-- Created: 2026-08-25
--
-- INSTRUCTIONS:
-- Run this file in the Supabase SQL Editor (project dashboard).
-- Execute the ENTIRE file in one go.
-- Do NOT run it multiple times without checking for existing objects.
-- This migration creates ALL tables, indexes, constraints, and
-- enables Row Level Security. Storage buckets must be created
-- separately via the Supabase Dashboard (see notes at bottom).
-- ==============================================================


-- ==============================================================
-- SECTION 0: PREREQUISITES
-- ==============================================================

-- Enable the pgcrypto extension for gen_random_uuid() if not already enabled.
-- In Supabase, this is enabled by default, but we add it defensively.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ==============================================================
-- SECTION 1: profiles
-- ==============================================================
-- Application-level user profile linked to Supabase auth.users.
-- Each authenticated user gets exactly one profile row.
-- The id MUST match auth.users(id) so Supabase Auth can join them.
-- ==============================================================

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,

  -- Role: buyer | seller | agent | admin
  role          TEXT NOT NULL DEFAULT 'buyer'
                CHECK (role IN ('buyer', 'seller', 'agent', 'admin')),

  -- Status: active | inactive | suspended
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'suspended')),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique email per profile (mirrors auth.users constraint)
CREATE UNIQUE INDEX idx_profiles_email ON public.profiles(email);

COMMENT ON TABLE public.profiles IS
  'Application user profiles. id references auth.users(id). '
  'One profile per authenticated user. Role determines dashboard access.';

COMMENT ON COLUMN public.profiles.role IS
  'User role: buyer (searches/saves), seller (lists properties), '
  'agent (manages consultations/valuations), admin (verifies listings).';


-- ==============================================================
-- SECTION 2: agents
-- ==============================================================
-- Extended information for profiles with role = ''agent''.
-- Separating agent-specific data avoids polluting the profiles table.
-- ==============================================================

CREATE TABLE public.agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  license_number    TEXT,
  bio               TEXT,
  experience_years  INTEGER CHECK (experience_years >= 0),
  specializations   TEXT[],       -- e.g. ['residential', 'commercial', 'land']
  service_areas     TEXT[],       -- e.g. ['Colombo', 'Gampaha', 'Kandy']

  -- Rating out of 5, averaged from reviews
  rating            NUMERIC(3,2) DEFAULT 0.00
                    CHECK (rating >= 0 AND rating <= 5),
  total_reviews     INTEGER NOT NULL DEFAULT 0
                    CHECK (total_reviews >= 0),

  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each profile can have at most one agent record
CREATE UNIQUE INDEX idx_agents_profile_id ON public.agents(profile_id);

-- Fast lookup when joining agents → profiles
CREATE INDEX idx_agents_is_verified ON public.agents(is_verified);

COMMENT ON TABLE public.agents IS
  'Agent-specific extended profile. Must have a matching profiles row with role=agent. '
  'Separated from profiles to keep that table clean for all user types.';


-- ==============================================================
-- SECTION 3: properties
-- ==============================================================
-- Core property listing table. Maps directly to the existing
-- TypeScript Property interface in src/lib/data.ts.
--
-- Observed from the frontend:
--  - categories: house, apartment, land, commercial, villa, agricultural
--  - listing_type: sale | rent
--  - status workflow: draft → submitted → under_review → approved/rejected
--    → published → sold/rented/expired/archived
--  - price stored as NUMERIC (LKR amounts like 75,000,000)
--  - land measured in Perches (Sri Lankan unit)
--  - building measured in Sq Ft
--  - features are stored as a separate table (property_features)
--  - images are stored in Supabase Storage (property_images table)
--  - documents are stored in Supabase Storage (property_documents table)
-- ==============================================================

CREATE TABLE public.properties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership / assignment
  seller_id        UUID NOT NULL REFERENCES public.profiles(id),
  agent_id         UUID REFERENCES public.agents(id),  -- nullable: not all properties have agents

  -- Core listing info
  title            TEXT NOT NULL,
  description      TEXT,

  -- Category: house | apartment | land | commercial | villa | agricultural
  category         TEXT NOT NULL
                   CHECK (category IN ('house', 'apartment', 'land', 'commercial', 'villa', 'agricultural')),

  -- Type: sale | rent
  listing_type     TEXT NOT NULL
                   CHECK (listing_type IN ('sale', 'rent')),

  -- Pricing (stored in LKR as full integer/decimal)
  price            NUMERIC(18,2) NOT NULL CHECK (price >= 0),
  price_label      TEXT,  -- formatted string e.g. "LKR 75,000,000" or "LKR 65,000 / month"

  -- Physical dimensions
  land_size        NUMERIC(10,2) DEFAULT 0,   -- Perches (Sri Lankan unit)
  building_size    NUMERIC(10,2) DEFAULT 0,   -- Sq Ft

  -- Room counts
  beds             INTEGER NOT NULL DEFAULT 0 CHECK (beds >= 0),
  baths            INTEGER NOT NULL DEFAULT 0 CHECK (baths >= 0),
  parking          INTEGER NOT NULL DEFAULT 0 CHECK (parking >= 0),

  -- Property condition (from listing wizard Step 2)
  condition        TEXT
                   CHECK (condition IN (
                     'brand_new', 'semi_new', 'good_condition',
                     'needs_renovation', 'land_only'
                   )),
  year_built       INTEGER CHECK (year_built >= 1800 AND year_built <= 2100),

  -- Location (Sri Lanka specific)
  province         TEXT,
  district         TEXT,
  city             TEXT,
  address          TEXT,

  -- GPS coordinates (optional, for map view)
  latitude         NUMERIC(10,8),
  longitude        NUMERIC(11,8),

  -- Verification / Publication workflow
  -- draft:        seller created but not submitted
  -- submitted:    seller submitted for review (was "pending" in mock data)
  -- under_review: admin is actively reviewing
  -- approved:     admin approved, not yet published
  -- rejected:     admin rejected (seller can edit & resubmit)
  -- published:    live on the platform (was "approved" + publicly visible)
  -- sold:         property transaction completed (sale)
  -- rented:       property transaction completed (rent)
  -- expired:      listing period elapsed
  -- archived:     admin/seller archived
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN (
                     'draft', 'submitted', 'under_review',
                     'approved', 'rejected', 'published',
                     'sold', 'rented', 'expired', 'archived'
                   )),

  verified         BOOLEAN NOT NULL DEFAULT FALSE,   -- documents verified by admin
  featured         BOOLEAN NOT NULL DEFAULT FALSE,   -- promoted/featured listing

  -- Analytics counters (denormalized for performance)
  views            INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  inquiries_count  INTEGER NOT NULL DEFAULT 0 CHECK (inquiries_count >= 0),

  -- Rejection tracking (filled by admin when rejecting)
  rejection_reason TEXT,
  rejected_by      UUID REFERENCES public.profiles(id),
  rejected_at      TIMESTAMPTZ,

  -- Approval tracking
  approved_by      UUID REFERENCES public.profiles(id),
  approved_at      TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================
-- INDEXES FOR properties
-- These reflect the search/filter patterns observed in the frontend:
--   - /search page: filter by status, category, listing_type, district, city, price
--   - /map: filter by district, coordinates
--   - /dashboard/seller: filter by seller_id
--   - /dashboard/admin: filter by status (pending queue)
--   - FeaturedProperties component: filter by featured + status
-- ==============================================================
CREATE INDEX idx_properties_status       ON public.properties(status);
CREATE INDEX idx_properties_category     ON public.properties(category);
CREATE INDEX idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX idx_properties_district     ON public.properties(district);
CREATE INDEX idx_properties_city         ON public.properties(city);
CREATE INDEX idx_properties_price        ON public.properties(price);
CREATE INDEX idx_properties_seller_id    ON public.properties(seller_id);
CREATE INDEX idx_properties_agent_id     ON public.properties(agent_id);
CREATE INDEX idx_properties_featured     ON public.properties(featured);
CREATE INDEX idx_properties_verified     ON public.properties(verified);
-- Composite: most common public listing query
CREATE INDEX idx_properties_status_featured
  ON public.properties(status, featured)
  WHERE status = 'published';

COMMENT ON TABLE public.properties IS
  'Core property listing. Covers all categories: house, apartment, land, '
  'commercial, villa, agricultural. Status workflow: '
  'draft → submitted → under_review → approved/rejected → published → sold/rented.';


-- ==============================================================
-- SECTION 4: property_images
-- ==============================================================
-- Stores REFERENCES to images in Supabase Storage bucket "property-images".
-- The binary image data is NEVER stored in PostgreSQL.
-- storage_path is the Supabase Storage object path.
-- ==============================================================

CREATE TABLE public.property_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Supabase Storage path, e.g. "properties/prop-uuid/image-uuid.jpg"
  storage_path  TEXT NOT NULL,
  file_name     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_cover      BOOLEAN NOT NULL DEFAULT FALSE,  -- True for the primary/hero image

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX idx_property_images_cover
  ON public.property_images(property_id, is_cover)
  WHERE is_cover = TRUE;

-- Only one cover image per property
CREATE UNIQUE INDEX idx_property_images_one_cover
  ON public.property_images(property_id)
  WHERE is_cover = TRUE;

COMMENT ON TABLE public.property_images IS
  'References to property images stored in Supabase Storage bucket "property-images". '
  'storage_path is the Storage object key. Binary data is NOT stored here.';


-- ==============================================================
-- SECTION 5: property_documents
-- ==============================================================
-- Confidential verification documents uploaded by sellers.
-- Stored in private Supabase Storage bucket "property-documents".
-- Only admin should access these via signed URLs.
-- ==============================================================

CREATE TABLE public.property_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Type of legal document
  document_type   TEXT NOT NULL
                  CHECK (document_type IN (
                    'title_deed', 'survey_plan', 'building_permit',
                    'coc', 'deed_of_transfer', 'other'
                  )),

  -- Supabase Storage path in the PRIVATE "property-documents" bucket
  -- e.g. "documents/prop-uuid/title_deed-uuid.pdf"
  storage_path    TEXT NOT NULL,
  file_name       TEXT,

  -- Document review status
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),

  uploaded_by     UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_by     UUID REFERENCES public.profiles(id),   -- nullable until reviewed
  review_notes    TEXT,                                   -- admin notes on rejection

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_documents_property_id ON public.property_documents(property_id);
CREATE INDEX idx_property_documents_status       ON public.property_documents(status);

COMMENT ON TABLE public.property_documents IS
  'Confidential legal documents. storage_path references private Supabase Storage '
  'bucket "property-documents". Only admins may access via signed URLs. '
  'Document types: title_deed, survey_plan, building_permit, coc, deed_of_transfer.';


-- ==============================================================
-- SECTION 6: property_features
-- ==============================================================
-- Property amenities/features as seen on property detail pages.
-- Examples from data.ts: Swimming Pool, Garden, Air Conditioning,
-- Security 24/7, Solar Panels, CCTV, Elevator, Balcony, Generator.
-- Stored as rows rather than an array for better queryability.
-- ==============================================================

CREATE TABLE public.property_features (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  feature_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_features_property_id ON public.property_features(property_id);
-- Allow searching all properties with a specific feature
CREATE INDEX idx_property_features_name ON public.property_features(feature_name);

-- Prevent duplicate features on the same property
CREATE UNIQUE INDEX idx_property_features_unique
  ON public.property_features(property_id, feature_name);

COMMENT ON TABLE public.property_features IS
  'Property amenities and features. Stored as individual rows for queryability. '
  'One row per feature per property. Examples: Swimming Pool, Garden, CCTV, etc.';


-- ==============================================================
-- SECTION 7: saved_properties
-- ==============================================================
-- Buyer wishlist / saved properties.
-- Observed in: BuyerDashboard (saved properties section),
-- property detail page (Heart/Save button with liked state).
-- ==============================================================

CREATE TABLE public.saved_properties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate saves (core business rule)
CREATE UNIQUE INDEX idx_saved_properties_unique
  ON public.saved_properties(user_id, property_id);

-- Fast lookup: "show all saved properties for this buyer"
CREATE INDEX idx_saved_properties_user_id     ON public.saved_properties(user_id);
CREATE INDEX idx_saved_properties_property_id ON public.saved_properties(property_id);

COMMENT ON TABLE public.saved_properties IS
  'Buyer favourites/wishlist. Unique constraint prevents duplicate saves. '
  'Used by BuyerDashboard saved properties section and the Heart button on detail pages.';


-- ==============================================================
-- SECTION 8: property_views
-- ==============================================================
-- Analytics: track every property page view.
-- viewer_id is nullable for anonymous/unauthenticated visitors.
-- session_id allows tracking anonymous users across a session.
-- Used for: views counter on property cards and seller dashboard.
-- ==============================================================

CREATE TABLE public.property_views (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id    UUID REFERENCES public.profiles(id),  -- NULL for anonymous
  session_id   TEXT,                                  -- browser session identifier
  ip_address   INET,                                  -- optional, for dedup
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX idx_property_views_viewer_id   ON public.property_views(viewer_id);
CREATE INDEX idx_property_views_created_at  ON public.property_views(created_at);

COMMENT ON TABLE public.property_views IS
  'Property view tracking. viewer_id is NULL for anonymous visitors. '
  'Used to calculate the views counter shown on property cards and the seller dashboard. '
  'Properties table also has a denormalized views column for fast reads.';


-- ==============================================================
-- SECTION 9: inquiries
-- ==============================================================
-- Buyer-to-seller/agent inquiries about a property.
-- Observed in:
--   - Property detail page: "Send Inquiry" modal (name, email, phone, message)
--   - SellerDashboard: "Buyer Requests & Offers" section
--   - Seller listings page: inquiries count shown per property
-- ==============================================================

CREATE TABLE public.inquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id     UUID NOT NULL REFERENCES public.profiles(id),
  seller_id    UUID NOT NULL REFERENCES public.profiles(id),
  agent_id     UUID REFERENCES public.agents(id),  -- nullable

  -- Guest inquiry fields (for unauthenticated or pre-auth phase)
  guest_name   TEXT,
  guest_email  TEXT,
  guest_phone  TEXT,

  message      TEXT NOT NULL,

  -- Status workflow
  status       TEXT NOT NULL DEFAULT 'new'
               CHECK (status IN ('new', 'read', 'responded', 'closed')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiries_property_id ON public.inquiries(property_id);
CREATE INDEX idx_inquiries_buyer_id    ON public.inquiries(buyer_id);
CREATE INDEX idx_inquiries_seller_id   ON public.inquiries(seller_id);
CREATE INDEX idx_inquiries_status      ON public.inquiries(status);

COMMENT ON TABLE public.inquiries IS
  'Buyer inquiries about a property. Seen in the "Send Inquiry" modal on property '
  'detail pages. Seller dashboard shows incoming inquiries. '
  'guest_* columns support pre-authentication inquiry submission.';


-- ==============================================================
-- SECTION 10: viewing_requests
-- ==============================================================
-- Property viewing appointment requests.
-- Observed in:
--   - Property detail page: "Request a Viewing" button
--   - SellerDashboard: Buyer Requests section (Approve Viewing button)
--   - BuyerDashboard: "Viewing Requests: 2, 1 scheduled" stat card
-- ==============================================================

CREATE TABLE public.viewing_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id         UUID NOT NULL REFERENCES public.profiles(id),
  seller_id        UUID NOT NULL REFERENCES public.profiles(id),
  agent_id         UUID REFERENCES public.agents(id),  -- nullable

  requested_date   DATE NOT NULL,
  requested_time   TIME,
  message          TEXT,

  -- Status workflow
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN (
                     'pending', 'confirmed', 'completed', 'cancelled', 'rejected'
                   )),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_viewing_requests_property_id ON public.viewing_requests(property_id);
CREATE INDEX idx_viewing_requests_buyer_id    ON public.viewing_requests(buyer_id);
CREATE INDEX idx_viewing_requests_seller_id   ON public.viewing_requests(seller_id);
CREATE INDEX idx_viewing_requests_status      ON public.viewing_requests(status);

COMMENT ON TABLE public.viewing_requests IS
  'Property viewing appointment bookings. Buyers request viewings via the property '
  'detail page. Sellers approve/reject via their dashboard. '
  'Used by BuyerDashboard (Viewing Requests stat) and SellerDashboard (Buyer Requests).';


-- ==============================================================
-- SECTION 11: valuation_requests
-- ==============================================================
-- Digital and professional property valuations.
-- Observed in:
--   - /valuation page: digital (instant) and professional (book a visit) types
--   - Digital: property_address, district, property_type, land_size, building_size
--   - Professional: name, phone, property_address, preferred date/time
--   - Admin dashboard: "Valuation Reqs" stat card
--   - MockData: ValuationRequest interface with estimatedValue, scheduledDate
-- ==============================================================

CREATE TABLE public.valuation_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by       UUID NOT NULL REFERENCES public.profiles(id),
  property_id        UUID REFERENCES public.properties(id),  -- nullable (not always linked)

  -- Property details (typed by user, may not be a listed property)
  property_address   TEXT NOT NULL,
  district           TEXT NOT NULL,
  property_type      TEXT NOT NULL
                     CHECK (property_type IN (
                       'house', 'apartment', 'villa', 'land', 'commercial', 'agricultural'
                     )),

  -- Dimensions
  land_size          NUMERIC(10,2),    -- Perches
  building_size      NUMERIC(10,2),    -- Sq Ft

  -- Valuation type
  valuation_type     TEXT NOT NULL
                     CHECK (valuation_type IN ('digital', 'professional')),

  -- Results
  estimated_value    NUMERIC(18,2),   -- populated after digital or professional valuation

  -- Assignment (professional valuation: assigned to an agent/valuer)
  assigned_agent_id  UUID REFERENCES public.agents(id),
  scheduled_date     TIMESTAMPTZ,     -- professional visit date/time

  -- Reference code shown to user after booking (e.g. PROPIX-VAL-12345)
  reference_code     TEXT,

  -- Status
  status             TEXT NOT NULL DEFAULT 'submitted'
                     CHECK (status IN (
                       'submitted', 'under_review', 'assigned',
                       'scheduled', 'completed', 'rejected'
                     )),

  notes              TEXT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_valuation_requests_requested_by ON public.valuation_requests(requested_by);
CREATE INDEX idx_valuation_requests_status       ON public.valuation_requests(status);
CREATE INDEX idx_valuation_requests_type         ON public.valuation_requests(valuation_type);

COMMENT ON TABLE public.valuation_requests IS
  'Digital and professional property valuation requests. '
  'Digital: instant algorithmic estimate. Professional: certified valuer site visit. '
  'property_id is nullable because the property may not be listed on PROPIX. '
  'reference_code is displayed to the user (e.g. PROPIX-VAL-12345).';


-- ==============================================================
-- SECTION 12: consultation_requests
-- ==============================================================
-- Expert agent consultations.
-- Observed in:
--   - /consultation page: buying, selling, investment, general types
--   - Fields: name, email, phone, property (optional), type, date, time, notes
--   - BuyerDashboard: "My Consultations" section
--   - MockData: ConsultationRequest with assignedAgent, scheduledDate
--   - Admin dashboard has "Buyer Requests" section
-- ==============================================================

CREATE TABLE public.consultation_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by        UUID NOT NULL REFERENCES public.profiles(id),
  property_id         UUID REFERENCES public.properties(id),    -- nullable (optional)
  assigned_agent_id   UUID REFERENCES public.agents(id),        -- nullable until assigned

  -- Guest fields (support pre-auth or guest-submitted consultations)
  guest_name          TEXT,
  guest_email         TEXT,
  guest_phone         TEXT,

  -- Consultation type
  consultation_type   TEXT NOT NULL DEFAULT 'general'
                      CHECK (consultation_type IN (
                        'buying', 'selling', 'investment', 'general'
                      )),

  preferred_date      DATE,
  preferred_time      TIME,
  message             TEXT,   -- "Additional Notes" field from the form

  -- Reference code shown to user (e.g. CON-12345)
  reference_code      TEXT,

  -- Status workflow
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending', 'confirmed', 'completed', 'cancelled', 'rejected'
                      )),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultation_requested_by ON public.consultation_requests(requested_by);
CREATE INDEX idx_consultation_agent_id     ON public.consultation_requests(assigned_agent_id);
CREATE INDEX idx_consultation_status       ON public.consultation_requests(status);

COMMENT ON TABLE public.consultation_requests IS
  'Expert agent consultation bookings. Types: buying, selling, investment, general. '
  'property_id is optional (user may request consultation without a specific property). '
  'guest_* columns support submissions before auth migration is complete. '
  'reference_code displayed to user (e.g. CON-12345).';


-- ==============================================================
-- SECTION 13: financing_requests
-- ==============================================================
-- Home loan / financing pre-approval requests.
-- Observed in:
--   - /financing page: name, email, phone, monthly income, employment type
--   - EMI calculator is frontend-only (no storage needed)
--   - MockData: FinancingRequest with employmentStatus, monthlyIncome,
--     requestedLoan, propertyValue
--   - Admin dashboard: financing requests management
-- ==============================================================

CREATE TABLE public.financing_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id        UUID NOT NULL REFERENCES public.profiles(id),

  -- Guest fields (support pre-auth submissions)
  guest_name          TEXT,
  guest_email         TEXT,
  guest_phone         TEXT,

  -- Employment details (matches /financing page form)
  employment_status   TEXT NOT NULL
                      CHECK (employment_status IN (
                        'salaried', 'self_employed', 'business_owner', 'overseas_employed'
                      )),
  monthly_income      NUMERIC(18,2) NOT NULL CHECK (monthly_income >= 0),

  -- Loan details
  requested_loan      NUMERIC(18,2) NOT NULL CHECK (requested_loan >= 0),
  property_value      NUMERIC(18,2) CHECK (property_value >= 0),
  loan_term_years     INTEGER CHECK (loan_term_years >= 1 AND loan_term_years <= 30),
  interest_rate       NUMERIC(5,2),  -- Interest rate used in EMI calculator

  -- Reference code shown to user (e.g. PROPIX-LOAN-12345)
  reference_code      TEXT,

  -- Processing status
  status              TEXT NOT NULL DEFAULT 'submitted'
                      CHECK (status IN (
                        'submitted', 'under_review', 'eligible',
                        'not_eligible', 'approved', 'rejected'
                      )),

  notes               TEXT,   -- admin notes / rejection reason

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financing_requests_applicant_id ON public.financing_requests(applicant_id);
CREATE INDEX idx_financing_requests_status       ON public.financing_requests(status);

COMMENT ON TABLE public.financing_requests IS
  'Home financing pre-approval requests submitted through the /financing page. '
  'guest_* columns support submissions before auth migration. '
  'The EMI calculator on the frontend is stateless — only the final request is stored. '
  'reference_code displayed to user (e.g. PROPIX-LOAN-12345).';


-- ==============================================================
-- SECTION 14: notifications
-- ==============================================================
-- In-app notification system.
-- Needed for: seller notifications (offer received, listing approved/rejected),
-- buyer notifications (viewing confirmed), admin alerts.
-- reference_type + reference_id allow linking to any record.
-- ==============================================================

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  type            TEXT NOT NULL,     -- e.g. 'listing_approved', 'new_inquiry', 'offer_received'
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,

  -- Polymorphic reference: link notification to a specific record
  reference_type  TEXT,              -- e.g. 'property', 'inquiry', 'valuation_request'
  reference_id    UUID,              -- the id of the referenced record

  is_read         BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read  ON public.notifications(user_id, is_read)
  WHERE is_read = FALSE;  -- partial index: only unread notifications

COMMENT ON TABLE public.notifications IS
  'In-app notifications. reference_type + reference_id form a polymorphic link '
  'to the triggering record (property, inquiry, consultation, etc.). '
  'is_read partial index optimizes unread notification count queries.';


-- ==============================================================
-- SECTION 15: UPDATED_AT TRIGGER FUNCTION
-- ==============================================================
-- Auto-update the updated_at column on any table that has it.
-- ==============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with an updated_at column
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_property_documents_updated_at
  BEFORE UPDATE ON public.property_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_viewing_requests_updated_at
  BEFORE UPDATE ON public.viewing_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_valuation_requests_updated_at
  BEFORE UPDATE ON public.valuation_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_consultation_requests_updated_at
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_financing_requests_updated_at
  BEFORE UPDATE ON public.financing_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================
-- SECTION 16: NEW USER PROFILE TRIGGER
-- ==============================================================
-- Automatically create a profile row when a new user signs up
-- through Supabase Auth. This fires after INSERT on auth.users.
-- ==============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Fires after a new user is created in auth.users. '
  'Creates a corresponding public.profiles row. '
  'Reads full_name and role from user metadata if provided during signup.';


-- ==============================================================
-- SECTION 17: ROW LEVEL SECURITY
-- ==============================================================
-- Enable RLS on all application tables.
-- IMPORTANT: We do NOT create USING (true) policies here.
-- Policies are designed for the final auth structure.
-- Auth migration is STEP 3 — policies requiring auth.uid() will
-- be fully effective once users authenticate via Supabase Auth.
--
-- Current state: RLS is ENABLED. Until auth migration is complete,
-- the service_role key (used server-side only) bypasses RLS.
-- ==============================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_features     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;


-- ==============================================================
-- RLS POLICIES — SECTION A: profiles
-- ==============================================================

-- Anyone can read approved public agent profiles (for /agents page)
CREATE POLICY "profiles_public_agent_read" ON public.profiles
  FOR SELECT
  USING (role = 'agent' AND status = 'active');

-- Authenticated users can read their own profile
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Authenticated users can update their own profile
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Profile insert is handled by the handle_new_user() trigger (SECURITY DEFINER).
-- No direct INSERT policy needed from client.


-- ==============================================================
-- RLS POLICIES — SECTION B: agents
-- ==============================================================

-- Anyone can read verified agents (for /agents directory)
CREATE POLICY "agents_public_read" ON public.agents
  FOR SELECT
  USING (is_verified = TRUE);

-- Agents can read/update their own record
CREATE POLICY "agents_self_read" ON public.agents
  FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "agents_self_update" ON public.agents
  FOR UPDATE
  USING (profile_id = auth.uid());

-- Admins can manage all agents
CREATE POLICY "agents_admin_all" ON public.agents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION C: properties
-- ==============================================================

-- Public: anyone can read published properties
CREATE POLICY "properties_public_read" ON public.properties
  FOR SELECT
  USING (status = 'published');

-- Sellers: can read their own properties (all statuses, including draft/rejected)
CREATE POLICY "properties_seller_read_own" ON public.properties
  FOR SELECT
  USING (seller_id = auth.uid());

-- Sellers: can create new properties (draft)
CREATE POLICY "properties_seller_insert" ON public.properties
  FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Sellers: can update their own draft/rejected properties
CREATE POLICY "properties_seller_update_own" ON public.properties
  FOR UPDATE
  USING (
    seller_id = auth.uid()
    AND status IN ('draft', 'rejected')
  );

-- Agents: can read properties assigned to them
CREATE POLICY "properties_agent_read_assigned" ON public.properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = properties.agent_id AND a.profile_id = auth.uid()
    )
  );

-- Admins: can read and update all properties (for verification workflow)
CREATE POLICY "properties_admin_all" ON public.properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION D: property_images
-- ==============================================================

-- Anyone can read images for published properties
CREATE POLICY "property_images_public_read" ON public.property_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.id = property_images.property_id AND pr.status = 'published'
    )
  );

-- Sellers can manage images for their own properties
CREATE POLICY "property_images_seller_manage" ON public.property_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.id = property_images.property_id AND pr.seller_id = auth.uid()
    )
  );

-- Admins can read all images (for verification)
CREATE POLICY "property_images_admin_read" ON public.property_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION E: property_documents (STRICT)
-- ==============================================================
-- Documents are CONFIDENTIAL. Only uploader and admins may access.

-- Sellers can read their own uploaded documents
CREATE POLICY "property_documents_seller_read_own" ON public.property_documents
  FOR SELECT
  USING (uploaded_by = auth.uid());

-- Sellers can upload documents for their own properties
CREATE POLICY "property_documents_seller_insert" ON public.property_documents
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.id = property_documents.property_id AND pr.seller_id = auth.uid()
    )
  );

-- ONLY admins can read all documents (verification workflow)
CREATE POLICY "property_documents_admin_all" ON public.property_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION F: property_features
-- ==============================================================

-- Anyone can read features for published properties
CREATE POLICY "property_features_public_read" ON public.property_features
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.id = property_features.property_id AND pr.status = 'published'
    )
  );

-- Sellers manage features for their own properties
CREATE POLICY "property_features_seller_manage" ON public.property_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.id = property_features.property_id AND pr.seller_id = auth.uid()
    )
  );

-- Admins can read all
CREATE POLICY "property_features_admin_read" ON public.property_features
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION G: saved_properties
-- ==============================================================

-- Users can only see their own saved properties
CREATE POLICY "saved_properties_self_all" ON public.saved_properties
  FOR ALL
  USING (user_id = auth.uid());


-- ==============================================================
-- RLS POLICIES — SECTION H: property_views
-- ==============================================================

-- Anyone (including anon) can INSERT a view record (analytics)
CREATE POLICY "property_views_insert_anon" ON public.property_views
  FOR INSERT
  WITH CHECK (TRUE);

-- Users can read their own view history
CREATE POLICY "property_views_self_read" ON public.property_views
  FOR SELECT
  USING (viewer_id = auth.uid());

-- Sellers can read view counts on their properties
CREATE POLICY "property_views_seller_read" ON public.property_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.id = property_views.property_id AND pr.seller_id = auth.uid()
    )
  );

-- Admins can read all views
CREATE POLICY "property_views_admin_read" ON public.property_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION I: inquiries
-- ==============================================================

-- Buyers can read and insert their own inquiries
CREATE POLICY "inquiries_buyer_self" ON public.inquiries
  FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "inquiries_buyer_insert" ON public.inquiries
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Sellers can read inquiries about their properties
CREATE POLICY "inquiries_seller_read" ON public.inquiries
  FOR SELECT
  USING (seller_id = auth.uid());

-- Sellers can update status (e.g. mark as read/responded)
CREATE POLICY "inquiries_seller_update" ON public.inquiries
  FOR UPDATE
  USING (seller_id = auth.uid());

-- Agents can read inquiries for properties they manage
CREATE POLICY "inquiries_agent_read" ON public.inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = inquiries.agent_id AND a.profile_id = auth.uid()
    )
  );

-- Admins can read all
CREATE POLICY "inquiries_admin_read" ON public.inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION J: viewing_requests
-- ==============================================================

-- Buyers can read their own viewing requests
CREATE POLICY "viewing_requests_buyer_self" ON public.viewing_requests
  FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "viewing_requests_buyer_insert" ON public.viewing_requests
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Sellers can read and update (approve/reject) viewing requests for their properties
CREATE POLICY "viewing_requests_seller_read" ON public.viewing_requests
  FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "viewing_requests_seller_update" ON public.viewing_requests
  FOR UPDATE
  USING (seller_id = auth.uid());

-- Admins can read all
CREATE POLICY "viewing_requests_admin_read" ON public.viewing_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION K: valuation_requests
-- ==============================================================

-- Users can read their own valuation requests
CREATE POLICY "valuation_requests_self" ON public.valuation_requests
  FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "valuation_requests_insert" ON public.valuation_requests
  FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Agents can read requests assigned to them
CREATE POLICY "valuation_requests_agent_read" ON public.valuation_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = valuation_requests.assigned_agent_id AND a.profile_id = auth.uid()
    )
  );

-- Admins can manage all valuation requests
CREATE POLICY "valuation_requests_admin_all" ON public.valuation_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION L: consultation_requests
-- ==============================================================

-- Users can read their own consultations
CREATE POLICY "consultation_requests_self" ON public.consultation_requests
  FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "consultation_requests_insert" ON public.consultation_requests
  FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Agents can read consultations assigned to them
CREATE POLICY "consultation_requests_agent_read" ON public.consultation_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = consultation_requests.assigned_agent_id AND a.profile_id = auth.uid()
    )
  );

-- Admins can manage all
CREATE POLICY "consultation_requests_admin_all" ON public.consultation_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION M: financing_requests
-- ==============================================================

-- Users can read their own financing requests
CREATE POLICY "financing_requests_self" ON public.financing_requests
  FOR SELECT
  USING (applicant_id = auth.uid());

CREATE POLICY "financing_requests_insert" ON public.financing_requests
  FOR INSERT
  WITH CHECK (applicant_id = auth.uid());

-- Admins can manage all financing requests
CREATE POLICY "financing_requests_admin_all" ON public.financing_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- RLS POLICIES — SECTION N: notifications
-- ==============================================================

-- Users can only read their own notifications
CREATE POLICY "notifications_self_read" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "notifications_self_update" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can insert notifications for any user (system alerts)
CREATE POLICY "notifications_admin_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ==============================================================
-- STORAGE BUCKET NOTES (Cannot be created via SQL)
-- ==============================================================
-- Create the following two buckets MANUALLY via the Supabase Dashboard:
--
-- 1. Bucket Name: property-images
--    Public: YES (images are publicly viewable)
--    File size limit: 10MB per file
--    Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- 2. Bucket Name: property-documents
--    Public: NO (MUST be private — confidential legal documents)
--    File size limit: 20MB per file
--    Allowed MIME types: application/pdf, image/jpeg, image/png,
--                        application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
--
-- Storage RLS policies will be configured in Step 3 (auth migration).
-- For now, only service_role key can access buckets.
-- ==============================================================


-- ==============================================================
-- END OF MIGRATION: 001_initial_schema.sql
-- ==============================================================
