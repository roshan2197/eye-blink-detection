"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var electron_2 = require("electron");
var mainWindow = null;
var tray = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    var isDev = !electron_1.app.isPackaged;
    mainWindow.loadURL(isDev ? 'http://localhost:4200' : "file://".concat(path.join(__dirname, '../dist/index.html')));
    mainWindow.on('close', function (e) {
        e.preventDefault();
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.hide(); // run in background
    });
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
    tray = new electron_1.Tray(path.join(__dirname, 'tray.png'));
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
            click: function () { return electron_1.app.exit(); },
        },
    ]));
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
