import { app, BrowserWindow, Tray, Menu, Notification } from 'electron';
import * as path from 'path';
import { ipcMain } from 'electron';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = !app.isPackaged;

  mainWindow.loadURL(
    isDev ? 'http://localhost:4200' : `file://${path.join(__dirname, '../dist/index.html')}`,
  );

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide(); // run in background
  });
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

  tray = new Tray(path.join(__dirname, 'tray.png'));

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
        click: () => app.exit(),
      },
    ]),
  );
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
