/* eslint-disable @typescript-eslint/no-explicit-any */
import { IpcRendererEvent, ipcRenderer } from 'electron';

export const modulesApi = {
  links: { openExternalURL: (...args: any[]) => ipcRenderer.invoke('native:links:openExternalURL', ...args) },
  vods: {
    scanFolderForMatches: (...args: any[]) => ipcRenderer.invoke('native:vods:scanFolderForMatches', ...args),
    configureVodsFolderProtocol: (...args: any[]) =>
      ipcRenderer.invoke('native:vods:configureVodsFolderProtocol', ...args),
    insertVod: (...args: any[]) => ipcRenderer.invoke('native:vods:insertVod', ...args),
    getVodsInfo: (...args: any[]) => ipcRenderer.invoke('native:vods:getVodsInfo', ...args),
  },
  trayIcon: { hideToSystemTray: (...args: any[]) => ipcRenderer.invoke('native:trayIcon:hideToSystemTray', ...args) },
  obs: {
    synchronize: (...args: any[]) => ipcRenderer.invoke('native:obs:synchronize', ...args),
    startListening: (...args: any[]) => ipcRenderer.invoke('native:obs:startListening', ...args),
    logMessage: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:obs:logMessage', callback),
    removeAll_logMessage_listeners: () => ipcRenderer.removeAllListeners('native:obs:logMessage'),
    onConnectionError: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:obs:onConnectionError', callback),
    removeAll_onConnectionError_listeners: () => ipcRenderer.removeAllListeners('native:obs:onConnectionError'),
    onConnectionStateChange: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:obs:onConnectionStateChange', callback),
    removeAll_onConnectionStateChange_listeners: () =>
      ipcRenderer.removeAllListeners('native:obs:onConnectionStateChange'),
    onRecordingStateChange: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:obs:onRecordingStateChange', callback),
    removeAll_onRecordingStateChange_listeners: () =>
      ipcRenderer.removeAllListeners('native:obs:onRecordingStateChange'),
  },
  login: {
    didLogin: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:login:didLogin', callback),
    removeAll_didLogin_listeners: () => ipcRenderer.removeAllListeners('native:login:didLogin'),
  },
};
