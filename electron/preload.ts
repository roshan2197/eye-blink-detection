import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('blinkAPI', {
  notify: () => ipcRenderer.send('BLINK_ALERT'),
});
