const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bayaaDesktop', {
  isDesktop: true,
  database: {
    getSync: (key) => ipcRenderer.sendSync('db:get-sync', key),
    setSync: (key, value) => ipcRenderer.sendSync('db:set-sync', key, value),
    deleteSync: (key) => ipcRenderer.sendSync('db:delete-sync', key),
    get: (key) => ipcRenderer.invoke('db:get', key),
    set: (key, value) => ipcRenderer.invoke('db:set', key, value),
    delete: (key) => ipcRenderer.invoke('db:delete', key),
    backup: () => ipcRenderer.invoke('db:backup'),
  },
  app: {
    print: () => ipcRenderer.invoke('app:print'),
    getPaths: () => ipcRenderer.invoke('app:get-paths'),
    openBackups: () => ipcRenderer.invoke('app:open-backups'),
    exportBackup: () => ipcRenderer.invoke('app:export-backup'),
    restoreBackup: () => ipcRenderer.invoke('app:restore-backup'),
  },
})
