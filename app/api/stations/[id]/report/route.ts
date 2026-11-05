// =============================================================
// app/api/stations/[id]/report/route.ts
// POST /api/stations/:id/report
//
// Accepts a crowd-sourced status report for a specific station
// and inserts it into the station_reports table.
//
// REQUEST BODY (JSON):
//   {
//     "status": "fast" | "moderate" | "sold_out" | "available" | "outage",
//     "queue_minutes": 15,     ← optional
//     "reporter_id": "abc123"  ← anonymous device fingerprint
//   }
//
// RESPONSE:
//   201 Created — the new report row
//   400 Bad Request — missing/invalid fields
//   404 Not Found — station doesn't exist
//   500 Server Error — database failure
//
// WHY [id] IN THE FOLDER NAME?
//   Square brackets tell Next.js this is a "dynamic segment".
//   A request to /api/stations/abc-123/report will set
//   params.id = "abc-123". We read that to know WHICH station
//   the report is for.
// =============================================================

import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSampleStations } from '@/lib/supabase/sample-data';
import type { ReportStatus } from '@/types/station';

// All valid status values — used for input validation below
const VALID_STATUSES: ReportStatus[] = [
  'fast', 'moderate', 'sold_out', 'available', 'outage',
];

export async function POST(
  request: Request,
  // RouteContext is a Next.js 16 global helper for typing dynamic params.
  // The string '/stations/[id]/report' tells TypeScript exactly what
  // params shape to expect — it auto-generates this from your file path.
  ctx: RouteContext<'/api/stations/[id]/report'>
) {
  // ── READ DYNAMIC ROUTE PARAM ───────────────────────────────
  // In Next.js 16+, params is a Promise — we must await it.
  const { id: stationId } = await ctx.params;

  // ── PARSE & VALIDATE REQUEST BODY ─────────────────────────
  let body: {
    status?: string;
    queue_minutes?: number;
    reporter_id?: string;
  };

  try {
    // request.json() reads and parses the JSON body of the POST request
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { status, queue_minutes, reporter_id } = body;

  // Validate that status is one of our allowed values
  if (!status || !VALID_STATUSES.includes(status as ReportStatus)) {
    return Response.json(
      {
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // Validate queue_minutes if provided — must be a positive integer
  if (queue_minutes !== undefined) {
    if (!Number.isInteger(queue_minutes) || queue_minutes < 0) {
      return Response.json(
        { error: 'queue_minutes must be a non-negative integer' },
        { status: 400 }
      );
    }
  }

  // No Supabase credentials yet → accept the report against sample
  // data and echo it back, but nothing is saved.
  if (!isSupabaseConfigured) {
    if (!getSampleStations().some((s) => s.id === stationId)) {
      return Response.json({ error: `Station with id "${stationId}" not found` }, { status: 404 });
    }
    return Response.json(
      {
        id: `sample-report-${Date.now()}`,
        station_id: stationId,
        status,
        queue_minutes: queue_minutes ?? null,
        reporter_id: reporter_id ?? 'anonymous',
        reported_at: new Date().toISOString(),
        sample: true,
      },
      { status: 201, headers: { 'X-Data-Source': 'sample' } }
    );
  }

  const supabase = createServerSupabaseClient();

  // ── VERIFY THE STATION EXISTS ──────────────────────────────
  // Before inserting a report, confirm the station ID is real.
  // .single() tells Supabase to expect exactly one row —
  // it returns an error if 0 or 2+ rows match.
  const { data: station, error: stationError } = await supabase
    .from('stations')
    .select('id')
    .eq('id', stationId)   // .eq() = SQL WHERE id = stationId
    .single();

  if (stationError || !station) {
    return Response.json(
      { error: `Station with id "${stationId}" not found` },
      { status: 404 }
    );
  }

  // ── INSERT THE REPORT ──────────────────────────────────────
  // .insert() adds a new row. .select().single() returns the
  // newly created row so we can echo it back in the response.
  const { data: newReport, error: insertError } = await supabase
    .from('station_reports')
    .insert({
      station_id: stationId,
      status: status as ReportStatus,
      // Only include queue_minutes if the user provided it
      ...(queue_minutes !== undefined && { queue_minutes }),
      // Fall back to 'anonymous' if no reporter_id sent
      reporter_id: reporter_id ?? 'anonymous',
      // reported_at is auto-set by the DB DEFAULT NOW() — no need to pass it
    })
    .select()
    .single();

  if (insertError) {
    console.error('[POST /api/stations/[id]/report] Insert error:', insertError.message);
    return Response.json(
      { error: 'Failed to save report' },
      { status: 500 }
    );
  }

  // 201 Created — standard HTTP status for a successfully created resource
  return Response.json(newReport, { status: 201 });
}
