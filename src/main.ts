import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    win.loadURL(startUrl);
  } else {
    // Load the HTML file from the dist directory (where Webpack outputs it)
    win.loadFile(path.join(__dirname, 'index.html'));
  }
  
  // Open DevTools for debugging (commented out to prevent auto-opening)
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
