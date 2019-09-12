import { app, BrowserWindow, ipcMain, Menu, globalShortcut } from 'electron'
const DownloadManager = require("electron-download-manager");
import db from '../db/database'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`


function createDownloadManager(){
  const globalConfig = db.get('config').value()
  DownloadManager.register({downloadFolder: globalConfig.saveDir});
  ipcMain.on('download-list', async (event, args) => {
    event.sender.send('download-list', args)
  })
  ipcMain.on('download-success', async (event, args) => {
    event.sender.send('download-success', args)
  })
  ipcMain.on('download-error', async (event, args) => {
    event.sender.send('download-error', args)
  })
  ipcMain.on('download-current', async (event, args) => {
    event.sender.send('download-current', args)
  })
  ipcMain.on('download-button', async (event, {url,name, headers}) => {
    if(!headers) headers = []
    DownloadManager.bulkDownload({
        urls: [url],
        path: name,
        headers: headers
    }, function (error, finished, errors) {
        if (error) {
            console.log("finished: " + finished);
            console.log("errors: " + errors);
            return;
        }
        event.sender.send('download-url-ok', url)
        console.log("all finished");
    });
  });
}


function createDockMenu(mainWindow){
  const dockMenu = Menu.buildFromTemplate([
    {
      label: '重新启动',
      click () { 
        app.relaunch()
        app.quit()
      }
    }, {
      label: '检查更新',
      click () { 
        mainWindow.webContents.send('sys-check-update');
      }
    }
  ])
  
  app.dock.setMenu(dockMenu)
}

function createAppMenu(mainWindow){
  const menu = Menu.buildFromTemplate([
    {
      label: '检查更新',
      click () { 
        mainWindow.webContents.send('sys-check-update');
      }
    },
    {
      label: '关于',
      click () { 
        
      }
    }
  ])
  Menu.setApplicationMenu(menu)
}

function createWindow () {
  createDownloadManager()
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 750,
    useContentSize: true,
    width: 1000,
    fullscreenable: false,
    center: true,
    resizable: false,
    vibrancy: 'ultra-dark',
    transparent: true,
    backgroundColor: '#fff',
    webPreferences: {webSecurity: false},
    // frame: false,
    titleBarStyle: 'hidden'

  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  ipcMain.on('min', ()=> mainWindow.minimize());

  createAppMenu(mainWindow)
  if(process.platform == 'win32'){
    createDockMenu(mainWindow)
  }
}



app.on('ready', createWindow)

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})


