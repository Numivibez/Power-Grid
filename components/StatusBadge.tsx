'use client'

// =============================================================
// components/StatusBadge.tsx
//
// A colored pill that shows the crowd-reported status of a station.
// Used in both StationCard (the sidebar list) and map popups.
//
// DESIGN DECISIONS:
//   - High-contrast colors that work in dark mode and bright sunlight
//     (important for in-car / mobile use)
//   - Touch target is the whole card, not just this badge,
//     so the badge itself doesn't need to be 48px tall
//   - We use Tailwind's ring utility for accessibility focus outlines
// =============================================================

import type { ReportStatus } from '@/types/station'

// Props: just the status string (and an optional extra CSS class)
interface StatusBadgeProps {
  status: ReportStatus | null
  className?: string
}

// ── DISPLAY CONFIG ────────────────────────────────────────────
// Maps each status value to its emoji, human label, and Tailwind classes.
// Keeping this as a plain object (not a switch statement) means we can
// easily add new statuses later without touching the JSX below.
const STATUS_CONFIG: Record<
  ReportStatus,
  { emoji: string; label: string; classes: string }
> = {
  // Fuel station statuses
  fast: {
    emoji: '🟢',
    label: 'Fast Queue',
    // Green: dark background + bright text for readability in sunlight
    classes: 'bg-green-900 text-green-200 border border-green-600',
  },
  moderate: {
    emoji: '🟡',
    label: 'Moderate Queue',
    classes: 'bg-yellow-900 text-yellow-200 border border-yellow-600',
  },
  sold_out: {
    emoji: '🔴',
    label: 'Sold Out',
    classes: 'bg-red-900 text-red-200 border border-red-600',
  },

  // Grid zone statuses
  available: {
    emoji: '🟢',
    label: 'Power Available',
    classes: 'bg-green-900 text-green-200 border border-green-600',
  },
  outage: {
    emoji: '🔴',
    label: 'Power Outage',
    classes: 'bg-red-900 text-red-200 border border-red-600',
  },
}

// ── COMPONENT ─────────────────────────────────────────────────
export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // If there's no report yet for this station, show a neutral "Unknown" badge
  if (!status) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
          bg-zinc-800 text-zinc-400 border border-zinc-600 ${className}`}
      >
        ⚪ No Reports Yet
      </span>
    )
  }

  const { emoji, label, classes } = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${classes} ${className}`}
    >
      {emoji} {label}
    </span>
  )
}
