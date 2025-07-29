import { BrowserWindow, ipcMain } from 'electron';
import { moduleEvent, moduleFunction, nativeBridgeModule, NativeBridgeModule } from '../module';
import type { ObsData, ObsDataValue, ObsProperty, Signal } from 'noobs';
import noobs from 'noobs';
import path from 'path';
import { Events } from '../ipcEvents';
import { nativeBridgeRegistry } from '../registry';
import { LeagueLiveClientModule } from './leagueLiveClientModule';

type ObsModuleState = {
  libraryReady: boolean;
  recording: boolean;
  listeningForGame: boolean;
  pluginPath: string;
  dataPath: string;
  logPath: string;
  recordingPath: string;
  previewReady: boolean;
  sources: Record<string, { name: string; type: string }>;
};

type ObsModuleStateDTO = {
  libraryReady: boolean;
  previewReady: boolean;
  recording: boolean;
  pluginPath: string;
  listeningForGame: boolean;
  dataPath: string;
  recordingPath: string;
  logPath: string;
};

const obsModuleState: ObsModuleState = {
  libraryReady: false,
  recording: false,
  listeningForGame: false,
  pluginPath: path.resolve(__dirname, 'dist', 'plugins'),
  dataPath: path.resolve(__dirname, 'dist', 'effects'),
  logPath: 'D:\\Video',
  recordingPath: 'D:\\Video',
  previewReady: false,
  sources: {},
};

@nativeBridgeModule('obs')
export class ObsModule extends NativeBridgeModule {
  @moduleFunction()
  public async discoverSourceProperties(_mainWindow: BrowserWindow) {
    const propsBySource: Record<string, ObsProperty[]> = {};
    for (const source of Object.keys(obsModuleState.sources)) {
      const properties = noobs.GetSourceProperties(source);
      console.log(properties);
      propsBySource[source] = properties;
    }
    return propsBySource;
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

  @moduleFunction()
  public async configureSource(_mainWindow: BrowserWindow) {
    noobs.CreateSource('MonCap', 'monitor_capture');
    noobs.CreateSource('WinCap', 'window_capture');
    obsModuleState.sources['MonCap'] = { name: 'MonCap', type: 'monitor_capture' };
    obsModuleState.sources['WinCap'] = { name: 'WinCap', type: 'window_capture' };
    // noobs.CreateSource('GameCap', 'monitor_capture');

    const sourceName = 'MonCap';

    // noobs.CreateSource(sourceName, 'monitor_capture');

    // const settings1 = noobs.GetSourceSettings(sourceName);
    // // noobs.SetSourceSettings(sourceName, { ...settings1, monitor: 0 });
    // noobs.SetSourceSettings(sourceName, {
    //   ...settings1,
    //   method: 2, // WGC: Windows Graphics Capture
    //   window: 'World of Warcraft:waApplication Window:WowClassic.exe',
    //   compatibility: true,
    // });

    // const properties = noobs.GetSourceProperties(sourceName);
    // console.log('Source properties:', { properties });
    // for (const property of properties) {
    //   if (property.type === 'list') {
    //     for (const item of property.items) {
    //       if (item.name.startsWith('Acer')) {
    //         noobs.SetSourceSettings(sourceName, {
    //           ...settings1,
    //           monitor_id: item.value,
    //         });
    //       }
    //       console.log(item);
    //     }
    //   }
    // }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // console.log('Source properties:', (properties[0] as unknown as any).items);

    const settings2 = noobs.GetSourceSettings(sourceName);
    console.log(settings2);

    console.log('Adding source to scene');
    noobs.AddSourceToScene(sourceName);
  }

  @moduleFunction()
  public resizeMovePreview(_mainWindow: BrowserWindow, x: number, y: number, width: number, height: number) {
    if (!obsModuleState.previewReady) {
      return;
    }
    noobs.ShowPreview(x, y, width, height);
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
            // TODO: How to service args with noobs lib?
            // {
            //   outputActive: boolean;
            //   outputState: string;
            //   outputPath: string;
            // }
            this.onRecordingStateChange(mainWindow, {
              outputActive: true,
              outputState: 'recording',
              outputPath: '',
            });
            this.emitStateChange(mainWindow);
            break;
          case 'stop':
            obsModuleState.recording = false;
            ipcMain.emit(Events.RecordingStopped);
            console.log({ lastRecording: noobs.GetLastRecording() });
            // TODO: How to service args with noobs lib?
            this.onRecordingStateChange(mainWindow, {
              outputActive: false,
              outputState: 'stopped',
              outputPath: '',
            });
            this.emitStateChange(mainWindow);
            break;
          case 'stopping':
            break;
          case 'saved':
            break;
        }
      };

