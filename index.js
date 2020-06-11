const { app, BrowserWindow, Menu } = require('electron')

function createWindow() {
  // 创建浏览器窗口
  Menu.setApplicationMenu(null)
  let win = new BrowserWindow({
    width: 430,
    height: 255,
    webPreferences: {
      nodeIntegration: true
    }
  })
  // win.resizable = false
  win.webContents.openDevTools();
  win.loadFile(__dirname+'/web/index.html')
  
}

app.whenReady().then(createWindow)