-- Migration: Add scraped event columns
-- Description: Extends events table to support scraped events from external platforms

-- Add core columns for scraped events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source_platform varchar(50);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_id varchar(100);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_name varchar(255);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price_range varchar(100);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_name varchar(255);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS scraped_at timestamp with time zone;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_external boolean default false;

-- Add tracking and pricing columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_tiers JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS min_price integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_price integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS click_count integer default 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS last_verified_at timestamp with time zone;

-- Create unique constraint for deduplication (source_platform + external_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_external_event'
  ) THEN
    ALTER TABLE public.events ADD CONSTRAINT unique_external_event 
      UNIQUE (source_platform, external_id);
  END IF;
END $$;

-- Create index for faster source filtering
CREATE INDEX IF NOT EXISTS idx_events_source_platform ON public.events(source_platform);
CREATE INDEX IF NOT EXISTS idx_events_is_external ON public.events(is_external);

-- Scraper run history table
CREATE TABLE IF NOT EXISTS public.scraper_runs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    status varchar(20) DEFAULT 'running', -- running, completed, failed
    total_events integer DEFAULT 0,
    events_inserted integer DEFAULT 0,
    events_updated integer DEFAULT 0,
    platform_results jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

-- Event click tracking table
CREATE TABLE IF NOT EXISTS public.event_clicks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id uuid REFERENCES public.events(id),
    user_id uuid REFERENCES public.users(id),
    clicked_at timestamp with time zone DEFAULT now(),
    source varchar(50), -- 'detail_screen', 'discover', 'notification'
    device_info jsonb
);

CREATE INDEX IF NOT EXISTS idx_event_clicks_event_id ON public.event_clicks(event_id);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started ON public.scraper_runs(started_at DESC);

-- Function to increment click count atomically
CREATE OR REPLACE FUNCTION public.increment_click_count(event_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.events
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
