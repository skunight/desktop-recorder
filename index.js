const { app, BrowserWindow, ipcMain, Menu  } = require('electron')
class Application {
  async run() {
    await app.whenReady()
    // 设置无菜单
    Menu.setApplicationMenu(null)
    // 监听线程交互事件
    ipcMain.on('getPath', (event) => {
      event.returnValue = app.getPath('userData')
    })
    this.createWindow()
  }

  createWindow() {
    const win = new BrowserWindow({
      width: 560,
      height: 430,
      webPreferences: {
        // 渲染线程使用node模块
        nodeIntegration: true
      }
    })
    // 窗体调整大小
    // win.resizable = false
    // 打开调试工具
    // win.webContents.openDevTools();
    win.loadFile(__dirname + '/web/index.html')
  }
}
new Application().run()