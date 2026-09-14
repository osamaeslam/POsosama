const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const Database = require('better-sqlite3')

let mainWindow
let database
let backupTimer

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
}

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

const MAX_BACKUPS = 90
const MAX_BACKUP_AGE_DAYS = 365

function pruneBackups() {
  const backupDirectory = getBackupDirectory()
  if (!fs.existsSync(backupDirectory)) return
  const cutoff = Date.now() - MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000
  const backups = fs.readdirSync(backupDirectory)
    .filter((file) => /^bayaa-pos-.*\.sqlite$/.test(file))
    .map((file) => {
      const fullPath = path.join(backupDirectory, file)
      return { file, fullPath, stat: fs.statSync(fullPath) }
    })
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)

  backups.slice(MAX_BACKUPS).forEach(({ fullPath }) => {
    try { fs.unlinkSync(fullPath) } catch (error) { console.error('Backup cleanup failed:', error) }
  })
  backups.slice(0, MAX_BACKUPS).forEach(({ fullPath, stat }) => {
    if (stat.mtimeMs < cutoff) {
      try { fs.unlinkSync(fullPath) } catch (error) { console.error('Expired backup cleanup failed:', error) }
    }
  })
}

function createBackup() {
  if (!database || database.open === false) return null
  const backupDirectory = getBackupDirectory()
  fs.mkdirSync(backupDirectory, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const destination = path.join(backupDirectory, `bayaa-pos-${stamp}.sqlite`)
  database.pragma('wal_checkpoint(PASSIVE)')
  database.backup(destination)
  pruneBackups()
  return destination
}

function validateSqliteFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false
  try {
    const candidate = new Database(filePath, { readonly: true, fileMustExist: true })
    const row = candidate.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_data'").get()
    candidate.close()
    return Boolean(row)
  } catch (error) {
    console.error('SQLite validation failed:', error)
    return false
  }
}

async function restoreDatabase() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'استعادة قاعدة بيانات SQLite',
    properties: ['openFile'],
    filters: [{ name: 'SQLite database', extensions: ['sqlite', 'db'] }],
  })
  if (result.canceled || !result.filePaths[0]) return null
  const source = result.filePaths[0]
  if (!validateSqliteFile(source)) throw new Error('ملف قاعدة البيانات غير صالح')
  const databasePath = getDatabasePath()
  const restorePath = `${databasePath}.restore-${Date.now()}`
  fs.copyFileSync(source, restorePath)
  if (database) database.close()
  fs.copyFileSync(restorePath, databasePath)
  fs.unlinkSync(restorePath)
  app.relaunch()
  app.exit(0)
  return true
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
  ipcMain.handle('app:restore-backup', () => restoreDatabase())
  ipcMain.handle('app:print', async () => {
    if (!mainWindow) return false
    return new Promise((resolve) => {
      mainWindow.webContents.print({ silent: false, printBackground: true, margins: { marginType: 'none' } }, (success) => resolve(success))
    })
  })
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
    show: false,
    backgroundColor: '#f1f5f9',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('unresponsive', () => console.error('Electron renderer became unresponsive'))

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  fs.mkdirSync(getBackupDirectory(), { recursive: true })
  openDatabase()
  registerDatabaseHandlers()
  createWindow()
  try { createBackup() } catch (error) { console.error('Startup backup failed:', error) }
  backupTimer = setInterval(() => {
    try { createBackup() } catch (error) { console.error('Automatic backup failed:', error) }
  }, 24 * 60 * 60 * 1000)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  if (backupTimer) clearInterval(backupTimer)
  try { createBackup() } catch (error) { console.error('Shutdown backup failed:', error) }
  if (database) database.close()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

