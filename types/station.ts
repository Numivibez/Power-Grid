// =============================================================
// types/station.ts
// Shared TypeScript types for FuelRadar & GridWatch Naija.
// =============================================================

export type StationType = 'fuel' | 'cng';
export type ReportStatus = 'fast' | 'moderate' | 'sold_out' | 'available' | 'outage';

export interface Station {
  id: string;
  name: string;
  type: StationType;
  address: string | null;
  city: string;
  state: string;            // 'Lagos' | 'FCT' | 'Rivers' | 'Oyo' | 'Kano' | 'Ogun' | 'Delta' | 'Edo'
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  created_at: string;
}

export interface StationReport {
  id: string;
  station_id: string;
  status: ReportStatus;
  queue_minutes: number | null;
  reporter_id: string | null;
  reported_at: string;
}

export interface StationWithLatestReport extends Station {
  latest_report: StationReport | null;
}
