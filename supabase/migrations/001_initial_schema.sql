-- =============================================================
-- supabase/migrations/001_initial_schema.sql
-- FuelRadar & GridWatch Naija — Initial Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- STEP 1: Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- STEP 2: stations table
CREATE TABLE IF NOT EXISTS public.stations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('fuel', 'cng')),
  address      TEXT,
  city         TEXT NOT NULL,
  location     geography(Point, 4326) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 3: station_reports table
CREATE TABLE IF NOT EXISTS public.station_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id     UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  status         TEXT NOT NULL CHECK (status IN ('fast', 'moderate', 'sold_out', 'available', 'outage')),
  queue_minutes  INTEGER,
  reporter_id    TEXT,
  reported_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 4: Indexes
CREATE INDEX IF NOT EXISTS stations_location_idx
  ON public.stations USING GIST (location);
CREATE INDEX IF NOT EXISTS reports_station_time_idx
  ON public.station_reports (station_id, reported_at DESC);

-- STEP 5: Row Level Security
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stations"
  ON public.stations FOR SELECT USING (true);
CREATE POLICY "Anyone can read reports"
  ON public.station_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reports"
  ON public.station_reports FOR INSERT WITH CHECK (true);

-- STEP 6: Seed data
INSERT INTO public.stations (name, type, address, city, location) VALUES
  ('NNPC Mega Station Lekki','fuel','Lekki-Epe Expressway, Lekki Phase 1, Lagos','Lagos',ST_SetSRID(ST_MakePoint(3.5852, 6.4350), 4326)),
  ('Total Energies, Victoria Island','fuel','24 Ozumba Mbadiwe Ave, Victoria Island, Lagos','Lagos',ST_SetSRID(ST_MakePoint(3.4219, 6.4281), 4326)),
  ('MRS Fuel Station, Surulere','fuel','Adeniran Ogunsanya St, Surulere, Lagos','Lagos',ST_SetSRID(ST_MakePoint(3.3581, 6.4969), 4326)),
  ('CNG Lagos Island Hub','cng','Marina Road, Lagos Island, Lagos','Lagos',ST_SetSRID(ST_MakePoint(3.3958, 6.4541), 4326)),
  ('Conoil Yaba','fuel','Herbert Macaulay Way, Yaba, Lagos','Lagos',ST_SetSRID(ST_MakePoint(3.3747, 6.5093), 4326)),
  ('Ardova Ikeja','fuel','Obafemi Awolowo Way, Ikeja, Lagos','Lagos',ST_SetSRID(ST_MakePoint(3.3395, 6.5942), 4326)),
  ('NNPC Filling Station, Wuse 2','fuel','Aminu Kano Crescent, Wuse 2, Abuja','Abuja',ST_SetSRID(ST_MakePoint(7.4891, 9.0697), 4326)),
  ('Total Energies, Garki','fuel','Moshood Abiola Way, Garki, Abuja','Abuja',ST_SetSRID(ST_MakePoint(7.5017, 9.0556), 4326)),
  ('Conoil Maitama','fuel','Aguiyi Ironsi St, Maitama, Abuja','Abuja',ST_SetSRID(ST_MakePoint(7.5068, 9.0820), 4326)),
  ('CNG Abuja Central Hub','cng','Shehu Shagari Way, Central Area, Abuja','Abuja',ST_SetSRID(ST_MakePoint(7.4916, 9.0668), 4326)),
  ('MRS Gwarinpa','fuel','5th Avenue, Gwarinpa Estate, Abuja','Abuja',ST_SetSRID(ST_MakePoint(7.4284, 9.1092), 4326)),
  ('Rainoil Kubwa','fuel','Kubwa Express Road, Kubwa, Abuja','Abuja',ST_SetSRID(ST_MakePoint(7.3521, 9.1468), 4326));

-- STEP 7: Sample reports
INSERT INTO public.station_reports (station_id, status, queue_minutes, reporter_id)
SELECT id, 'moderate', 25, 'seed-device-001' FROM public.stations WHERE name = 'NNPC Mega Station Lekki';
INSERT INTO public.station_reports (station_id, status, queue_minutes, reporter_id)
SELECT id, 'sold_out', NULL, 'seed-device-002' FROM public.stations WHERE name = 'Total Energies, Victoria Island';
INSERT INTO public.station_reports (station_id, status, queue_minutes, reporter_id)
SELECT id, 'fast', 5, 'seed-device-003' FROM public.stations WHERE name = 'NNPC Filling Station, Wuse 2';
INSERT INTO public.station_reports (station_id, status, queue_minutes, reporter_id)
SELECT id, 'available', NULL, 'seed-device-004' FROM public.stations WHERE name = 'CNG Lagos Island Hub';
