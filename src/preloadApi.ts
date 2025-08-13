/* eslint-disable @typescript-eslint/no-explicit-any */
import { IpcRendererEvent, ipcRenderer } from 'electron';

export const modulesApi = {
  links: { openExternalURL: (...args: any[]) => ipcRenderer.invoke('native:links:openExternalURL', ...args) },
  vods: {
    scanFolderForMatches: (...args: any[]) => ipcRenderer.invoke('native:vods:scanFolderForMatches', ...args),
    insertVod: (...args: any[]) => ipcRenderer.invoke('native:vods:insertVod', ...args),
    getActivitiesData: (...args: any[]) => ipcRenderer.invoke('native:vods:getActivitiesData', ...args),
    getVodsInfo: (...args: any[]) => ipcRenderer.invoke('native:vods:getVodsInfo', ...args),
  },
  trayIcon: { hideToSystemTray: (...args: any[]) => ipcRenderer.invoke('native:trayIcon:hideToSystemTray', ...args) },
  obs: {
    discoverSourceProperties: (...args: any[]) => ipcRenderer.invoke('native:obs:discoverSourceProperties', ...args),
    setSourceProperty: (...args: any[]) => ipcRenderer.invoke('native:obs:setSourceProperty', ...args),
    configureSource: (...args: any[]) => ipcRenderer.invoke('native:obs:configureSource', ...args),
    setScene: (...args: any[]) => ipcRenderer.invoke('native:obs:setScene', ...args),
    resizeMovePreview: (...args: any[]) => ipcRenderer.invoke('native:obs:resizeMovePreview', ...args),
    hidePreview: (...args: any[]) => ipcRenderer.invoke('native:obs:hidePreview', ...args),
    startListening: (...args: any[]) => ipcRenderer.invoke('native:obs:startListening', ...args),
    startRecording: (...args: any[]) => ipcRenderer.invoke('native:obs:startRecording', ...args),
    stopRecording: (...args: any[]) => ipcRenderer.invoke('native:obs:stopRecording', ...args),
    readObsModuleState: (...args: any[]) => ipcRenderer.invoke('native:obs:readObsModuleState', ...args),
    logMessage: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:obs:logMessage', callback),
    removeAll_logMessage_listeners: () => ipcRenderer.removeAllListeners('native:obs:logMessage'),
    onObsModuleStateChange: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:obs:onObsModuleStateChange', callback),
    removeAll_onObsModuleStateChange_listeners: () =>
      ipcRenderer.removeAllListeners('native:obs:onObsModuleStateChange'),
  },
  login: {
    didLogin: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:login:didLogin', callback),
    removeAll_didLogin_listeners: () => ipcRenderer.removeAllListeners('native:login:didLogin'),
  },
  leagueLiveClient: {
    startListeningForGame: (...args: any[]) =>
      ipcRenderer.invoke('native:leagueLiveClient:startListeningForGame', ...args),
    stopListeningForGame: (...args: any[]) =>
      ipcRenderer.invoke('native:leagueLiveClient:stopListeningForGame', ...args),
    onNewGameDetected: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:leagueLiveClient:onNewGameDetected', callback),
    removeAll_onNewGameDetected_listeners: () =>
      ipcRenderer.removeAllListeners('native:leagueLiveClient:onNewGameDetected'),
    onGameEnded: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
      ipcRenderer.on('native:leagueLiveClient:onGameEnded', callback),
    removeAll_onGameEnded_listeners: () => ipcRenderer.removeAllListeners('native:leagueLiveClient:onGameEnded'),
  },
};
