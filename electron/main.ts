import { app, BrowserWindow, Tray, Menu, Notification } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ipcMain } from 'electron';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function getRendererEntryPath() {
  return path.join(app.getAppPath(), 'dist', 'eye-blink-detection', 'browser', 'index.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadFile(getRendererEntryPath());
  }

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide(); // run in background
  });
}

function createTray() {
  const trayIconPath = path.join(__dirname, 'tray.png');
  if (!fs.existsSync(trayIconPath)) {
    return;
  }

  tray = new Tray(trayIconPath);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open',
        click: () => mainWindow?.show(),
      },
      {
        label: 'Start on Boot',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked,
            openAsHidden: true,
          });
        },
      },
      {
        label: 'Quit',
        click: () => {
          mainWindow?.removeAllListeners('close');
          app.quit();
        },
      },
    ]),
  );
}

app.whenReady().then(() => {
  // Enable auto-start
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
  });

  createWindow();

  if (app.getLoginItemSettings().wasOpenedAtLogin) {
    mainWindow?.hide();
  }

  createTray();
});

app.on('window-all-closed', () => {
  // DO NOTHING → keep running
});

ipcMain.on('BLINK_ALERT', () => {
  new Notification({
    title: 'Blink Reminder',
    body: 'You have not blinked for a while 👁️',
  }).show();
});
