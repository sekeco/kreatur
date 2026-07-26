export function ok<T>(data: T) { return { success: true as const, data } }
export function okPaginated<T>(data: T[], total: number, page: number, pageSize: number) {
  return { success: true as const, data, total, page, pageSize }
}
export function fail(error: string) { return { success: false as const, error } }
