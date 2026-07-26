/**
 * Tipe koneksi eksternal workspace.
 * Saat ini hanya WordPress; bisa ditambahkan Ghost, Webflow, dll.
 */
export const ConnectionType = {
  WORDPRESS: "wordpress",
} as const

export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType]

/** Label yang ditampilkan di UI untuk setiap tipe koneksi */
export const ConnectionTypeLabel: Record<ConnectionType, string> = {
  [ConnectionType.WORDPRESS]: "WordPress",
}

/** Status koneksi */
export const ConnectionStatus = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
} as const

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]
