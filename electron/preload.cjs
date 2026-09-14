const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bayaaDesktop', {
  isDesktop: true,
  database: {
    get: (key) => ipcRenderer.invoke('db:get', key),
    set: (key, value) => ipcRenderer.invoke('db:set', key, value),
    delete: (key) => ipcRenderer.invoke('db:delete', key),
    backup: () => ipcRenderer.invoke('db:backup'),
  },
  app: {
    getPaths: () => ipcRenderer.invoke('app:get-paths'),
    openBackups: () => ipcRenderer.invoke('app:open-backups'),
    exportBackup: () => ipcRenderer.invoke('app:export-backup'),
  },
})
