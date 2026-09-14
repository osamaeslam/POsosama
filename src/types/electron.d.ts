export type BayaaDesktop = {
  isDesktop: boolean
  database: {
    getSync: <T = unknown>(key: string) => T | null
    setSync: (key: string, value: unknown) => boolean
    deleteSync: (key: string) => boolean
    get: <T = unknown>(key: string) => Promise<T | null>
    set: (key: string, value: unknown) => Promise<boolean>
    delete: (key: string) => Promise<boolean>
    backup: () => Promise<string | null>
  }
  app: {
    print: () => Promise<boolean>
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
