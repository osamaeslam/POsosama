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

const NORMALIZED_KEYS = {
  products: 'bayaa_pos_products',
  categories: 'bayaa_pos_categories',
  sales: 'bayaa_pos_sales',
  customers: 'bayaa_pos_customers',
  expenses: 'bayaa_pos_expenses',
  shifts: 'bayaa_pos_shifts',
  debtPayments: 'bayaa_pos_debt_payments',
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
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, barcode TEXT, name TEXT NOT NULL, category_id TEXT,
      price REAL NOT NULL DEFAULT 0, wholesale_price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sales_records (id TEXT PRIMARY KEY, invoice_number TEXT, created_at TEXT NOT NULL, customer_id TEXT, total REAL NOT NULL DEFAULT 0, payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_records(customer_id);
    CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id TEXT NOT NULL, product_id TEXT, quantity REAL NOT NULL, price REAL NOT NULL, subtotal REAL NOT NULL, payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, total_debt REAL NOT NULL DEFAULT 0, payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, amount REAL NOT NULL, shift_id TEXT, payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
    CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, opened_at TEXT NOT NULL, closed_at TEXT, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS debt_payments (id TEXT PRIMARY KEY, customer_id TEXT, created_at TEXT NOT NULL, amount REAL NOT NULL, payload TEXT NOT NULL);
  `)
  migrateNormalizedTables()
}

function asNumber(value) { return Number.isFinite(Number(value)) ? Number(value) : 0 }
function asArray(value) { return Array.isArray(value) ? value : [] }

function syncNormalizedData(key, value) {
  if (!database || !Object.values(NORMALIZED_KEYS).includes(key)) return
  const rows = asArray(value)
  const tx = database.transaction(() => {
    if (key === NORMALIZED_KEYS.products) {
      database.prepare('DELETE FROM products').run()
      const insert = database.prepare('INSERT INTO products (id, barcode, name, category_id, price, wholesale_price, stock, is_active, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      rows.forEach((row) => insert.run(row.id, row.barcode || null, row.name || '', row.categoryId || null, asNumber(row.price), asNumber(row.wholesalePrice), asNumber(row.stock), row.isActive === false ? 0 : 1, JSON.stringify(row)))
    } else if (key === NORMALIZED_KEYS.categories) {
      database.prepare('DELETE FROM categories').run()
      const insert = database.prepare('INSERT INTO categories (id, name, payload) VALUES (?, ?, ?)')
      rows.forEach((row) => insert.run(row.id, row.name || '', JSON.stringify(row)))
    } else if (key === NORMALIZED_KEYS.sales) {
      database.prepare('DELETE FROM sale_items').run(); database.prepare('DELETE FROM sales_records').run()
      const saleInsert = database.prepare('INSERT INTO sales_records (id, invoice_number, created_at, customer_id, total, payload) VALUES (?, ?, ?, ?, ?, ?)')
      const itemInsert = database.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal, payload) VALUES (?, ?, ?, ?, ?, ?)')
      rows.forEach((row) => { saleInsert.run(row.id, row.invoiceNumber || null, row.createdAt || '', row.customerId || null, asNumber(row.total), JSON.stringify(row)); asArray(row.items).forEach((item) => itemInsert.run(row.id, item.productId || null, asNumber(item.quantity), asNumber(item.price), asNumber(item.subtotal), JSON.stringify(item))) })
    } else if (key === NORMALIZED_KEYS.customers) {
      database.prepare('DELETE FROM customers').run(); const insert = database.prepare('INSERT INTO customers (id, name, phone, total_debt, payload) VALUES (?, ?, ?, ?, ?)'); rows.forEach((row) => insert.run(row.id, row.name || '', row.phone || null, asNumber(row.totalDebt), JSON.stringify(row)))
    } else if (key === NORMALIZED_KEYS.expenses) {
      database.prepare('DELETE FROM expenses').run(); const insert = database.prepare('INSERT INTO expenses (id, created_at, amount, shift_id, payload) VALUES (?, ?, ?, ?, ?)'); rows.forEach((row) => insert.run(row.id, row.createdAt || '', asNumber(row.amount), row.shiftId || null, JSON.stringify(row)))
    } else if (key === NORMALIZED_KEYS.shifts) {
      database.prepare('DELETE FROM shifts').run(); const insert = database.prepare('INSERT INTO shifts (id, opened_at, closed_at, payload) VALUES (?, ?, ?, ?)'); rows.forEach((row) => insert.run(row.id, row.openedAt || '', row.closedAt || null, JSON.stringify(row)))
    } else if (key === NORMALIZED_KEYS.debtPayments) {
      database.prepare('DELETE FROM debt_payments').run(); const insert = database.prepare('INSERT INTO debt_payments (id, customer_id, created_at, amount, payload) VALUES (?, ?, ?, ?, ?)'); rows.forEach((row) => insert.run(row.id, row.customerId || null, row.createdAt || '', asNumber(row.amount), JSON.stringify(row)))
    }
  })
  tx()
}

function migrateNormalizedTables() {
  const rows = database.prepare('SELECT key, value FROM app_data WHERE key IN (?, ?, ?, ?, ?, ?, ?)').all(...Object.values(NORMALIZED_KEYS))
  rows.forEach((row) => { try { syncNormalizedData(row.key, JSON.parse(row.value)) } catch (error) { console.error('Normalized migration failed:', error) } })
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
    syncNormalizedData(key, value)
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
    syncNormalizedData(key, value)
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

