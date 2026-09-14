export type BayaaDesktop = {
  isDesktop: boolean
  database: {
    get: <T = unknown>(key: string) => Promise<T | null>
    set: (key: string, value: unknown) => Promise<boolean>
    delete: (key: string) => Promise<boolean>
    backup: () => Promise<string | null>
  }
  app: {
    getPaths: () => Promise<{ database: string; backups: string }>
    openBackups: () => Promise<void>
    exportBackup: () => Promise<string | null>
  }
}

declare global {
  interface Window {
    bayaaDesktop?: BayaaDesktop
  }
}

export {}
