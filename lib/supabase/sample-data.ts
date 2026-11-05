// =============================================================
// lib/supabase/sample-data.ts
// SAMPLE DATA — used only when Supabase isn't configured.
//
// When NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are not set, the API
// routes serve these stations (a subset of the seed data in
// supabase/migrations/003_*) so the app still builds and runs.
// Once the variables are set, real Supabase data takes over.
// =============================================================

import type { ReportStatus, StationType, StationWithLatestReport } from '@/types/station';

type Row = [string, StationType, string, string, string, number, number, ReportStatus | null, number | null];

const ROWS: Row[] = [
  ['NIPCO CNG Mother Station, Ibafo', 'cng', 'Lagos-Ibadan Expressway, Ibafo', 'Ibafo', 'Ogun', 3.4289, 6.7118, 'fast', 5],
  ['Bovas Petroleum, Ojodu Berger', 'fuel', 'Berger Bus Stop, Ojodu', 'Ikeja', 'Lagos', 3.3712, 6.6432, 'moderate', 25],
  ['NNPC Retail, Festac Town', 'fuel', '2nd Avenue, Festac Town', 'Amuwo-Odofin', 'Lagos', 3.2921, 6.4678, 'sold_out', null],
  ['Mobil (11Plc), Maryland', 'fuel', 'Ikorodu Road, Maryland Junction', 'Maryland', 'Lagos', 3.3689, 6.5721, 'available', null],
  ['NNPC Mega Station, Zone 1', 'fuel', 'Olusegun Obasanjo Way, Wuse Zone 1', 'Wuse', 'FCT', 7.4715, 9.0589, 'fast', 10],
  ['NIPCO CNG Station, Airport Road', 'cng', 'Airport Road, Lugbe', 'Lugbe', 'FCT', 7.3789, 8.9812, 'outage', null],
  ['Ardova Plc, Jabi', 'fuel', 'Obafemi Awolowo Way, Jabi District', 'Jabi', 'FCT', 7.4298, 9.0712, 'moderate', 40],
  ['NNPC Mega Station, Port Harcourt', 'fuel', 'Aba Road, Port Harcourt', 'Port Harcourt', 'Rivers', 7.0125, 4.8214, null, null],
  ['TotalEnergies, Trans-Amadi', 'fuel', 'Trans-Amadi Industrial Layout', 'Port Harcourt', 'Rivers', 7.0421, 4.8115, 'fast', 5],
  ['Rainoil, Choba / Uniport', 'fuel', 'East-West Road, Choba', 'Choba', 'Rivers', 6.9089, 4.8989, 'moderate', 25],
  ['Bovas Mega Station, Bodija', 'fuel', 'Secretariat Road, Bodija', 'Ibadan', 'Oyo', 3.9112, 7.4289, 'sold_out', null],
  ['TotalEnergies, Ring Road', 'fuel', 'MKO Abiola Way, Ring Road', 'Ibadan', 'Oyo', 3.8712, 7.3621, 'available', null],
  ['NNPC Retail, Iwo Road Interchange', 'fuel', 'Iwo Road, Expressway Junction', 'Ibadan', 'Oyo', 3.9512, 7.4089, 'fast', 10],
  ['NNPC Mega Station, Kano', 'fuel', 'Maiduguri Road, Tarauni', 'Kano', 'Kano', 8.5412, 11.9712, 'outage', null],
  ['TotalEnergies, Bompai', 'fuel', 'Bompai Road, Fagge', 'Kano', 'Kano', 8.5312, 12.0112, 'moderate', 40],
  ['Ardova Plc, State Road', 'fuel', 'State Road, Nassarawa', 'Kano', 'Kano', 8.5215, 11.9889, null, null],
  ['NNPC Mega Station, Benin City', 'fuel', 'Sapele Road, Benin City', 'Benin City', 'Edo', 5.6214, 6.3112, 'fast', 5],
  ['Rainoil, Asaba Express', 'fuel', 'Benin-Asaba Expressway, Asaba', 'Asaba', 'Delta', 6.6912, 6.2012, 'moderate', 25],
  ['NIPCO CNG Station, Warri', 'cng', 'Effurun-Sapele Road, Effurun', 'Warri', 'Delta', 5.7812, 5.5412, 'available', null],
];

export function getSampleStations(): StationWithLatestReport[] {
  const now = Date.now();
  return ROWS.map(([name, type, address, city, state, lng, lat, status, queue], i) => {
    const id = `sample-${i + 1}`;
    return {
      id,
      name,
      type,
      address,
      city,
      state,
      location: { type: 'Point', coordinates: [lng, lat] },
      created_at: new Date(now - 30 * 86_400_000).toISOString(),
      latest_report: status
        ? {
            id: `${id}-report`,
            station_id: id,
            status,
            queue_minutes: queue,
            reporter_id: 'sample',
            reported_at: new Date(now - (i + 1) * 7 * 60_000).toISOString(),
          }
        : null,
    };
  });
}

/** Great-circle distance in metres between two [lng, lat] points. */
export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
