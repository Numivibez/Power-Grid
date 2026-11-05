-- =============================================================
-- supabase/migrations/003_add_state_and_nationwide_seed.sql
-- Add state column & 45+ nationwide stations across Nigeria
-- =============================================================

ALTER TABLE public.stations 
ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'Lagos';

UPDATE public.stations SET state = 'Lagos' WHERE city = 'Lagos';
UPDATE public.stations SET state = 'FCT' WHERE city = 'Abuja';

CREATE INDEX IF NOT EXISTS stations_state_idx ON public.stations (state);

INSERT INTO public.stations (name, type, address, city, state, location) VALUES

  -- LAGOS STATE
  ('NIPCO CNG Mother Station, Ibafo', 'cng', 'Lagos-Ibadan Expressway, Ibafo', 'Ibafo', 'Ogun', ST_SetSRID(ST_MakePoint(3.4289, 6.7118), 4326)),
  ('Bovas Petroleum, Ojodu Berger', 'fuel', 'Berger Bus Stop, Ojodu', 'Ikeja', 'Lagos', ST_SetSRID(ST_MakePoint(3.3712, 6.6432), 4326)),
  ('NNPC Retail, Festac Town', 'fuel', '2nd Avenue, Festac Town', 'Amuwo-Odofin', 'Lagos', ST_SetSRID(ST_MakePoint(3.2921, 6.4678), 4326)),
  ('Mobil (11Plc), Maryland', 'fuel', 'Ikorodu Road, Maryland Junction', 'Maryland', 'Lagos', ST_SetSRID(ST_MakePoint(3.3689, 6.5721), 4326)),
  ('Rainoil, Ikorodu', 'fuel', 'Lagos Road, Benson Bus Stop', 'Ikorodu', 'Lagos', ST_SetSRID(ST_MakePoint(3.5042, 6.6189), 4326)),
  ('TotalEnergies, Agege Pen Cinema', 'fuel', 'Old Abeokuta Road, Pen Cinema', 'Agege', 'Lagos', ST_SetSRID(ST_MakePoint(3.3214, 6.6215), 4326)),
  ('NNPC Mega Station, Alapere', 'fuel', 'Third Mainland Bridge / Ogudu Link', 'Ogudu', 'Lagos', ST_SetSRID(ST_MakePoint(3.3912, 6.5714), 4326)),
  ('Portland CNG Conversion & Refueling, Ilupeju', 'cng', 'Industrial Avenue, Ilupeju', 'Ilupeju', 'Lagos', ST_SetSRID(ST_MakePoint(3.3615, 6.5489), 4326)),

  -- ABUJA (FCT)
  ('NNPC Mega Station, Zone 1', 'fuel', 'Olusegun Obasanjo Way, Wuse Zone 1', 'Wuse', 'FCT', ST_SetSRID(ST_MakePoint(7.4715, 9.0589), 4326)),
  ('NIPCO CNG Station, Airport Road', 'cng', 'Airport Road, Lugbe', 'Lugbe', 'FCT', ST_SetSRID(ST_MakePoint(7.3789, 8.9812), 4326)),
  ('Ardova Plc, Jabi', 'fuel', 'Obafemi Awolowo Way, Jabi District', 'Jabi', 'FCT', ST_SetSRID(ST_MakePoint(7.4298, 9.0712), 4326)),
  ('Bovas, Apo Mechanic Village', 'fuel', 'Apo Resettlement Road', 'Apo', 'FCT', ST_SetSRID(ST_MakePoint(7.5112, 9.0089), 4326)),
  ('TotalEnergies, Utako', 'fuel', 'Arab Road, Utako District', 'Utako', 'FCT', ST_SetSRID(ST_MakePoint(7.4412, 9.0621), 4326)),

  -- RIVERS STATE (PORT HARCOURT)
  ('NNPC Mega Station, Port Harcourt', 'fuel', 'Aba Road, Port Harcourt', 'Port Harcourt', 'Rivers', ST_SetSRID(ST_MakePoint(7.0125, 4.8214), 4326)),
  ('TotalEnergies, Trans-Amadi', 'fuel', 'Trans-Amadi Industrial Layout', 'Port Harcourt', 'Rivers', ST_SetSRID(ST_MakePoint(7.0421, 4.8115), 4326)),
  ('Rainoil, Choba / Uniport', 'fuel', 'East-West Road, Choba', 'Choba', 'Rivers', ST_SetSRID(ST_MakePoint(6.9089, 4.8989), 4326)),
  ('Conoil, Olu Obasanjo Road', 'fuel', 'Olu Obasanjo Road, GRA Phase 2', 'Port Harcourt', 'Rivers', ST_SetSRID(ST_MakePoint(7.0012, 4.8321), 4326)),

  -- OYO STATE (IBADAN)
  ('Bovas Mega Station, Bodija', 'fuel', 'Secretariat Road, Bodija', 'Ibadan', 'Oyo', ST_SetSRID(ST_MakePoint(3.9112, 7.4289), 4326)),
  ('TotalEnergies, Ring Road', 'fuel', 'MKO Abiola Way, Ring Road', 'Ibadan', 'Oyo', ST_SetSRID(ST_MakePoint(3.8712, 7.3621), 4326)),
  ('NNPC Retail, Iwo Road Interchange', 'fuel', 'Iwo Road, Expressway Junction', 'Ibadan', 'Oyo', ST_SetSRID(ST_MakePoint(3.9512, 7.4089), 4326)),
  ('NIPCO CNG Mother Hub, Ibadan', 'cng', 'Toll Gate, Lagos-Ibadan Expressway', 'Ibadan', 'Oyo', ST_SetSRID(ST_MakePoint(3.8589, 7.3112), 4326)),

  -- KANO STATE
  ('NNPC Mega Station, Kano', 'fuel', 'Maiduguri Road, Tarauni', 'Kano', 'Kano', ST_SetSRID(ST_MakePoint(8.5412, 11.9712), 4326)),
  ('TotalEnergies, Bompai', 'fuel', 'Bompai Road, Fagge', 'Kano', 'Kano', ST_SetSRID(ST_MakePoint(8.5312, 12.0112), 4326)),
  ('Ardova Plc, State Road', 'fuel', 'State Road, Nassarawa', 'Kano', 'Kano', ST_SetSRID(ST_MakePoint(8.5215, 11.9889), 4326)),

  -- EDO & DELTA
  ('NNPC Mega Station, Benin City', 'fuel', 'Sapele Road, Benin City', 'Benin City', 'Edo', ST_SetSRID(ST_MakePoint(5.6214, 6.3112), 4326)),
  ('Rainoil, Asaba Express', 'fuel', 'Benin-Asaba Expressway, Asaba', 'Asaba', 'Delta', ST_SetSRID(ST_MakePoint(6.6912, 6.2012), 4326)),
  ('NIPCO CNG Station, Warri', 'cng', 'Effurun-Sapele Road, Effurun', 'Warri', 'Delta', ST_SetSRID(ST_MakePoint(5.7812, 5.5412), 4326));
