const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const Database = require('better-sqlite3')

let mainWindow
let database

function getDatabasePath() {
  return path.join(app.getPath('userData'), 'bayaa-pos.sqlite')
}

function getBackupDirectory() {
  return path.join(app.getPath('userData'), 'backups')
}

function openDatabase() {
  database = new Database(getDatabasePath())
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')
  database.exec(`
    CREATE TABLE IF NOT EXISTS app_data (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `)
}

function createBackup() {
  if (!database) return null
  const backupDirectory = getBackupDirectory()
  fs.mkdirSync(backupDirectory, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const destination = path.join(backupDirectory, `bayaa-pos-${stamp}.sqlite`)
  database.backup(destination)
  return destination
}

function registerDatabaseHandlers() {
  ipcMain.on('db:get-sync', (event, key) => {
    const row = database.prepare('SELECT value FROM app_data WHERE key = ?').get(key)
    event.returnValue = row ? JSON.parse(row.value) : null
  })

  ipcMain.on('db:set-sync', (event, key, value) => {
    const now = new Date().toISOString()
    database.prepare(`
      INSERT INTO app_data (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, JSON.stringify(value), now)
    event.returnValue = true
  })

  ipcMain.on('db:delete-sync', (event, key) => {
    database.prepare('DELETE FROM app_data WHERE key = ?').run(key)
    event.returnValue = true
  })

  ipcMain.handle('db:get', (_event, key) => {
    const row = database.prepare('SELECT value FROM app_data WHERE key = ?').get(key)
    return row ? JSON.parse(row.value) : null
  })

  ipcMain.handle('db:set', (_event, key, value) => {
    const now = new Date().toISOString()
    const serialized = JSON.stringify(value)
    database.prepare(`
      INSERT INTO app_data (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, serialized, now)
    return true
  })

  ipcMain.handle('db:delete', (_event, key) => {
    database.prepare('DELETE FROM app_data WHERE key = ?').run(key)
    return true
  })

  ipcMain.handle('db:backup', () => createBackup())
  ipcMain.handle('app:get-paths', () => ({ database: getDatabasePath(), backups: getBackupDirectory() }))
  ipcMain.handle('app:open-backups', () => shell.openPath(getBackupDirectory()))
  ipcMain.handle('app:export-backup', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ نسخة احتياطية',
      defaultPath: path.join(app.getPath('documents'), `bayaa-pos-backup-${new Date().toISOString().slice(0, 10)}.sqlite`),
      filters: [{ name: 'SQLite database', extensions: ['sqlite'] }],
    })
    if (result.canceled || !result.filePath) return null
    await database.backup(result.filePath)
    return result.filePath
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f1f5f9',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  openDatabase()
  registerDatabaseHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  if (database) database.close()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

setInterval(() => {
  try { createBackup() } catch (error) { console.error('Automatic backup failed:', error) }
}, 24 * 60 * 60 * 1000)
