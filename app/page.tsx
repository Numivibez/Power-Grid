'use client'

// =============================================================
// app/page.tsx
// FuelRadar & GridWatch Naija — Nationwide Station & Grid Monitor
//
// FEATURES:
//   - Filter by State (Lagos, Abuja, Rivers, Oyo, Kano, Ogun, etc.)
//   - Filter by Fuel Type (Petrol / CNG)
//   - Real-time search by station name, neighborhood, or city
//   - Map flies automatically when changing state
//   - Touch targets >= 48px for in-car and mobile usability
// =============================================================

import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Radio, AlertCircle, Search, Filter, Fuel, Zap } from 'lucide-react'
import StationCard from '@/components/StationCard'
import type { StationWithLatestReport, StationType } from '@/types/station'

// GPS centers for each state to animate the map when switching regions
const STATE_CENTERS: Record<string, [number, number]> = {
  Lagos: [6.5244, 3.3792],
  FCT: [9.0579, 7.4951],
  Rivers: [4.8156, 7.0498],
  Oyo: [7.3775, 3.9470],
  Kano: [12.0022, 8.5920],
  Ogun: [6.9075, 3.5813],
  Delta: [5.5442, 5.7603],
  Edo: [6.3350, 5.6037],
}

// Leaflet map loaded on the client side only
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-xl">
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Loading map…</span>
      </div>
    </div>
  ),
})

export default function HomePage() {
  const [stations, setStations] = useState<StationWithLatestReport[]>([])
  const [activeStationId, setActiveStationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSampleData, setIsSampleData] = useState(false)

  // ── FILTER STATES ──────────────────────────────────────────
  const [selectedState, setSelectedState] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<'all' | StationType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const cardListRef = useRef<HTMLDivElement>(null)

  // ── FETCH STATIONS ─────────────────────────────────────────
  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await fetch('/api/stations')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data: StationWithLatestReport[] = await res.json()
        setStations(data)
        setIsSampleData(res.headers.get('X-Data-Source') === 'sample')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stations')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStations()
  }, [])

  // ── FILTER LOGIC ───────────────────────────────────────────
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      // Filter by state
      if (selectedState !== 'all' && (station.state || station.city) !== selectedState) {
        return false
      }
      // Filter by type (fuel vs cng)
      if (selectedType !== 'all' && station.type !== selectedType) {
        return false
      }
      // Filter by search query (name, address, city, state)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchesName = station.name.toLowerCase().includes(query)
        const matchesAddress = station.address?.toLowerCase().includes(query) ?? false
        const matchesCity = station.city.toLowerCase().includes(query)
        const matchesState = (station.state || '').toLowerCase().includes(query)
        if (!matchesName && !matchesAddress && !matchesCity && !matchesState) {
          return false
        }
      }
      return true
    })
  }, [stations, selectedState, selectedType, searchQuery])

  // Get current map center coordinates based on state selection
  const mapCenterCoords = selectedState !== 'all' ? STATE_CENTERS[selectedState] : undefined

  // Auto-scroll to selected card
  useEffect(() => {
    if (!activeStationId || !cardListRef.current) return
    const activeCard = cardListRef.current.querySelector(
      `[data-station-id="${activeStationId}"]`
    )
    activeCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeStationId])

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">

      {/* ── HEADER ── */}
      <header className="flex flex-wrap items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛽</span>
          <div>
            <h1 className="text-base font-bold text-zinc-100 leading-tight">
              FuelRadar & GridWatch Naija
            </h1>
            <p className="text-xs text-zinc-400">
              Crowdsourced Petrol, CNG & Grid Tracker
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="font-medium text-zinc-300">Live Network</span>
        </div>
      </header>

      {/* ── MAIN CONTENT (Sidebar + Map) ── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* ── SIDEBAR CONTROLS & FEED ── */}
        <aside className="w-full md:w-96 flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900/90">

          {/* ── FILTER CONTROLS ── */}
          <div className="p-3 border-b border-zinc-800 flex flex-col gap-2.5 bg-zinc-900">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search station, area, city..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 min-h-[44px]"
              />
            </div>

            {/* State Selector */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-zinc-400 flex-shrink-0" />
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setActiveStationId(null)
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer min-h-[44px]"
              >
                <option value="all">🇳🇬 All States (Nationwide)</option>
                <option value="Lagos">Lagos State</option>
                <option value="FCT">Abuja (FCT)</option>
                <option value="Rivers">Rivers (Port Harcourt)</option>
                <option value="Oyo">Oyo (Ibadan)</option>
                <option value="Kano">Kano State</option>
                <option value="Ogun">Ogun State</option>
                <option value="Delta">Delta State</option>
                <option value="Edo">Edo State</option>
              </select>
            </div>

            {/* Type Filter Buttons (Fuel vs CNG) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-lg">
              <button
                onClick={() => setSelectedType('all')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[38px] ${
                  selectedType === 'all'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('fuel')}
                className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[38px] ${
                  selectedType === 'fuel'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Fuel size={13} /> Fuel
              </button>
              <button
                onClick={() => setSelectedType('cng')}
                className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[38px] ${
                  selectedType === 'cng'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap size={13} /> CNG
              </button>
            </div>

            {/* Result count badge */}
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Showing {filteredStations.length} stations</span>
              {selectedState !== 'all' && (
                <span className="text-blue-400 font-medium">📍 {selectedState}</span>
              )}
            </div>
          </div>

          {/* ── SCROLLABLE STATION LIST ── */}
          <div
            ref={cardListRef}
            className="flex-1 overflow-y-auto p-2 flex flex-col gap-2"
          >
            {isLoading && (
              <div className="flex flex-col gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-zinc-800 animate-pulse" />
                ))}
              </div>
            )}

            {isSampleData && !error && (
              <div className="flex items-start gap-2 p-3 mt-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Showing sample data</p>
                  <p className="text-amber-400 mt-0.5">Supabase isn&apos;t connected yet, so these stations and reports are examples.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 mt-2 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Could not load stations</p>
                  <p className="text-red-400 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && filteredStations.map((station) => (
              <div key={station.id} data-station-id={station.id}>
                <StationCard
                  station={station}
                  isActive={activeStationId === station.id}
                  onClick={() => setActiveStationId(station.id)}
                />
              </div>
            ))}

            {!isLoading && !error && filteredStations.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-zinc-500">
                <Radio size={28} />
                <p className="text-xs text-center font-medium">
                  No stations match your filters.<br />
                  Try selecting "All States" or clearing search.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ── MAP PANEL ── */}
        <main className="flex-1 p-2 h-72 md:h-full">
          <Map
            stations={filteredStations}
            activeStationId={activeStationId}
            onSelectStation={setActiveStationId}
            centerCoords={mapCenterCoords}
          />
        </main>
      </div>
    </div>
  )
}
