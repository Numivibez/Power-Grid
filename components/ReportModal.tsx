'use client'

// =============================================================
// components/ReportModal.tsx
// Crowdsourced Report Dialog for Fuel & CNG Stations
//
// DESIGN & USABILITY FOR IN-CAR SCREENS:
//   - Touch targets >= 48px for easy tapping on dashboard displays
//   - High-contrast color buttons that remain legible in bright sunlight
//   - Quick 1-tap queue minute presets (5, 15, 30, 45, 60 mins)
//   - Anonymous device reporting (no account/login friction)
// =============================================================

import { useState } from 'react'
import { X, Clock, AlertTriangle, CheckCircle2, Send, Fuel, Zap } from 'lucide-react'
import type { StationWithLatestReport, ReportStatus } from '@/types/station'

interface ReportModalProps {
  station: StationWithLatestReport | null
  isOpen: boolean
  onClose: () => void
  onReportSubmitted: (stationId: string, newReport: {
    status: ReportStatus
    queue_minutes: number | null
    reported_at: string
  }) => void
}

export default function ReportModal({
  station,
  isOpen,
  onClose,
  onReportSubmitted,
}: ReportModalProps) {
  // If modal is closed or no station selected, don't render anything
  if (!isOpen || !station) return null

  // ── FORM STATE ─────────────────────────────────────────────
  // Default status selection to 'moderate' or existing status
  const [status, setStatus] = useState<ReportStatus>(
    station.latest_report?.status ?? 'moderate'
  )
  const [queueMinutes, setQueueMinutes] = useState<number | null>(
    station.latest_report?.queue_minutes ?? 15
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Preset queue minutes for 1-tap selection on car screens
  const QUEUE_PRESETS = [5, 15, 30, 45, 60]

  // ── SUBMIT HANDLER ─────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Create or read a persistent anonymous device ID from localStorage
      let deviceId = 'anonymous-web'
      if (typeof window !== 'undefined') {
        deviceId = localStorage.getItem('fuelradar_device_id') || ''
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 10)
          localStorage.setItem('fuelradar_device_id', deviceId)
        }
      }

      // Call our Next.js POST /api/stations/[id]/report endpoint
      const response = await fetch(`/api/stations/${station!.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          queue_minutes: status === 'sold_out' ? null : queueMinutes,
          reporter_id: deviceId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit report')
      }

      const savedReport = await response.json()

      // Notify parent page so the card and map badge update immediately (optimistic update)
      onReportSubmitted(station!.id, {
        status,
        queue_minutes: status === 'sold_out' ? null : queueMinutes,
        reported_at: savedReport.reported_at || new Date().toISOString(),
      })

      onClose()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error submitting report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    // Backdrop blur with high contrast dark overlay
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${station.type === 'fuel' ? 'bg-orange-950 text-orange-400' : 'bg-sky-950 text-sky-400'}`}>
              {station.type === 'fuel' ? <Fuel size={20} /> : <Zap size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 leading-tight">
                Update Station Status
              </h2>
              <p className="text-xs text-zinc-400 truncate max-w-[240px]">
                {station.name}
              </p>
            </div>
          </div>

          {/* Close button with >= 48px touch target */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-12 h-12 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Status Selection (Large touch-target buttons) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Queue Condition
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Fast Status Button */}
              <button
                type="button"
                onClick={() => setStatus('fast')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[58px] ${
                  status === 'fast'
                    ? 'bg-green-950 border-green-500 text-green-200 ring-2 ring-green-500/50'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                }`}
              >
                <span className="text-xl">🟢</span>
                <span className="text-xs font-bold mt-1">Fast</span>
                <span className="text-[10px] text-zinc-400">&lt; 10 mins</span>
              </button>

              {/* Moderate Status Button */}
              <button
                type="button"
                onClick={() => setStatus('moderate')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[58px] ${
                  status === 'moderate'
                    ? 'bg-yellow-950 border-yellow-500 text-yellow-200 ring-2 ring-yellow-500/50'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                }`}
              >
                <span className="text-xl">🟡</span>
                <span className="text-xs font-bold mt-1">Moderate</span>
                <span className="text-[10px] text-zinc-400">10-30 mins</span>
              </button>

              {/* Sold Out / No Fuel Button */}
              <button
                type="button"
                onClick={() => setStatus('sold_out')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[58px] ${
                  status === 'sold_out'
                    ? 'bg-red-950 border-red-500 text-red-200 ring-2 ring-red-500/50'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                }`}
              >
                <span className="text-xl">🔴</span>
                <span className="text-xs font-bold mt-1">Sold Out</span>
                <span className="text-[10px] text-zinc-400">No fuel</span>
              </button>
            </div>
          </div>

          {/* 2. Estimated Wait Time (Hidden if sold out) */}
          {status !== 'sold_out' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={13} className="text-blue-400" />
                  Estimated Wait Time
                </label>
                <span className="text-xs font-bold text-blue-400">
                  {queueMinutes ? `~${queueMinutes} mins` : 'Unknown'}
                </span>
              </div>

              {/* Quick Presets (min-h-[48px] for in-car touch) */}
              <div className="grid grid-cols-5 gap-1.5">
                {QUEUE_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setQueueMinutes(minutes)}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all min-h-[48px] ${
                      queueMinutes === minutes
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Submit Button (Big 48px touch target) */}
          <div className="mt-2 pt-2 border-t border-zinc-800 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all min-h-[48px]"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send size={15} />
                  Submit Live Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
