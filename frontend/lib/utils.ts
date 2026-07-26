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
