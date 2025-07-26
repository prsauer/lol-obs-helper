/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExternalLinksModule } from './nativeBridge/modules/externalLinksModule';
import { VodFilesModule } from './nativeBridge/modules/vodFilesModule';
import { TrayIconModule } from './nativeBridge/modules/trayIconModule';
import { ObsModule } from './nativeBridge/modules/obsModule';
import { LoginModule } from './nativeBridge/modules/loginModule';

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;
type AsEventFunction<F> = F extends (x: any, ...args: infer P) => infer R
  ? (event: ElectronOpaqueEvent, ...args: P) => R
  : never;

type NativeApi = {
  links: { openExternalURL: OmitFirstArg<ExternalLinksModule['openExternalURL']> };
  vods: {
    scanFolderForMatches: OmitFirstArg<VodFilesModule['scanFolderForMatches']>;
    configureVodsFolderProtocol: OmitFirstArg<VodFilesModule['configureVodsFolderProtocol']>;
    insertVod: OmitFirstArg<VodFilesModule['insertVod']>;
    getVodsInfo: OmitFirstArg<VodFilesModule['getVodsInfo']>;
  };
  trayIcon: { hideToSystemTray: OmitFirstArg<TrayIconModule['hideToSystemTray']> };
  obs: {
    startListening: OmitFirstArg<ObsModule['startListening']>;
    startRecording: OmitFirstArg<ObsModule['startRecording']>;
    stopRecording: OmitFirstArg<ObsModule['stopRecording']>;
    logMessage: (callback: AsEventFunction<ObsModule['logMessage']>) => void;
    removeAll_logMessage_listeners: () => void;
    onRecordingStateChange: (callback: AsEventFunction<ObsModule['onRecordingStateChange']>) => void;
    removeAll_onRecordingStateChange_listeners: () => void;
  };
  login: {
    didLogin: (callback: AsEventFunction<LoginModule['didLogin']>) => void;
    removeAll_didLogin_listeners: () => void;
  };
};

declare global {
  interface Window {
    native: NativeApi;
  }
}
