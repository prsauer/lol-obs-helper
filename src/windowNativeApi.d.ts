/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExternalLinksModule } from "./nativeBridge/modules/externalLinksModule";
import { OBSWSModule } from "./nativeBridge/modules/obsWSModule";
import { VodFilesModule } from "./nativeBridge/modules/vodFilesModule";
import { TrayIconModule } from "./nativeBridge/modules/trayIconModule";
import { LoginModule } from "./nativeBridge/modules/loginModule";

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never;

type NativeApi = {
  links: {
    openExternalURL: OmitFirstArg<ExternalLinksModule["openExternalURL"]>;
  };
  vods: {
    scanFolderForMatches: OmitFirstArg<VodFilesModule["scanFolderForMatches"]>;
    configureVodsFolderProtocol: OmitFirstArg<
      VodFilesModule["configureVodsFolderProtocol"]
    >;
    insertVod: OmitFirstArg<VodFilesModule["insertVod"]>;
    getVodsInfo: OmitFirstArg<VodFilesModule["getVodsInfo"]>;
  };
  trayIcon: {
    hideToSystemTray: OmitFirstArg<TrayIconModule["hideToSystemTray"]>;
  };
  obs: {
    synchronize: OmitFirstArg<OBSWSModule["synchronize"]>;
    startListening: OmitFirstArg<OBSWSModule["startListening"]>;
    logMessage: (
      callback: (
        evt: ElectronOpaqueEvent,
        a: Parameters<OBSWSModule["logMessage"]>
      ) => void
    ) => void;
    removeAll_logMessage_listeners: () => void;
    onConnectionError: (
      callback: (
        evt: ElectronOpaqueEvent,
        a: Parameters<OBSWSModule["onConnectionError"]>
      ) => void
    ) => void;
    removeAll_onConnectionError_listeners: () => void;
    onConnectionStateChange: (
      callback: (
        evt: ElectronOpaqueEvent,
        a: Parameters<OBSWSModule["onConnectionStateChange"]>
      ) => void
    ) => void;
    removeAll_onConnectionStateChange_listeners: () => void;
    onRecordingStateChange: (
      callback: (
        evt: ElectronOpaqueEvent,
        a: Parameters<OBSWSModule["onRecordingStateChange"]>
      ) => void
    ) => void;
    removeAll_onRecordingStateChange_listeners: () => void;
  };
  login: {
    login: OmitFirstArg<LoginModule["login"]>;
  };
};

declare global {
  interface Window {
    native: NativeApi;
  }
}
