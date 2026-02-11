"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var fs = require("fs");
var path = require("path");
var electron_2 = require("electron");
var mainWindow = null;
var tray = null;
function getRendererEntryPath() {
    return path.join(electron_1.app.getAppPath(), 'dist', 'eye-blink-detection', 'browser', 'index.html');
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    var isDev = !electron_1.app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:4200');
    }
    else {
        mainWindow.loadFile(getRendererEntryPath());
    }
    mainWindow.on('close', function (e) {
        e.preventDefault();
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.hide(); // run in background
    });
}
function createTray() {
    var trayIconPath = path.join(__dirname, 'tray.png');
    if (!fs.existsSync(trayIconPath)) {
        return;
    }
    tray = new electron_1.Tray(trayIconPath);
    tray.setContextMenu(electron_1.Menu.buildFromTemplate([
        {
            label: 'Open',
            click: function () { return mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show(); },
        },
        {
            label: 'Start on Boot',
            type: 'checkbox',
            checked: electron_1.app.getLoginItemSettings().openAtLogin,
            click: function (menuItem) {
                electron_1.app.setLoginItemSettings({
                    openAtLogin: menuItem.checked,
                    openAsHidden: true,
                });
            },
        },
        {
            label: 'Quit',
            click: function () {
                var _a;
                (_a = mainWindow) === null || _a === void 0 ? void 0 : _a.removeAllListeners('close');
                electron_1.app.quit();
            },
        },
    ]));
}
electron_1.app.whenReady().then(function () {
    // Enable auto-start
    electron_1.app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
    });
    createWindow();
    if (electron_1.app.getLoginItemSettings().wasOpenedAtLogin) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.hide();
    }
    createTray();
});
electron_1.app.on('window-all-closed', function () {
    // DO NOTHING → keep running
});
electron_2.ipcMain.on('BLINK_ALERT', function () {
    new electron_1.Notification({
        title: 'Blink Reminder',
        body: 'You have not blinked for a while 👁️',
    }).show();
});
