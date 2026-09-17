-- ================================================================================
-- MIFOS SYSTEM - MIGRATION 004: STOCK INTERESTS SEPARATE TABLE
-- ================================================================================
-- Execute this migration script in Supabase SQL Editor to create the dedicated
-- stock_interests table for recording interest additions under stock bills.

CREATE TABLE IF NOT EXISTS public.stock_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_no TEXT NOT NULL,
    date DATE NOT NULL,
    interest_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    branch TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.stock_interests ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated access
DROP POLICY IF EXISTS "Public stock_interests select" ON public.stock_interests;
DROP POLICY IF EXISTS "Public stock_interests insert" ON public.stock_interests;
DROP POLICY IF EXISTS "Public stock_interests update" ON public.stock_interests;
DROP POLICY IF EXISTS "Public stock_interests delete" ON public.stock_interests;

CREATE POLICY "Public stock_interests select" ON public.stock_interests FOR SELECT USING (true);
CREATE POLICY "Public stock_interests insert" ON public.stock_interests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public stock_interests update" ON public.stock_interests FOR UPDATE USING (true);
CREATE POLICY "Public stock_interests delete" ON public.stock_interests FOR DELETE USING (true);
