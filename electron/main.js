const { app, BrowserWindow, Tray, Menu, shell, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const waitOn = require('wait-on')

const DEV_URL = 'http://localhost:3000'
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
    titleBarStyle: 'default',
    show: false,
  })

  mainWindow.loadURL(DEV_URL)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in system browser
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
    // Tray icon optional — may fail if icon.png is missing
    return
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Brain', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Dashboard', click: () => { mainWindow?.show(); mainWindow?.loadURL(`${DEV_URL}/dashboard`) } },
    { label: 'Agents', click: () => { mainWindow?.show(); mainWindow?.loadURL(`${DEV_URL}/agents`) } },
    { label: 'Runner', click: () => { mainWindow?.show(); mainWindow?.loadURL(`${DEV_URL}/runner`) } },
    { type: 'separator' },
    {
      label: 'Quit Brain',
      click: () => {
        isQuitting = true
        app.quit()
      }
    },
  ])

  tray.setToolTip('Brain — Cognitive OS')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow?.show())
}

function startNextServer() {
  const isWin = process.platform === 'win32'
  const npmCmd = isWin ? 'npm.cmd' : 'npm'

  nextProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, BROWSER: 'none' },
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
      'Failed to start the Next.js server. Make sure you ran npm install first.')
  })

  nextProcess.on('exit', (code) => {
    console.log(`Next.js exited with code ${code}`)
    if (!isQuitting) {
      nextProcess = null
    }
  })
}

function stopNextServer() {
  if (nextProcess) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', nextProcess.pid.toString(), '/f', '/t'], { shell: true })
    } else {
      nextProcess.kill('SIGTERM')
    }
    nextProcess = null
  }
}

async function init() {
  // Start the Next.js dev server
  startNextServer()

  // Wait for it to be ready
  try {
    await waitOn({
      resources: [DEV_URL],
      timeout: 30000,
      interval: 500,
    })
  } catch {
    dialog.showErrorBox('Brain — Startup Error',
      'Next.js server did not start in time. Check the console for errors.')
    app.quit()
    return
  }

  createWindow()
  createTray()
}

// Single instance lock
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
    // Keep running in tray on macOS
    if (process.platform !== 'darwin') {
      isQuitting = true
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    } else {
      mainWindow.show()
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
    stopNextServer()
  })
}
