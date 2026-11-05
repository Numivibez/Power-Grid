// =============================================================
// app/api/stations/route.ts
// GET /api/stations
//
// Returns all stations, each with its latest crowd report.
//
// WHY THIS FILE IS A ROUTE HANDLER:
//   This file exports a GET function. Next.js detects that and
//   treats the file as an API endpoint, NOT a page. Any HTTP GET
//   request to /api/stations will run this function on the server.
//
// SUPABASE QUERY EXPLAINED:
//   We use "table joins via foreign keys" — Supabase can
//   automatically join station_reports to stations because we
//   defined station_id as a foreign key in our SQL schema.
//   The syntax `station_reports(*)` inside select() tells
//   Supabase: "also fetch related rows from station_reports".
// =============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parsePostGisLocation } from '@/lib/supabase/utils';
import type { StationWithLatestReport } from '@/types/station';


export async function GET() {
  // Create a fresh server-side Supabase client for this request
  const supabase = createServerSupabaseClient();

  // ── QUERY ──────────────────────────────────────────────────
  // .from('stations')          → target the stations table
  // .select(`                  → choose which columns to return
  //   *,                       → all station columns
  //   station_reports(          → also fetch related reports
  //     id, status,            → only these report columns
  //     queue_minutes,
  //     reported_at
  //   )
  // `)
  // .order('reported_at', {    → within each station's reports,
  //   foreignTable:            → sort by newest first
  //   'station_reports',
  //   ascending: false
  // })
  // ───────────────────────────────────────────────────────────
  const { data: stations, error } = await supabase
    .from('stations')
    .select(`
      *,
      station_reports (
        id,
        status,
        queue_minutes,
        reported_at
      )
    `)
    .order('reported_at', {
      referencedTable: 'station_reports',
      ascending: false,
    });

  // If the database query fails, return a 500 error response.
  // Response.json() is the standard Next.js way to return JSON.
  if (error) {
    console.error('[GET /api/stations] Supabase error:', error.message);
    return Response.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }

  // ── RESHAPE DATA ───────────────────────────────────────────
  // Supabase returns station_reports as an ARRAY (one station can
  // have many reports). We only want the LATEST one (index [0]
  // since we sorted descending), so we reshape the data here
  // before sending it to the browser.
  //
  // Before:  { id: '...', name: '...', station_reports: [{...}, {...}] }
  // After:   { id: '...', name: '...', latest_report: {...} | null }
  // ───────────────────────────────────────────────────────────
  const shaped: StationWithLatestReport[] = (stations ?? []).map((station) => {
    // station_reports is typed as any[] by Supabase's generic client.
    // We destructure it out and rename for clarity.
    const { station_reports, ...stationFields } = station as typeof station & {
      station_reports: Array<{
        id: string;
        status: string;
        queue_minutes: number | null;
        reported_at: string;
      }>;
    };

    return {
      ...stationFields,
      location: parsePostGisLocation(station.location),
      // Take only the first (newest) report, or null if no reports yet
      latest_report: station_reports?.[0] ?? null,
    } as StationWithLatestReport;
  });

  // Return the shaped data as JSON with a 200 OK status
  return Response.json(shaped);
}
