'use client'

// =============================================================
// components/StationCard.tsx
//
// A clickable card representing one fuel/CNG station.
// Displayed in the scrollable sidebar list next to the map.
//
// PROPS:
//   station   — the full station object + latest_report
//   isActive  — true when this station's map marker is selected
//   onClick   — callback fired when user taps/clicks the card
//
// REACT CONCEPT — Props:
//   Props are like function arguments for components. The parent
//   (page.tsx) holds the data and passes it down. This card
//   doesn't fetch anything — it only renders what it receives.
//   This "one-way data flow" keeps components simple and testable.
// =============================================================

import { Fuel, Zap, Clock, MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'
import type { StationWithLatestReport } from '@/types/station'

interface StationCardProps {
  station: StationWithLatestReport
  isActive: boolean          // Highlighted when map marker is selected
  onClick: () => void        // Scroll map to this station
  onReportClick?: (station: StationWithLatestReport) => void // Open status report dialog
}

export default function StationCard({ station, isActive, onClick, onReportClick }: StationCardProps) {
  const { name, type, city, state, address, latest_report } = station

  return (
    // The outer div is the clickable card.
    // We use `role="button"` and `tabIndex` for keyboard accessibility.
    // Min touch target height is controlled by `min-h-[72px]`.
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`
        relative flex flex-col gap-2 rounded-xl p-4 cursor-pointer
        border transition-all duration-150 min-h-[72px]
        ${isActive
          // Active card: bright left border + subtle glow
          ? 'border-blue-500 bg-zinc-800 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]'
          // Default card
          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800'
        }
      `}
    >
      {/* ── TOP ROW: Station type icon + name ── */}
      <div className="flex items-start gap-3">
        {/* Icon differs by station type */}
        <div className={`
          flex-shrink-0 flex items-center justify-center
          w-10 h-10 rounded-lg
          ${type === 'fuel' ? 'bg-orange-900 text-orange-300' : 'bg-sky-900 text-sky-300'}
        `}>
          {/* Fuel pump icon for fuel stations, lightning bolt for CNG */}
          {type === 'fuel'
            ? <Fuel size={18} />
            : <Zap size={18} />
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Station name — truncate long names with ellipsis */}
          <h3 className="font-semibold text-sm text-zinc-100 leading-tight truncate">
            {name}
          </h3>

          {/* City, State + address */}
          <p className="flex items-center gap-1 mt-0.5 text-xs text-zinc-400 truncate">
            <MapPin size={11} className="flex-shrink-0" />
            {address ? `${address} (${state || city})` : `${city}, ${state}`}
          </p>
        </div>
      </div>

      {/* ── BOTTOM ROW: Status badge + queue time + Update action ── */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 mt-0.5">
        <div className="flex items-center gap-2">
          <StatusBadge status={latest_report?.status ?? null} />
          {latest_report?.queue_minutes != null && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock size={11} />
              ~{latest_report.queue_minutes}m
            </span>
          )}
        </div>

        {onReportClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onReportClick(station)
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-blue-600 hover:text-white text-blue-400 border border-zinc-700 transition-colors"
          >
            Update
          </button>
        )}
      </div>

      {/* ── LAST REPORT TIME ── */}
      {latest_report?.reported_at && (
        <p className="text-[10px] text-zinc-600">
          {/* Format the ISO timestamp into a human-readable relative time */}
          Reported {formatRelativeTime(latest_report.reported_at)}
        </p>
      )}
    </div>
  )
}

// ── HELPER: Relative time formatter ───────────────────────────
// Converts an ISO date string like "2026-11-05T18:00:00Z"
// into "2 hours ago" or "just now".
// We write our own tiny version to avoid adding a date library.
function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
