const { app, BrowserWindow, Tray, Menu, shell, dialog } = require('electron')
const { spawn, execSync } = require('child_process')
const path = require('path')
const waitOn = require('wait-on')

const PORT = 4747 // Use a unique port to avoid conflicts
const APP_URL = `http://localhost:${PORT}`
const ICON_PATH = path.join(__dirname, 'icon.png')

let mainWindow = null
let nextProcess = null
let tray = null
let isQuitting = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Brain — Cognitive OS',
    icon: ICON_PATH,
    backgroundColor: '#f8f9fa',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  mainWindow.loadURL(APP_URL)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  try {
    tray = new Tray(ICON_PATH)
  } catch {
    return
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Brain', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Dashboard', click: () => { mainWindow?.show(); mainWindow?.loadURL(`${APP_URL}/dashboard`) } },
    { label: 'Agents', click: () => { mainWindow?.show(); mainWindow?.loadURL(`${APP_URL}/agents`) } },
    { label: 'Runner', click: () => { mainWindow?.show(); mainWindow?.loadURL(`${APP_URL}/runner`) } },
    { type: 'separator' },
    { label: 'Quit Brain', click: () => { isQuitting = true; app.quit() } },
  ])

  tray.setToolTip('Brain — Cognitive OS')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow?.show())
}

function startNextServer() {
  const isWin = process.platform === 'win32'
  const npmCmd = isWin ? 'npm.cmd' : 'npm'

  nextProcess = spawn(npmCmd, ['run', 'dev', '--', '-p', String(PORT)], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, BROWSER: 'none', PORT: String(PORT) },
    stdio: 'pipe',
    shell: isWin,
  })

  nextProcess.stdout?.on('data', (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`)
  })
  nextProcess.stderr?.on('data', (data) => {
    console.error(`[Next.js] ${data.toString().trim()}`)
  })
  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js:', err)
    dialog.showErrorBox('Brain — Startup Error',
      'Failed to start the server. Make sure you ran "npm install" first.')
  })
}

function stopNextServer() {
  if (nextProcess) {
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /pid ${nextProcess.pid} /f /t`, { stdio: 'ignore' })
      } catch {}
    } else {
      nextProcess.kill('SIGTERM')
    }
    nextProcess = null
  }
}

async function init() {
  console.log(`[Brain] Starting on ${APP_URL}`)
  startNextServer()

  try {
    await waitOn({
      resources: [`tcp:localhost:${PORT}`],
      timeout: 45000,
      interval: 1000,
    })
    // Give Next.js a moment to finish compiling after port is open
    await new Promise(r => setTimeout(r, 3000))
  } catch {
    dialog.showErrorBox('Brain — Startup Error',
      'Server did not start in time. Check the console for errors.')
    app.quit()
    return
  }

  createWindow()
  createTray()
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(init)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      isQuitting = true
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) createWindow()
    else mainWindow.show()
  })

  app.on('before-quit', () => {
    isQuitting = true
    stopNextServer()
  })
}
