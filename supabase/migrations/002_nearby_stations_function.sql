-- =============================================================
-- supabase/migrations/002_nearby_stations_function.sql
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- This creates the PostgreSQL function that the
-- GET /api/stations/nearby endpoint calls via supabase.rpc().
--
-- WHAT IT DOES:
--   Given a user's lat/lng and a search radius in metres,
--   returns all stations within that circle, sorted by distance
--   (nearest first). It uses PostGIS's ST_DWithin() which
--   leverages our GIST spatial index for performance.
--
-- PARAMETER ORDER NOTE:
--   ST_MakePoint() takes (longitude, latitude) — NOT lat/lng!
--   This is a classic PostGIS gotcha. Longitude = X axis (East/West),
--   Latitude = Y axis (North/South).
-- =============================================================

CREATE OR REPLACE FUNCTION nearby_stations(
  user_lat      float,   -- User's latitude  (e.g. 6.4541)
  user_lng      float,   -- User's longitude (e.g. 3.3958)
  radius_metres float    -- Search radius in metres (e.g. 5000 = 5km)
)
RETURNS SETOF public.stations   -- Returns full station rows
LANGUAGE sql
STABLE   -- 'STABLE' = same inputs always give same output within one transaction
         -- (lets PostgreSQL cache/optimise the call)
AS $$
  SELECT *
  FROM public.stations
  WHERE ST_DWithin(
    -- The station's stored location (PostGIS geography column)
    location,
    -- Build a geography point from the user's coordinates
    -- ::geography casts it to the same type as our column
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    -- Search radius in metres (geography uses metres by default)
    radius_metres
  )
  -- <-> is the PostGIS "distance" operator — sorts results nearest first
  ORDER BY
    location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
$$;
