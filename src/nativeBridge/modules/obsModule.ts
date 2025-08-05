import { BrowserWindow, ipcMain } from 'electron';
import { moduleEvent, moduleFunction, nativeBridgeModule, NativeBridgeModule } from '../module';
import type { ObsData, ObsDataValue, ObsProperty, Signal } from 'noobs';
import noobs from 'noobs';
import path from 'path';
import fs from 'fs-extra';
import { ActivityEndedEvent, ActivityStartedEvent, Events, RecordingWrittenEvent } from '../ipcEvents';
import { nativeBridgeRegistry } from '../registry';
import { LeagueLiveClientModule } from './leagueLiveClientModule';

type ObsModuleState = {
  libraryReady: boolean;
  recording: boolean;
  listeningForGame: boolean;
  dataPath: string;
  logPath: string;
  recordingPath: string;
  previewReady: boolean;
  sources: Record<string, { name: string; type: string }>;
  currentActivityId: string | null;
  lastActivityEnded: ActivityEndedEvent | null;
};

type ObsModuleStateDTO = {
  libraryReady: boolean;
  previewReady: boolean;
  recording: boolean;
  listeningForGame: boolean;
  dataPath: string;
  recordingPath: string;
  logPath: string;
  currentActivityId: string | null;
};

const obsModuleState: ObsModuleState = {
  libraryReady: false,
  recording: false,
  listeningForGame: false,
  dataPath: process.env.OBS_REPACKED_PATH
    ? path.resolve(process.env.OBS_REPACKED_PATH)
    : path.resolve(__dirname, 'dist'),
  logPath: 'D:\\Video',
  recordingPath: 'D:\\Video',
  previewReady: false,
  sources: {},
  currentActivityId: null,
  lastActivityEnded: null,
};

@nativeBridgeModule('obs')
export class ObsModule extends NativeBridgeModule {
  /**
   * propertiesBySource are the available settings for each source
   *
   * settingsBySource are the current settings for each source
   */
  @moduleFunction()
  public async discoverSourceProperties(_mainWindow: BrowserWindow) {
    const propertiesBySource: Record<string, ObsProperty[]> = {};
    const settingsBySource: Record<string, ObsData> = {};
    for (const source of Object.keys(obsModuleState.sources)) {
      const properties = noobs.GetSourceProperties(source);
      settingsBySource[source] = noobs.GetSourceSettings(source);
      console.log(JSON.stringify(properties, null, 2));
      propertiesBySource[source] = properties;
    }
    return { propertiesBySource, settingsBySource };
  }

  @moduleFunction()
  public async setSourceProperty(
    _mainWindow: BrowserWindow,
    sourceName: string,
    propertyName: keyof ObsData,
    value: ObsDataValue,
  ) {
    const settings = noobs.GetSourceSettings(sourceName);
    settings[propertyName] = value;
    console.log(`Setting ${propertyName} to ${value} for ${sourceName}`);
    noobs.SetSourceSettings(sourceName, settings);
  }

  public shutdown() {
    console.log('Shutting down OBS');
    noobs.Shutdown();
  }

  private initializeWindowCapture() {
    console.log('Initializing window capture');
    noobs.CreateSource('WinCap', 'window_capture');
    obsModuleState.sources['WinCap'] = { name: 'WinCap', type: 'window_capture' };

    const initSettings = noobs.GetSourceProperties('WinCap');
    let window = '';
    let priority = '';
    let method = '';
    initSettings.forEach((prop) => {
      if (prop.type === 'list') {
        // console.log(prop.items);
        // find monitor and priority values
        if (prop.name === 'window') {
          window = prop.items[1].value as string;
        }
        if (prop.name === 'priority') {
          priority = prop.items[0].value as string;
        }
        if (prop.name === 'method') {
          method = prop.items[0].value as string;
        }
      }
    });

    noobs.SetSourceSettings('WinCap', {
      ...noobs.GetSourceSettings('WinCap'),
      window,
      priority,
      method,
    });
  }

