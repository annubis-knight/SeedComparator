import { app, BrowserWindow, ipcMain, dialog, safeStorage } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const NUXT_URL = process.env.NUXT_URL ?? 'http://127.0.0.1:3300'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#0a0b14',
    webPreferences: {
      preload: resolve(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'SeedComparator',
    show: false,
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.loadURL(NUXT_URL)
}

function getKeysFilePath() {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) mkdirSync(userDataPath, { recursive: true })
  return resolve(userDataPath, 'api-keys.bin')
}

function loadEncryptedKeys(): Record<string, string> {
  const path = getKeysFilePath()
  if (!existsSync(path)) return {}
  try {
    const buf = readFileSync(path)
    if (!safeStorage.isEncryptionAvailable()) return {}
    const decrypted = safeStorage.decryptString(buf)
    return JSON.parse(decrypted) as Record<string, string>
  } catch {
    return {}
  }
}

function saveEncryptedKeys(keys: Record<string, string>) {
  const path = getKeysFilePath()
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('safeStorage n\'est pas disponible sur cet OS')
  }
  const buf = safeStorage.encryptString(JSON.stringify(keys))
  writeFileSync(path, buf)
}

ipcMain.handle('keys:get', (_e, providerId: string) => {
  const keys = loadEncryptedKeys()
  return keys[providerId] ?? null
})

ipcMain.handle('keys:set', (_e, providerId: string, key: string) => {
  const keys = loadEncryptedKeys()
  keys[providerId] = key
  saveEncryptedKeys(keys)
  return true
})

ipcMain.handle('keys:list', () => {
  const keys = loadEncryptedKeys()
  return Object.keys(keys)
})

ipcMain.handle('dialog:selectFolder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// STORY-106 (FR-071) — Purge les générations non-likées avant de quitter
app.on('before-quit', (event) => {
  event.preventDefault()
  fetch(`${NUXT_URL}/api/generations/purge-unloked`, { method: 'POST' })
    .catch(() => {}) // si le serveur est déjà arrêté, on ignore
    .finally(() => app.exit(0))
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
