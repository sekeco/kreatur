import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Safely extract an error message from Eden Treaty or Better Auth errors.
 * Eden Treaty errors are a union of { status: number; value: string | object }
 * while Better Auth errors have { message?: string }.
 */
/**
 * Standardized API error handler.
 * Returns true if successful, false if error occurred.
 * Optionally shows a toast notification.
 */
export async function handleApiError<T>(
  promise: Promise<{ data?: { success?: boolean }; error?: unknown }>,
  options?: { showToast?: boolean; successMessage?: string; errorMessage?: string }
): Promise<{ success: boolean; data?: T }> {
  try {
    const res = await promise
    if (res.error) {
      if (options?.showToast !== false) {
        const { toast } = await import("sonner")
        toast.error(options?.errorMessage ?? getErrorMessage(res.error) ?? "Terjadi kesalahan")
      }
      return { success: false }
    }
    if (options?.successMessage) {
      const { toast } = await import("sonner")
      toast.success(options.successMessage)
    }
    return { success: true, data: res.data as unknown as T | undefined }
  } catch (e) {
    if (options?.showToast !== false) {
      const { toast } = await import("sonner")
      toast.error(options?.errorMessage ?? getErrorMessage(e) ?? "Terjadi kesalahan")
    }
    return { success: false }
  }
}

export function getErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  // Better Auth style
  if (typeof error === "object" && "message" in error) {
    return (error as { message?: string }).message
  }
  // Eden Treaty style: { status, value }
  if (typeof error === "object" && "value" in error) {
    const val = (error as { value: unknown }).value
    if (typeof val === "string") return val
    if (typeof val === "object" && val && "message" in val) {
      return (val as { message?: string }).message ?? undefined
    }
  }
  return undefined
}
