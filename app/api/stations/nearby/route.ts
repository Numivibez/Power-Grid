// =============================================================
// app/api/stations/nearby/route.ts
// GET /api/stations/nearby?lat=6.45&lng=3.39&radius=5000
//
// Returns stations within `radius` metres of a given GPS point,
// each with its latest crowd report.
//
// QUERY PARAMETERS:
//   lat    — user's latitude  (e.g. 6.4541)
//   lng    — user's longitude (e.g. 3.3958)
//   radius — search radius in metres (default: 5000 = 5 km)
//
// HOW THE GEOSPATIAL FILTER WORKS:
//   We call a Supabase RPC (Remote Procedure Call) — a custom
//   PostgreSQL function we define in our DB. It runs PostGIS's
//   ST_DWithin() which uses the spatial index we created in
//   migration step 4 for blazing-fast geo queries.
//   Without the index it'd scan every row; with it, only nearby
//   rows are touched.
// =============================================================

import { connection } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parsePostGisLocation } from '@/lib/supabase/utils';
import { FALLBACK_STATIONS } from '@/lib/fallback-data';
import type { StationWithLatestReport } from '@/types/station';

export async function GET(request: Request) {
  await connection();
  // ── PARSE QUERY PARAMETERS ─────────────────────────────────
  // request.url gives us the full URL including ?lat=...&lng=...
  // URL() is a standard browser/Node API for parsing URLs.
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  // Default radius: 5 km = 5000 metres
  const radius = parseInt(searchParams.get('radius') ?? '5000', 10);

  // Validate that we got real numbers, not NaN
  if (isNaN(lat) || isNaN(lng)) {
    return Response.json(
      { error: 'Missing or invalid lat/lng query parameters' },
      { status: 400 } // 400 Bad Request
    );
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return Response.json(FALLBACK_STATIONS);
  }

  // ── GEOSPATIAL QUERY VIA RPC ───────────────────────────────
  // .rpc('nearby_stations', { ... }) calls a PostgreSQL function
  // named `nearby_stations` that we need to create in Supabase.
  //
  // The function signature (SQL) is:
  //   CREATE OR REPLACE FUNCTION nearby_stations(
  //     user_lat float, user_lng float, radius_metres float
  //   ) RETURNS SETOF stations AS $$
  //     SELECT * FROM stations
  //     WHERE ST_DWithin(
  //       location,
  //       ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
  //       radius_metres
  //     )
  //     ORDER BY location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
  //   $$ LANGUAGE sql STABLE;
  //
  // We paste this function in Supabase SQL Editor too (see instructions below).
  // ───────────────────────────────────────────────────────────
  const { data: nearbyStations, error } = await supabase
    .rpc('nearby_stations', {
      user_lat: lat,
      user_lng: lng,
      radius_metres: radius,
    });

  if (error) {
    console.error('[GET /api/stations/nearby] Supabase error:', error.message);
    return Response.json(
      { error: 'Failed to fetch nearby stations' },
      { status: 500 }
    );
  }

  // If no stations found, return an empty array (not an error)
  if (!nearbyStations || nearbyStations.length === 0) {
    return Response.json([]);
  }

  // ── FETCH LATEST REPORTS FOR EACH NEARBY STATION ──────────
  // The RPC returns station rows only. We now fetch their latest
  // reports in a single query using `in` filter (one round-trip).
  const stationIds = nearbyStations.map((s: { id: string }) => s.id);

  const { data: reports, error: reportsError } = await supabase
    .from('station_reports')
    .select('id, station_id, status, queue_minutes, reported_at')
    // .in() = SQL WHERE station_id IN ('uuid1', 'uuid2', ...)
    .in('station_id', stationIds)
    // For each station, get newest report first
    .order('reported_at', { ascending: false });

  if (reportsError) {
    console.error('[GET /api/stations/nearby] Reports error:', reportsError.message);
    // Still return stations even if reports fetch fails — degrade gracefully
  }

  // ── BUILD A MAP OF stationId → latestReport ─────────────
  // We iterate reports once to build a lookup object.
  // Because reports are sorted newest-first, the first report
  // we see for each station_id is the latest one.
  type ReportRow = {
    id: string;
    station_id: string;
    status: string;
    queue_minutes: number | null;
    reported_at: string;
  };

  const latestReportByStation = new Map<string, ReportRow>();
  for (const report of (reports ?? []) as ReportRow[]) {
    // Only store the first (newest) report for each station
    if (!latestReportByStation.has(report.station_id)) {
      latestReportByStation.set(report.station_id, report);
    }
  }

  // ── COMBINE STATIONS + REPORTS ─────────────────────────────
  const shaped: StationWithLatestReport[] = nearbyStations.map(
    (station: StationWithLatestReport) => ({
      ...station,
      location: parsePostGisLocation(station.location),
      latest_report: latestReportByStation.get(station.id) ?? null,
    })
  );

  return Response.json(shaped);
}
