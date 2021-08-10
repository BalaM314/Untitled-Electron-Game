const electron = require('electron');
const {app, BrowserWindow} = electron;
const path = require('path');

function createWindow(){
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0){
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin'){
    app.quit();
  }
});
