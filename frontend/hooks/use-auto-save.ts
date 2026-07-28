"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error"

interface AutoSaveOptions {
  /** Interval auto-save dalam milidetik (default: 60000 = 60 detik) */
  interval?: number
  /** Fungsi yang dipanggil untuk menyimpan */
  onSave: () => Promise<void>
  /** Apakah form memiliki perubahan yang belum disimpan */
  isDirty: boolean
}

export function useAutoSave({ interval = 60000, onSave, isDirty }: AutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isDirtyRef = useRef(isDirty)
  const isSavingRef = useRef(false)

  // Sync ref dengan state terbaru
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  // Update status ke "unsaved" ketika ada perubahan
  useEffect(() => {
    if (isDirty && saveStatus !== "saving") {
      setSaveStatus("unsaved")
    }
  }, [isDirty, saveStatus])

  const triggerSave = useCallback(async () => {
    if (isSavingRef.current || !isDirtyRef.current) return

    isSavingRef.current = true
    setSaveStatus("saving")
    try {
      await onSave()
      setSaveStatus("saved")
      // Reset ke idle setelah 3 detik
      setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
      }, 3000)
    } catch {
      setSaveStatus("error")
      // Reset error setelah 5 detik
      setTimeout(() => {
        setSaveStatus((prev) => (prev === "error" ? "unsaved" : prev))
      }, 5000)
    } finally {
      isSavingRef.current = false
    }
  }, [onSave])

  // Auto-save interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (isDirtyRef.current) {
        triggerSave()
      }
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, triggerSave])

  return { saveStatus, triggerSave }
}
