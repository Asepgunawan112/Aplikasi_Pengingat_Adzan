const { app, BrowserWindow, session, Tray, Menu } = require('electron')
const path = require('path')

let mainWindow
let tray = null
let isQuitting = false

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/icon.png')
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
}

function createTray () {
  const iconPath = path.join(__dirname, '../assets/icon.png')
  tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Buka Aplikasi', 
      click: () => {
        mainWindow.show()
      } 
    },
    { 
      type: 'separator' 
    },
    { 
      label: 'Keluar', 
      click: () => {
        isQuitting = true
        app.quit()
      } 
    }
  ])

  tray.setToolTip('Jadwal Sholat')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'geolocation') {
      callback(true)
    } else {
      callback(false)
    }
  })

  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