  public initializeMonitorCapture() {
    console.log('Initializing monitor capture');
    noobs.CreateSource('MonCap', 'monitor_capture');
    obsModuleState.sources['MonCap'] = { name: 'MonCap', type: 'monitor_capture' };

    const initSettings = noobs.GetSourceProperties('MonCap');
    let monitor_id = '';
    let method = '';
    initSettings.forEach((prop) => {
      if (prop.type === 'list') {
        // find monitor and priority values
        if (prop.name === 'monitor_id') {
          monitor_id = prop.items[1].value as string;
        }
        if (prop.name === 'method') {
          method = prop.items[0].value as string;
        }
      }
    });

    noobs.SetSourceSettings('MonCap', {
      ...noobs.GetSourceSettings('MonCap'),
      monitor_id,
      method,
    });
  }

  public async initializeGameCapture() {
    console.log('Initializing game capture');
    noobs.CreateSource('GameCap', 'game_capture');
    obsModuleState.sources['GameCap'] = { name: 'GameCap', type: 'game_capture' };

    const initialSettings = noobs.GetSourceSettings('GameCap');
    noobs.SetSourceSettings('GameCap', {
      ...initialSettings,
      capture_mode: 'window',
      window: 'League of Legends (TM) Client:RiotWindowClass:League of Legends.exe',
    });
  }

  @moduleFunction()
  public async configureSource(_mainWindow: BrowserWindow) {
    this.initializeWindowCapture();
    this.initializeMonitorCapture();
    this.initializeGameCapture();

    console.log('Adding source to scene');
    this.setScene(_mainWindow, 'GameCap');
  }

  @moduleFunction()
  public async setScene(_mainWindow: BrowserWindow, sceneName: string) {
    noobs.RemoveSourceFromScene('WinCap');
    noobs.RemoveSourceFromScene('MonCap');
    noobs.RemoveSourceFromScene('GameCap');
    noobs.AddSourceToScene(sceneName);
  }

  @moduleFunction()
  public resizeMovePreview(_mainWindow: BrowserWindow, x: number, y: number, width: number, height: number) {
    if (!obsModuleState.previewReady) {
      return;
    }
    noobs.ShowPreview(x, y, width, height);
    noobs.GetSourcePos('WinCap');
  }

  @moduleFunction()
  public async hidePreview(_mainWindow: BrowserWindow) {
    noobs.HidePreview();
  }

  @moduleFunction()
  public async startListening(mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      console.log('OBS state at start of listening');
      console.log({ obsModuleState });
      console.log('ObsInit');

      const signalHandler = (sig: Signal) => {
        console.log('Signal received:', sig);
        switch (sig.id) {
          case 'starting':
            break;
          case 'start':
            obsModuleState.recording = true;
            ipcMain.emit(Events.RecordingStarted);
            this.emitStateChange(mainWindow);
            break;
          case 'stop':
            this.onRecordingStopped(mainWindow);
            break;
          case 'stopping':
            break;
          case 'saved':
            break;
        }
      };

      noobs.Init(obsModuleState.dataPath, obsModuleState.logPath, obsModuleState.recordingPath, signalHandler);
      this.configureSource(mainWindow);

      const hwnd = mainWindow.getNativeWindowHandle();
      noobs.InitPreview(hwnd);
      obsModuleState.previewReady = true;
      obsModuleState.libraryReady = true;
      this.emitStateChange(mainWindow);
    }

