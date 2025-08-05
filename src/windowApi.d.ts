/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExternalLinksModule } from './nativeBridge/modules/externalLinksModule';
import { VodFilesModule } from './nativeBridge/modules/vodFilesModule';
import { TrayIconModule } from './nativeBridge/modules/trayIconModule';
import { ObsModule } from './nativeBridge/modules/obsModule';
import { LoginModule } from './nativeBridge/modules/loginModule';
import { LeagueLiveClientModule } from './nativeBridge/modules/leagueLiveClientModule';

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;
type AsEventFunction<F> = F extends (x: any, ...args: infer P) => infer R
  ? (event: ElectronOpaqueEvent, ...args: P) => R
  : never;

type NativeApi = {
  links: { openExternalURL: OmitFirstArg<ExternalLinksModule['openExternalURL']> };
  vods: {
    scanFolderForMatches: OmitFirstArg<VodFilesModule['scanFolderForMatches']>;
    insertVod: OmitFirstArg<VodFilesModule['insertVod']>;
    getVodsInfo: OmitFirstArg<VodFilesModule['getVodsInfo']>;
  };
  trayIcon: { hideToSystemTray: OmitFirstArg<TrayIconModule['hideToSystemTray']> };
  obs: {
    discoverSourceProperties: OmitFirstArg<ObsModule['discoverSourceProperties']>;
    setSourceProperty: OmitFirstArg<ObsModule['setSourceProperty']>;
    configureSource: OmitFirstArg<ObsModule['configureSource']>;
    setScene: OmitFirstArg<ObsModule['setScene']>;
    resizeMovePreview: OmitFirstArg<ObsModule['resizeMovePreview']>;
    hidePreview: OmitFirstArg<ObsModule['hidePreview']>;
    startListening: OmitFirstArg<ObsModule['startListening']>;
    startRecording: OmitFirstArg<ObsModule['startRecording']>;
    stopRecording: OmitFirstArg<ObsModule['stopRecording']>;
    readObsModuleState: OmitFirstArg<ObsModule['readObsModuleState']>;
    logMessage: (callback: AsEventFunction<ObsModule['logMessage']>) => void;
    removeAll_logMessage_listeners: () => void;
    onObsModuleStateChange: (callback: AsEventFunction<ObsModule['onObsModuleStateChange']>) => void;
    removeAll_onObsModuleStateChange_listeners: () => void;
  };
  login: {
    didLogin: (callback: AsEventFunction<LoginModule['didLogin']>) => void;
    removeAll_didLogin_listeners: () => void;
  };
  leagueLiveClient: {
    startListeningForGame: OmitFirstArg<LeagueLiveClientModule['startListeningForGame']>;
    stopListeningForGame: OmitFirstArg<LeagueLiveClientModule['stopListeningForGame']>;
    getAllGameData: OmitFirstArg<LeagueLiveClientModule['getAllGameData']>;
    getActivePlayer: OmitFirstArg<LeagueLiveClientModule['getActivePlayer']>;
    getActivePlayerName: OmitFirstArg<LeagueLiveClientModule['getActivePlayerName']>;
    getActivePlayerAbilities: OmitFirstArg<LeagueLiveClientModule['getActivePlayerAbilities']>;
    getActivePlayerRunes: OmitFirstArg<LeagueLiveClientModule['getActivePlayerRunes']>;
    getPlayerList: OmitFirstArg<LeagueLiveClientModule['getPlayerList']>;
    getPlayerItems: OmitFirstArg<LeagueLiveClientModule['getPlayerItems']>;
    getPlayerMainRunes: OmitFirstArg<LeagueLiveClientModule['getPlayerMainRunes']>;
    getPlayerScores: OmitFirstArg<LeagueLiveClientModule['getPlayerScores']>;
    getPlayerSummonerSpells: OmitFirstArg<LeagueLiveClientModule['getPlayerSummonerSpells']>;
    getEventData: OmitFirstArg<LeagueLiveClientModule['getEventData']>;
    getGameStats: OmitFirstArg<LeagueLiveClientModule['getGameStats']>;
    isGameActive: OmitFirstArg<LeagueLiveClientModule['isGameActive']>;
    onNewGameDetected: (callback: AsEventFunction<LeagueLiveClientModule['onNewGameDetected']>) => void;
    removeAll_onNewGameDetected_listeners: () => void;
    onGameEnded: (callback: AsEventFunction<LeagueLiveClientModule['onGameEnded']>) => void;
    removeAll_onGameEnded_listeners: () => void;
  };
};

declare global {
  interface Window {
    native: NativeApi;
  }
}
