/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExternalLinksModule } from "./nativeBridge/modules/externalLinksModule";
import { VodFilesModule } from "./nativeBridge/modules/vodFilesModule";
import { TrayIconModule } from "./nativeBridge/modules/trayIconModule";
import { OBSWSModule } from "./nativeBridge/modules/oBSWSModule";
import { LoginModule } from "./nativeBridge/modules/loginModule";

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;
type AsEventFunction<F> = F extends (x: any, ...args: infer P) => infer R
    ? (event: ElectronOpaqueEvent, ...args: P) => R
    : never;

type NativeApi = {links: {openExternalURL: OmitFirstArg<ExternalLinksModule["openExternalURL"]>,},vods: {scanFolderForMatches: OmitFirstArg<VodFilesModule["scanFolderForMatches"]>,configureVodsFolderProtocol: OmitFirstArg<VodFilesModule["configureVodsFolderProtocol"]>,insertVod: OmitFirstArg<VodFilesModule["insertVod"]>,getVodsInfo: OmitFirstArg<VodFilesModule["getVodsInfo"]>,},trayIcon: {hideToSystemTray: OmitFirstArg<TrayIconModule["hideToSystemTray"]>,},obs: {synchronize: OmitFirstArg<OBSWSModule["synchronize"]>,startListening: OmitFirstArg<OBSWSModule["startListening"]>,logMessage: (callback: AsEventFunction<OBSWSModule["logMessage"]>) => void,removeAll_logMessage_listeners: () => void,onConnectionError: (callback: AsEventFunction<OBSWSModule["onConnectionError"]>) => void,removeAll_onConnectionError_listeners: () => void,onConnectionStateChange: (callback: AsEventFunction<OBSWSModule["onConnectionStateChange"]>) => void,removeAll_onConnectionStateChange_listeners: () => void,onRecordingStateChange: (callback: AsEventFunction<OBSWSModule["onRecordingStateChange"]>) => void,removeAll_onRecordingStateChange_listeners: () => void,},login: {didLogin: (callback: AsEventFunction<LoginModule["didLogin"]>) => void,removeAll_didLogin_listeners: () => void,},};

declare global {
      interface Window {
        native: NativeApi;
      }
    }
    