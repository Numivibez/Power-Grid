'use client'

// =============================================================
// components/Map.tsx
// Interactive Leaflet map — MUST be a Client Component.
//
// WHY 'use client'?
//   Leaflet accesses `window`, `document`, and the DOM directly.
//   These don't exist on the server. The 'use client' directive
//   tells Next.js: "only run this file in the browser".
//   The parent (page.tsx) wraps this in dynamic(..., {ssr:false})
//   as an extra safety net.
//
// REACT HOOKS USED:
//   useEffect  — runs side-effects AFTER the component mounts in
//                the browser (safe place to init Leaflet)
//   useRef     — stores a reference to the Leaflet map instance
//                without triggering re-renders when it changes
//   useState   — not used here directly; active station is lifted
//                up to the parent via the onSelectStation callback
// =============================================================

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StationWithLatestReport, ReportStatus } from '@/types/station'

// ── FIX LEAFLET'S BROKEN DEFAULT MARKER ICONS ────────────────
// Leaflet's default icons reference image files using a path that
// breaks when bundled by webpack/Next.js. We override them with
// CDN URLs so markers always render correctly.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── MARKER COLOR MAP ─────────────────────────────────────────
// Maps each status to a hex color for our custom circle markers.
// We use CircleMarker (SVG circles) instead of the default pin icons
// — they look cleaner, scale well on mobile, and are easier to style.
const STATUS_COLORS: Record<ReportStatus | 'unknown', string> = {
  fast: '#22c55e',       // Tailwind green-500
  moderate: '#eab308',   // Tailwind yellow-500
  sold_out: '#ef4444',   // Tailwind red-500
  available: '#22c55e',  // Same green for grid "available"
  outage: '#ef4444',     // Same red for grid "outage"
  unknown: '#71717a',    // Tailwind zinc-500 — no reports yet
}

interface MapProps {
  stations: StationWithLatestReport[]
  activeStationId: string | null
  onSelectStation: (id: string) => void
  centerCoords?: [number, number]
}

export default function Map({ stations, activeStationId, onSelectStation, centerCoords }: MapProps) {
  // useRef holds the Leaflet map instance across renders.
  // Unlike useState, changing a ref does NOT cause a re-render —
  // which is exactly what we want for the map object.
  const mapRef = useRef<ReturnType<typeof L.map> | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Store circle markers in a ref so we can update their style
  // when the active station changes without re-creating the map.
  const markersRef = useRef<globalThis.Map<string, L.CircleMarker>>(new globalThis.Map())

  // ── EFFECT 1: Initialize the Leaflet map ─────────────────
  // useEffect(callback, []) — the empty array [] means:
  // "run this callback ONCE, after the component first mounts".
  // This is the correct place to initialize Leaflet because by
  // this point, the browser DOM is ready and mapContainerRef.current
  // points to a real <div> element.
  useEffect(() => {
    // Guard: if the container div isn't ready, or map already exists, skip
    if (!mapContainerRef.current || mapRef.current) return

    // Create the Leaflet map, centered on Lagos (default view)
    const map = L.map(mapContainerRef.current, {
      center: [6.5244, 3.3792], // Lagos coordinates [lat, lng]
      zoom: 12,
      // Disable zoom animation on mobile to prevent stuttering
      zoomAnimation: true,
    })

    // Add OpenStreetMap tile layer (free, no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Store the map instance in our ref for use in other effects
    mapRef.current = map

    // Cleanup: destroy the Leaflet map when the component unmounts.
    // Without this, navigating away and back would try to create a
    // second map on the same div — causing a Leaflet error.
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // ← Empty dependency array = run once on mount

  // ── EFFECT 2: Add/update markers when stations data changes ──
  // This effect re-runs whenever the `stations` array or the
  // `onSelectStation` callback changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove all existing markers before re-drawing
    // (in a production app you'd do a diff, but for our data size this is fine)
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    stations.forEach((station) => {
      // Guard against missing location data
      if (!station.location?.coordinates) return

      // PostGIS returns [longitude, latitude] in GeoJSON format.
      // Leaflet wants [latitude, longitude]. We MUST swap them!
      const [lng, lat] = station.location.coordinates

      // Determine marker color based on the latest report status
      const status = station.latest_report?.status ?? 'unknown'
      const color = STATUS_COLORS[status as ReportStatus | 'unknown']

      // Create a CircleMarker — an SVG circle, cleaner than the default pin
      const marker = L.circleMarker([lat, lng], {
        radius: 10,            // Size in pixels
        fillColor: color,
        color: '#1c1917',      // Dark border (zinc-900) so circles pop
        weight: 2,             // Border thickness
        opacity: 1,
        fillOpacity: 0.9,
      })

      // Build a popup with station info shown on marker click
      const popupContent = `
        <div style="font-family:sans-serif; min-width:160px">
          <strong style="font-size:13px">${station.name}</strong><br/>
          <span style="color:#a1a1aa; font-size:11px">${station.city} · ${station.type.toUpperCase()}</span><br/>
          <span style="margin-top:4px;display:block;font-size:12px">
            Status: <strong>${station.latest_report?.status ?? 'Unknown'}</strong>
          </span>
          ${station.latest_report?.queue_minutes != null
            ? `<span style="font-size:11px;color:#a1a1aa">~${station.latest_report.queue_minutes} min wait</span>`
            : ''
          }
        </div>
      `
      marker.bindPopup(popupContent)

      // When a marker is clicked, tell the parent which station is active.
      // The parent will highlight the matching card in the sidebar.
      marker.on('click', () => {
        onSelectStation(station.id)
      })

      marker.addTo(map)
      // Store the marker reference by station ID for later styling updates
      markersRef.current.set(station.id, marker)
    })
  }, [stations, onSelectStation])

  // ── EFFECT 3: Fly map to the active station ───────────────
  // Runs when activeStationId changes (user clicked a sidebar card).
  // We animate the map to center on the selected station.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeStationId) return

    const station = stations.find((s) => s.id === activeStationId)
    if (!station || !station.location?.coordinates) return

    const [lng, lat] = station.location.coordinates

    // flyTo() smoothly animates the map to the new center
    map.flyTo([lat, lng], 15, { duration: 0.8 })

    // Open the popup on the marker so the user sees the status info
    const marker = markersRef.current.get(activeStationId)
    if (marker) {
      marker.openPopup()
    }
  }, [activeStationId, stations])

  // ── EFFECT 4: Fly to state center when state filter changes ──
  useEffect(() => {
    const map = mapRef.current
    if (!map || !centerCoords) return

    map.flyTo(centerCoords, 11, { duration: 1.2 })
  }, [centerCoords])

  // The map renders into this div. Leaflet takes control of the
  // DOM inside it after mount — we never touch it directly in JSX.
  return (
    <div
      ref={mapContainerRef}
      // height: 100% fills whatever container the parent provides
      className="w-full h-full rounded-xl overflow-hidden"
    />
  )
}