      noobs.Init(
        obsModuleState.pluginPath,
        obsModuleState.logPath,
        obsModuleState.dataPath,
        obsModuleState.recordingPath,
        signalHandler,
      );
      this.configureSource(mainWindow);

      console.log('Getting native window handle');
      const hwnd = mainWindow.getNativeWindowHandle();
      console.log({ hwnd, mainWindow });
      console.log('Init preview');
      noobs.InitPreview(hwnd);
      noobs.ShowPreview(500, 400, 1920 / 4, 1080 / 4);
      obsModuleState.previewReady = true;
      obsModuleState.libraryReady = true; // TODO: move this into signal?
      this.emitStateChange(mainWindow);
    }

    this.startListeningForGame(mainWindow);
  }

  private async startListeningForGame(mainWindow: BrowserWindow) {
    if (obsModuleState.listeningForGame) {
      return;
    }
    obsModuleState.listeningForGame = true;
    const leagueModule = nativeBridgeRegistry.getModule('LeagueLiveClientModule') as LeagueLiveClientModule;
    await leagueModule.startListeningForGame(mainWindow);
    ipcMain.addListener(Events.LeagueGameDetected, (gameData) => {
      console.log('League game detected', gameData);
      this.startRecording(mainWindow);
    });
    ipcMain.addListener(Events.LeagueGameEnded, (gameData) => {
      console.log('League game ended', gameData);
      this.stopRecording(mainWindow);
    });
  }

  @moduleFunction()
  public async startRecording(_mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = true;

    const leagueModule = nativeBridgeRegistry.getModule('LeagueLiveClientModule') as LeagueLiveClientModule;
    const activePlayerName = await leagueModule.getActivePlayerName(_mainWindow);
    console.log({ activePlayerName });

    console.log('Starting recording');
    noobs.StartRecording(0);
    // noobs.setDrawSourceOutline(true);
    this.emitStateChange(_mainWindow);
  }

  @moduleFunction()
  public stopRecording(_mainWindow: BrowserWindow) {
    if (!obsModuleState.libraryReady) {
      return;
    }
    obsModuleState.recording = false;
    noobs.StopRecording();
    // noobs.setDrawSourceOutline(false);
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
      pluginPath: obsModuleState.pluginPath,
      listeningForGame: obsModuleState.listeningForGame,
      dataPath: obsModuleState.dataPath,
      recordingPath: obsModuleState.recordingPath,
      logPath: obsModuleState.logPath,
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
      pluginPath: obsModuleState.pluginPath,
      dataPath: obsModuleState.dataPath,
      listeningForGame: obsModuleState.listeningForGame,
      recordingPath: obsModuleState.recordingPath,
      logPath: obsModuleState.logPath,
    });
  }

  @moduleEvent('on')
  public onObsModuleStateChange(_mainWindow: BrowserWindow, _state: ObsModuleStateDTO) {
    return;
  }

  @moduleEvent('on')
  public onRecordingStateChange(
    _mainWindow: BrowserWindow,
    _state: { outputActive: boolean; outputState: string; outputPath: string },
  ) {
    return;
  }
}
