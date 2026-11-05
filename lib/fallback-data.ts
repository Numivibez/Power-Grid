// =============================================================
// lib/fallback-data.ts
// Fallback stations used if database credentials are not present in CI/build
// =============================================================

import type { StationWithLatestReport } from '@/types/station'

export const FALLBACK_STATIONS: StationWithLatestReport[] = [
  {
    id: 'fallback-1',
    name: 'NNPC Mega Station Lekki',
    type: 'fuel',
    address: 'Lekki-Epe Expressway, Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    location: { type: 'Point', coordinates: [3.5852, 6.4350] },
    created_at: new Date().toISOString(),
    latest_report: {
      id: 'rep-1',
      station_id: 'fallback-1',
      status: 'moderate',
      queue_minutes: 20,
      reporter_id: 'demo',
      reported_at: new Date().toISOString(),
    },
  },
  {
    id: 'fallback-2',
    name: 'TotalEnergies, Victoria Island',
    type: 'fuel',
    address: '24 Ozumba Mbadiwe Ave, Victoria Island',
    city: 'Lagos',
    state: 'Lagos',
    location: { type: 'Point', coordinates: [3.4219, 6.4281] },
    created_at: new Date().toISOString(),
    latest_report: {
      id: 'rep-2',
      station_id: 'fallback-2',
      status: 'fast',
      queue_minutes: 5,
      reporter_id: 'demo',
      reported_at: new Date().toISOString(),
    },
  },
  {
    id: 'fallback-3',
    name: 'CNG Lagos Island Hub',
    type: 'cng',
    address: 'Marina Road, Lagos Island',
    city: 'Lagos',
    state: 'Lagos',
    location: { type: 'Point', coordinates: [3.3958, 6.4541] },
    created_at: new Date().toISOString(),
    latest_report: {
      id: 'rep-3',
      station_id: 'fallback-3',
      status: 'available',
      queue_minutes: null,
      reporter_id: 'demo',
      reported_at: new Date().toISOString(),
    },
  },
  {
    id: 'fallback-4',
    name: 'NNPC Mega Station, Wuse Zone 1',
    type: 'fuel',
    address: 'Olusegun Obasanjo Way, Wuse',
    city: 'Abuja',
    state: 'FCT',
    location: { type: 'Point', coordinates: [7.4715, 9.0589] },
    created_at: new Date().toISOString(),
    latest_report: {
      id: 'rep-4',
      station_id: 'fallback-4',
      status: 'moderate',
      queue_minutes: 25,
      reporter_id: 'demo',
      reported_at: new Date().toISOString(),
    },
  },
  {
    id: 'fallback-5',
    name: 'NIPCO CNG Station, Airport Road',
    type: 'cng',
    address: 'Airport Road, Lugbe',
    city: 'Abuja',
    state: 'FCT',
    location: { type: 'Point', coordinates: [7.3789, 8.9812] },
    created_at: new Date().toISOString(),
    latest_report: {
      id: 'rep-5',
      station_id: 'fallback-5',
      status: 'fast',
      queue_minutes: 10,
      reporter_id: 'demo',
      reported_at: new Date().toISOString(),
    },
  },
]