    this.startListeningForGame(mainWindow);
  }

  private onRecordingStopped(mainWindow: BrowserWindow) {
    obsModuleState.recording = false;
    ipcMain.emit(Events.RecordingStopped, {
      video: noobs.GetLastRecording(),
      activityId: obsModuleState.currentActivityId,
    });

    // rename recording file to include activityId
    const lastRecording = noobs.GetLastRecording();
    let newPath = lastRecording;
    if (lastRecording) {
      newPath = path.join(
        obsModuleState.recordingPath,
        `${obsModuleState.lastActivityEnded?.activityId}-${obsModuleState.lastActivityEnded?.metadata['riotGameId']}.mp4`,
      );
      fs.renameSync(lastRecording, newPath);
    }

    const recordingWritten: RecordingWrittenEvent = {
      type: Events.RecordingWritten,
      activityId: obsModuleState.currentActivityId || '',
      metadata: obsModuleState.lastActivityEnded?.metadata || {},
      filename: newPath,
      timestamp: new Date(),
    };
    console.log('ObsModule.recording:written', recordingWritten);
    ipcMain.emit(Events.RecordingWritten, recordingWritten);

    obsModuleState.currentActivityId = null;
    this.emitStateChange(mainWindow);
  }

  private async startListeningForGame(mainWindow: BrowserWindow) {
    if (obsModuleState.listeningForGame) {
      return;
    }
    obsModuleState.listeningForGame = true;
    const leagueModule = nativeBridgeRegistry.getModule('LeagueLiveClientModule') as LeagueLiveClientModule;
    await leagueModule.startListeningForGame(mainWindow);
    ipcMain.addListener(Events.ActivityStarted, (activityData: ActivityStartedEvent) => {
      obsModuleState.lastActivityEnded = null;
      console.log('[OBS] Activity started', activityData);
      this.startRecording(mainWindow, activityData.activityId);
    });
    ipcMain.addListener(Events.ActivityEnded, (activityData) => {
      console.log('[OBS] Activity ended', activityData);
      obsModuleState.lastActivityEnded = activityData;
      this.stopRecording(mainWindow);
    });
  }

  @moduleFunction()
  public async startRecording(_mainWindow: BrowserWindow, activityId: string) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = true;

    const leagueModule = nativeBridgeRegistry.getModule('LeagueLiveClientModule') as LeagueLiveClientModule;
    const activePlayerName = await leagueModule.getActivePlayerName(_mainWindow);
    console.log({ activePlayerName });

    console.log(`${new Date()} Starting recording`);
    noobs.StartRecording(0);
    obsModuleState.currentActivityId = activityId;
    this.emitStateChange(_mainWindow);
  }

  @moduleFunction()
  public stopRecording(_mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = false;
    noobs.StopRecording();
    this.emitStateChange(_mainWindow);
  }

  public async setRecordingNamePrefix(_prefix: string) {
    if (!obsModuleState.libraryReady) {
      return;
    }
  }

  @moduleFunction()
  public async readObsModuleState(_mainWindow: BrowserWindow): Promise<ObsModuleStateDTO> {
    return {
      libraryReady: obsModuleState.libraryReady,
      previewReady: obsModuleState.previewReady,
      recording: obsModuleState.recording,
      listeningForGame: obsModuleState.listeningForGame,
      dataPath: obsModuleState.dataPath,
      recordingPath: obsModuleState.recordingPath,
      logPath: obsModuleState.logPath,
      currentActivityId: obsModuleState.currentActivityId,
    };
  }

  @moduleEvent('on')
  public logMessage(_mainWindow: BrowserWindow, _message: string) {
    return;
  }

  private emitStateChange(mainWindow: BrowserWindow) {
    this.onObsModuleStateChange(mainWindow, {
      libraryReady: obsModuleState.libraryReady,
      previewReady: obsModuleState.previewReady,
      recording: obsModuleState.recording,
      dataPath: obsModuleState.dataPath,
      listeningForGame: obsModuleState.listeningForGame,
      recordingPath: obsModuleState.recordingPath,
      logPath: obsModuleState.logPath,
      currentActivityId: obsModuleState.currentActivityId,
    });
  }

  @moduleEvent('on')
  public onObsModuleStateChange(_mainWindow: BrowserWindow, _state: ObsModuleStateDTO) {
    return;
  }
}
